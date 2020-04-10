var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        AWS.config.update({region: process.env.AWS_REGION});
        let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
        var params = {
            Item: {
                "requestId": {
                    S: context.awsRequestId
                },
                "state": {
                    S: "Start"
                }
            },
            ReturnConsumedCapacity: "TOTAL",
            TableName: process.env.TABLE_NAME
        };

        console.log("Writing starting state: " + JSON.stringify(params));
        let dbPutItemResults = await ddb.putItem(params).promise();
        return respond();
    } catch (err) {
        console.log(err);
        return error(err);
    }
};

function respond(){
    return {
        'statusCode': 200,
        'body': JSON.stringify({
            'data': "Hello World"
        }),
        'headers': {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    };
}

function error(message){
    console.log(message);
    return {
        'statusCode': 500,
        'body': JSON.stringify({
            'err': message
        }),
        'headers': {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    };
}