var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
var axios = require('axios');

exports.lambdaHandler = async (event, context) => {
    try {
        console.log(event);
        AWS.config.update({region: process.env.AWS_REGION});
        let s3 = new AWS.S3({apiVersion: '2006-03-01'});
        let records = event.Records;
        for (let record of records){
            let bucketName = record.s3.bucket.name;
            let requestId = record.s3.object.key;
            updateState("Cognito Authorized Request Lambda", requestId);

            var s3Params = {
                Bucket: bucketName, 
                Key: requestId
            };
            console.log("Getting creds from s3: " + JSON.stringify(s3Params));
            let credentials = await s3.getObject(s3Params).promise();
            let idToken = JSON.parse(credentials.Body.toString('utf-8')).IdToken;
            console.log("Calling out to sqs lambda: " + requestId);
            await axios({
                method: 'post',
                url: process.env.SQS_LAMBA_ENDPOINT,
                data: {
                  requestId: requestId
                },
                headers: {'Authorization': idToken}
            });
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