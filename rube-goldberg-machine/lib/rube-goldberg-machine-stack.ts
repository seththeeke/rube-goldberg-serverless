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
    
    // Web Socket Stuffs

    const connectionTable = new dynamodb.Table(this, "ConnectionTable", {
      partitionKey: {
        name: "connectionId",
        type: dynamodb.AttributeType.STRING
      }
    });

    const onConnectLambda = new OnConnectLambda(this, "OnConnectLambda", {
      connectionTable
    });

    const onDisconnectLambda = new OnDisconnectLambda(this, "OnDisconnectLambda", {
      connectionTable
    });

    

    const managePolicy = new iam.PolicyStatement({
      actions: ["execute-api:ManageConnections"],
      effect: iam.Effect.ALLOW,
      resources: ["*"]
    });

    const webSocketApiGateway = new apigateway.CfnApiV2(this, "WebSocketApi", {
      name: "WebSocketApi",
      protocolType: "WEBSOCKET",
      routeSelectionExpression: "$request.body.message"
    });

    // Api Gateway Permissions to Invoke Lambdas
    const onConnectLambdaPermission = new lambda.CfnPermission(this, "OnConnectPermission", {
      action: "lambda:InvokeFunction",
      functionName: onConnectLambda.functionName,
      principal: "apigateway.amazonaws.com"
    });
    onConnectLambdaPermission.addDependsOn(webSocketApiGateway);
    const onDisconnectLambdaPermission = new lambda.CfnPermission(this, "DisconnectPermission", {
      action: "lambda:InvokeFunction",
      functionName: onDisconnectLambda.functionName,
      principal: "apigateway.amazonaws.com"
    });
    onDisconnectLambdaPermission.addDependsOn(webSocketApiGateway);

    // Web Socket Integrations
    const connectIntegration = new apigateway.CfnIntegrationV2(this, "ConnectIntegration", {
      apiId: webSocketApiGateway.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/" + onConnectLambda.functionArn + "/invocations"
    });

    const connectRoute = new apigateway.CfnRouteV2(this, "ConnectRoute", {
      apiId: webSocketApiGateway.ref,
      routeKey: "$connect",
      target: "integrations/" + connectIntegration.ref
    });

    const disconnectIntegration = new apigateway.CfnIntegrationV2(this, "DisconnectIntegration", {
      apiId: webSocketApiGateway.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/" + onDisconnectLambda.functionArn + "/invocations"
    });

    const disconnectRoute = new apigateway.CfnRouteV2(this, "DisconnectRoute", {
      apiId: webSocketApiGateway.ref,
      routeKey: "$disconnect",
      target: "integrations/" + disconnectIntegration.ref
    });

    // Web Socket Deployment Information
    const webSocketDeployment = new apigateway.CfnDeploymentV2(this, "WebSocketDeployment", {
      apiId: webSocketApiGateway.ref
    });

    webSocketDeployment.addDependsOn(connectRoute);
    webSocketDeployment.addDependsOn(disconnectRoute);

    const webSocketApiGatewayStage = new apigateway.CfnStageV2(this, "WebSocketProdStage", {
      apiId: webSocketApiGateway.ref,
      stageName: "prod",
      deploymentId: webSocketDeployment.ref
    });

    const webSocketApiOutput = new cdk.CfnOutput(this, "WebSocketApiEndpoint", {
      value: "wss://" + webSocketApiGateway.ref + ".execute-api.us-east-1.amazonaws.com/" + webSocketApiGatewayStage.stageName + "/"
    });

    const stateChangeListenerLambda = new StateChangeListenerLambda(this, "StateChangeListenerLambda", {
      connectionTable,
      stateTable,
      endpoint: webSocketApiGateway.ref + ".execute-api.us-east-1.amazonaws.com/" + webSocketApiGatewayStage.stageName
    });
    
  }
}
