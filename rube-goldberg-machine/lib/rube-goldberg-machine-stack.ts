import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cognito from '@aws-cdk/aws-cognito';
import * as s3 from '@aws-cdk/aws-s3';
import * as sqs from '@aws-cdk/aws-sqs';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { SNSLambda } from './sns-lambda';
import { StateChangeListenerLambda } from './state-change-listener-lambda';
import { WebSocketApi } from './web-socket-api';
import { AuthenticationLambda } from './authentication-lambda';
import { CognitoAuthorizedRequestLambda } from './cognito-authorized-request-lambda';
import { SQSLambda } from './sqs-lambda';
import { StartStepFunctionLambda } from './start-step-function-lambda';

export class RubeGoldbergMachineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stateTable = new dynamodb.Table(this, "RequestStateTable", {
      partitionKey: {
        name: "requestId",
        type: dynamodb.AttributeType.STRING
      },
      readCapacity: 1,
      writeCapacity: 1,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const snsTopic = new sns.Topic(this, "RequestTopic", {
      displayName: "RubeGoldbergServerlessRequestTopic",
      topicName: "RubeGoldbergServerlessRequestTopic",
    });
    const snsLambda = new SNSLambda(this, "SNSLambda", {
      stateTable,
      snsTopic
    });

    const webSocketApi = new WebSocketApi(this, "WebSocketApi");

    const stateChangeListenerLambda = new StateChangeListenerLambda(this, "StateChangeListenerLambda", {
      connectionTable: webSocketApi.connectionTable,
      stateTable,
      endpoint: webSocketApi.ref + ".execute-api.us-east-1.amazonaws.com/prod"
    });

    // Authentication Stuffz

    const cognitoUserPool = new cognito.UserPool(this, "RubeGoldbergUserPool", {
      userPoolName: "RubeGoldbergUserPool",
      signInAliases: {
        username: true,
      }
    });
    const client = cognitoUserPool.addClient("PrivateAppClient", {
      userPoolClientName: "AuthLambdaClient",
      authFlows: {
        userPassword: true,
        refreshToken: true
      }
    });
    let username = "authenticationLambdaUser"
    const authLambdaUser = new cognito.CfnUserPoolUser(this, "AuthLambdaUser", {
      userPoolId: cognitoUserPool.userPoolId,
      username: username
    });

    const credentialsBucket = new s3.Bucket(this, "CognitoCredentialsBucket");

    const authenticationLambda = new AuthenticationLambda(this, "AuthenticationLambda", {
      stateTable,
      snsTopic,
      cognitoUsername: username,
      cognitoPassword: "SomePassword123!",
      userPoolClientId: client.userPoolClientId,
      userPoolId: cognitoUserPool.userPoolId,
      credentialsBucket
    });

    const sqsQueue = new sqs.Queue(this, "SQSQueue", {
      visibilityTimeout: cdk.Duration.seconds(120),
      queueName: "RubeGoldbergSQSQueue"
    });

    const sqsLambda = new SQSLambda(this, "SQSLambda", {
      stateTable,
      userPool: cognitoUserPool,
      sqsQueue
    });

    const cognitoAuthorizedRequestLambda = new CognitoAuthorizedRequestLambda(this, "CognitoAuthorizedRequestLambda", {
      stateTable,
      credentialsBucket,
      sqsLambdaEndpoint: "https://" + sqsLambda.cognitoProtectedApiGateway.restApiId + ".execute-api.us-east-1.amazonaws.com/prod/sqs-lambda"
    });

    const startStepFunctionLambda = new StartStepFunctionLambda(this, "StartStepFunctionLambda", {
      sqsQueue,
      stateTable
    });

  }
}
