var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        console.log(event);
        AWS.config.update({region: process.env.AWS_REGION});
        let stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
        let records = event.Records;
        for (let record of records) {
            let requestId = record.body;
            await updateState("Start Step Function Lambda", requestId);
            let stepFunctionInput = {
                requestId
            };
            var stepFunctionStartExecutionParams = {
                stateMachineArn: process.env.STATE_MACHINE_ARN,
                input: "{\"requestId\" : \"" + requestId + "\"}"
            };
            console.log("Starting step function execution: " + JSON.stringify(stepFunctionStartExecutionParams));
            await stepfunctions.startExecution(stepFunctionStartExecutionParams).promise();
        }
        
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