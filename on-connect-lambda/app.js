var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        console.log(event.requestContext);
        AWS.config.update({region: process.env.AWS_REGION});
        let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
        var connectionParams = {
            Item: {
                "connectionId": {
                    S: event.requestContext.connectionId
                }
            },
            ReturnConsumedCapacity: "TOTAL",
            TableName: process.env.TABLE_NAME
        };
        console.log("Writing connection id: " + JSON.stringify(connectionParams));
        await ddb.putItem(connectionParams).promise();

        return { statusCode: 200, body: event.requestContext.connectionId };
    } catch (err) {
        console.log(err);
        return error(err);
    }
};