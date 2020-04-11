import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import path = require('path');
import { StateTable } from './state-table';
import { SNSLambda } from './sns-lambda';

export class RubeGoldbergMachineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stateTable = new StateTable(this, "StateTable");
    const snsLambda = new SNSLambda(this, "SNSLambda", {
      stateTable: stateTable
    });
    
    // Web Socket Stuffs
    // const webSocketApiGateway = new apigateway.CfnApiV2(this, "WebSocketApi", {
    //   name: "WebSocketApi",
    //   protocolType: "WEBSOCKET",
    //   routeSelectionExpression: "$request.body.message"
    // });
    
  }
}
