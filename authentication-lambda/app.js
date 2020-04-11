var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.lambdaHandler = async (event, context) => {
    try {
        console.log(event);
        AWS.config.update({region: process.env.AWS_REGION});
        let cognito = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
        let s3 = new AWS.S3({apiVersion: '2006-03-01'});
        let records = event.Records;
        for (let record of records){
            let requestId = record.Sns.Message;
            await updateState("AuthenticationLambda", requestId);
            // Force Update Password in Case it isn't correct
            var updatePasswordParams = {
                Password: process.env.PASSWORD,
                UserPoolId: process.env.USER_POOL_ID,
                Username: process.env.USERNAME,
                Permanent: true
            };
            console.log("Setting user password: " + JSON.stringify(updatePasswordParams));
            await cognito.adminSetUserPassword(updatePasswordParams).promise();
            // Authenticate User
            var authParams = {
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: process.env.USER_POOL_CLIENT_ID,
                AuthParameters: {
                  'USERNAME': process.env.USERNAME,
                  'PASSWORD': process.env.PASSWORD
                },
                ClientMetadata: {
                  'requestId': requestId,
                }
            };
            await updateState("Authenticating", requestId);
            console.log("Attempting authorization: " + JSON.stringify(authParams));
            let authResult = await cognito.initiateAuth(authParams).promise();
            console.log(authResult);
            await updateState("Authenticated", requestId);
            // Upload access token to S3
            var putObjectParams = {
                Body: JSON.stringify(authResult.AuthenticationResult),
                Bucket: process.env.BUCKET_NAME, 
                Key: requestId
            };
            console.log("Uploading credentials to S3: " + JSON.stringify(putObjectParams));
            await s3.putObject(putObjectParams).promise();
            await updateState("Credentials in S3", requestId);
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