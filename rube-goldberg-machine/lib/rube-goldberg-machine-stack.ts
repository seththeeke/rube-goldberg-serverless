import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import path = require('path');
import { SNSLambda } from './sns-lambda';
import { OnConnectLambda } from './on-connect-lambda';
import { OnDisconnectLambda } from './on-disconnect-lambda';
import { StateChangeListenerLambda } from './state-change-listener-lambda';
import { WebSocketApi } from './web-socket-api';

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
    
  }
}
