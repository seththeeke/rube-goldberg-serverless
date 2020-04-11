var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    console.log("EVENT");
    console.log(event);
    console.log("CONTEXT");
    console.log(context);
    AWS.config.update({region: process.env.AWS_REGION});
    let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    let connectionData;
  
    try {
      connectionData = await ddb.scan({ TableName: process.env.TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
    } catch (e) {
      return { statusCode: 500, body: e.stack };
    }
    console.log("CONNECTION DATA");
    console.log(connectionData);
    
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: process.env.ENDPOINT
    });
    
    const dataChangeEvents = event.Records;
    
    const postCalls = connectionData.Items.map(async ({ connectionId }) => {
      try {
        console.log("CONNECTION ID");
        console.log(connectionId);
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId.S, Data: JSON.stringify(dataChangeEvents) }).promise();
      } catch (e) {
        if (e.statusCode === 410) {
          console.log(`Found stale connection, deleting ${connectionId.S}`);
          await ddb.deleteItem({ TableName: process.env.TABLE_NAME, Key: { connectionId: connectionId.S } }).promise();
        } else {
          console.log(e);
        }
      }
    });
    
    try {
      await Promise.all(postCalls);
    } catch (e) {
      return { statusCode: 500, body: e.stack };
    }
  
    return { statusCode: 200, body: 'Data sent.' };
};