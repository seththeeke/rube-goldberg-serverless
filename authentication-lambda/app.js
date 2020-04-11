var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        console.log(event);
        AWS.config.update({region: process.env.AWS_REGION});
        let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
        let records = event.Records;
        for (let record of records){
            let requestId = record.Sns.Message;
            
            var stateParams = {
                Item: {
                    "requestId": {
                        S: requestId
                    },
                    "state": {
                        S: "AuthenticationLambda"
                    }
                },
                ReturnConsumedCapacity: "TOTAL",
                TableName: process.env.TABLE_NAME
            };

            console.log("Writing state: " + JSON.stringify(stateParams));
            await ddb.putItem(stateParams).promise();
        }

        return { statusCode: 200, body: JSON.stringify(event) };
    } catch (err) {
        console.log(err);
        return error(err);
    }
};