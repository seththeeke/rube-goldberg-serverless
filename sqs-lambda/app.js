var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        AWS.config.update({region: process.env.AWS_REGION});
        let sqs = new AWS.SQS({apiVersion: '2012-11-05'});

        let requestId = JSON.parse(event.body).requestId;
        updateState("SQS Lambda", requestId);
        // Add to SQS Queue
        var sqsParams = {
            MessageBody: requestId,
            QueueUrl: process.env.SQS_QUEUE_URL,
        };
        await sqs.sendMessage(sqsParams).promise();
        updateState("SQS", requestId);
        return respond(requestId);
    } catch (err) {
        console.log(err);
        return error(err);
    }
};

async function updateState(state, requestId){
    let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    let stateParams = {
        Item: {
            "requestId": {
                S: requestId
            },
            "state": {
                S: state
            }
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: process.env.TABLE_NAME
    };

    console.log("Writing state: " + JSON.stringify(stateParams));
    await ddb.putItem(stateParams).promise();
}

function respond(requestId){
    return {
        'statusCode': 200,
        'body': JSON.stringify({
            'data': "Message Posted to SQS with RequestId: " + requestId
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