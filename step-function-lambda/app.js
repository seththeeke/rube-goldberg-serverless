var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        console.log(event);
        AWS.config.update({region: process.env.AWS_REGION});
        console.log("Updating state to step function lambda: " + event.requestId);
        await updateState("Step Function Lambda", event.requestId);

        console.log("Updating state to done: " + event.requestId);
        await updateState("Done", event.requestId);

        console.log("Updating state to done1: " + event.requestId);
        await updateState("Done1", event.requestId);

        console.log("Updating state to done2: " + event.requestId);
        await updateState("Done2", event.requestId);
        
        return { statusCode: 200, body: JSON.stringify(event) };
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