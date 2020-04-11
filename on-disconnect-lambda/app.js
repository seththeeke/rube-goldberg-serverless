var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        AWS.config.update({region: process.env.AWS_REGION});
        let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
        let deleteParams = {
            TableName: process.env.TABLE_NAME,
            Key: {
              connectionId: event.requestContext.connectionId
            }
        };
        console.log("Deleting connection id: " + JSON.stringify(deleteParams));
        await ddb.deleteItem(deleteParams).promise();

        return { statusCode: 200, body: event.requestContext.connectionId };
    } catch (err) {
        console.log(err);
        return error(err);
    }
};