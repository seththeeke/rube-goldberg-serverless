import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cognito from '@aws-cdk/aws-cognito';
import * as s3 from '@aws-cdk/aws-s3';
import * as sqs from '@aws-cdk/aws-sqs';
import { SNSLambda } from './sns-lambda';
import { StateChangeListenerLambda } from './state-change-listener-lambda';
import { WebSocketApi } from './web-socket-api';
import { AuthenticationLambda } from './authentication-lambda';
import { PreTokenTriggerLambda } from './pre-token-trigger-lambda';
import { CognitoAuthorizedRequestLambda } from './cognito-authorized-request-lambda';
import { SQSLambda } from './sqs-lambda';

export class RubeGoldbergMachineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stateTable = new dynamodb.Table(this, "StateTable", {
      partitionKey: {
        name: "requestId",
        type: dynamodb.AttributeType.STRING
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    const snsTopic = new sns.Topic(this, "Topic");
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

    const preTokenLambdaTrigger = new PreTokenTriggerLambda(this, "PreTokenLambdaTrigger");

    const cognitoUserPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "PrivateUserPool",
      signInAliases: {
        username: true,
      },
      lambdaTriggers: {
        preTokenGeneration: preTokenLambdaTrigger
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

    const credentialsBucket = new s3.Bucket(this, "CredsBucket");

    const authenticationLambda = new AuthenticationLambda(this, "AuthenticationLambda", {
      stateTable,
      snsTopic,
      cognitoUsername: username,
      cognitoPassword: "SomePassword123!",
      userPoolClientId: client.userPoolClientId,
      userPoolId: cognitoUserPool.userPoolId,
      credentialsBucket
    });

    const cognitoAuthorizedRequestLambda = new CognitoAuthorizedRequestLambda(this, "CognitoAuthorizedRequestLambda", {
      stateTable,
      credentialsBucket
    });

    const sqsQueue = new sqs.Queue(this, "SQSQueue");

    const sqsLambda = new SQSLambda(this, "SQSLambda", {
      stateTable,
      userPool: cognitoUserPool,
      sqsQueue
    })
    
  }
}
