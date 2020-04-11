var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        return { statusCode: 200, body: 'Connected.' };
    } catch (err) {
        console.log(err);
        return error(err);
    }
};