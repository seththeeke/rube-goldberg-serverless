var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        AWS.config.update({region: process.env.AWS_REGION});
        let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
        var startDdbParams = {
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

        console.log("Writing starting state: " + JSON.stringify(startDdbParams));
        await ddb.putItem(startDdbParams).promise();

        var sns = new AWS.SNS({apiVersion: '2010-03-31'});
        var snsParams = {
            Message: context.awsRequestId,
            TopicArn: process.env.TOPIC_ARN
        };
        console.log("Writing message to sns: " + JSON.stringify(startDdbParams));
        await sns.publish(snsParams).promise();

        var snsDBUpdate = {
            Item: {
                "requestId": {
                    S: context.awsRequestId
                },
                "state": {
                    S: "SNS"
                }
            },
            ReturnConsumedCapacity: "TOTAL",
            TableName: process.env.TABLE_NAME
        };

        console.log("Writing sns state update: " + JSON.stringify(startDdbParams));
        await ddb.putItem(snsDBUpdate).promise();

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
            'data': "Machine Started!"
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