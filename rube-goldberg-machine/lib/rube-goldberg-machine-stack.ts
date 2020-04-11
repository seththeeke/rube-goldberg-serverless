import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import path = require('path');
import { StateTable } from './state-table';
import { SNSLambda } from './sns-lambda';
import { countResources } from '@aws-cdk/assert';

export class RubeGoldbergMachineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stateTable = new StateTable(this, "StateTable");
    const snsLambda = new SNSLambda(this, "SNSLambda", {
      stateTable: stateTable
    });
    
    // Web Socket Stuffs

    const onConnectLambda = new lambda.Function(this, "onConnectLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../on-connect-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE
    });

    const webSocketApiGateway = new apigateway.CfnApiV2(this, "WebSocketApi", {
      name: "WebSocketApi",
      protocolType: "WEBSOCKET",
      routeSelectionExpression: "$request.body.message"
    });

    const connectIntegration = new apigateway.CfnIntegrationV2(this, "ConnectIntegration", {
      apiId: webSocketApiGateway.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/" + onConnectLambda.functionArn + "/invocations"
    });

    const lambdaPermission = new lambda.CfnPermission(this, "OnConnectPermission", {
      action: "lambda:InvokeFunction",
      functionName: onConnectLambda.functionName,
      principal: "apigateway.amazonaws.com"
    });

    lambdaPermission.addDependsOn(webSocketApiGateway);

    const connectRoute = new apigateway.CfnRouteV2(this, "ConnectRoute", {
      apiId: webSocketApiGateway.ref,
      routeKey: "$connect",
      target: "integrations/" + connectIntegration.ref
    });

    const webSocketDeployment = new apigateway.CfnDeploymentV2(this, "WebSocketDeployment", {
      apiId: webSocketApiGateway.ref
    });

    webSocketDeployment.addDependsOn(connectRoute);

    const webSocketApiGatewayStage = new apigateway.CfnStageV2(this, "WebSocketProdStage", {
      apiId: webSocketApiGateway.ref,
      stageName: "prod",
      deploymentId: webSocketDeployment.ref
    });

    const webSocketApiOutput = new cdk.CfnOutput(this, "WebSocketApiEndpoint", {
      value: "wss://" + webSocketApiGateway.ref + ".execute-api.us-east-1.amazonaws.com/" + webSocketApiGatewayStage.stageName + "/"
    });
    
  }
}
