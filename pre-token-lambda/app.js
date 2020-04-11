var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    console.log(event);
    console.log(context);
    console.log(event.request.clientMetadata);
    AWS.config.update({region: process.env.AWS_REGION});
    event.response.claimsOverrideDetails = { 
        "claimsToAddOrOverride": { 
            "requestId": "someId"
        }
    }
    return event 
};