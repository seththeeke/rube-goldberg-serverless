import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { OnConnectLambda } from './on-connect-lambda';
import { OnDisconnectLambda } from './on-disconnect-lambda';

export class WebSocketApi extends apigateway.CfnApiV2 {
  readonly connectionTable: dynamodb.Table; 

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
        name: "WebSocketApi",
        protocolType: "WEBSOCKET",
        routeSelectionExpression: "$request.body.message"
    });

    this.connectionTable = new dynamodb.Table(this, "ConnectionTable", {
      partitionKey: {
        name: "connectionId",
        type: dynamodb.AttributeType.STRING
      }
    });

    const onConnectLambda = new OnConnectLambda(this, "OnConnectLambda", {
      connectionTable: this.connectionTable
    });

    const onDisconnectLambda = new OnDisconnectLambda(this, "OnDisconnectLambda", {
      connectionTable: this.connectionTable
    });

    // Api Gateway Permissions to Invoke Lambdas
    const onConnectLambdaPermission = new lambda.CfnPermission(this, "OnConnectPermission", {
      action: "lambda:InvokeFunction",
      functionName: onConnectLambda.functionName,
      principal: "apigateway.amazonaws.com"
    });
    onConnectLambdaPermission.addDependsOn(this);
    const onDisconnectLambdaPermission = new lambda.CfnPermission(this, "DisconnectPermission", {
      action: "lambda:InvokeFunction",
      functionName: onDisconnectLambda.functionName,
      principal: "apigateway.amazonaws.com"
    });
    onDisconnectLambdaPermission.addDependsOn(this);

    // Web Socket Integrations
    const connectIntegration = new apigateway.CfnIntegrationV2(this, "ConnectIntegration", {
      apiId: this.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/" + onConnectLambda.functionArn + "/invocations"
    });

    const connectRoute = new apigateway.CfnRouteV2(this, "ConnectRoute", {
      apiId: this.ref,
      routeKey: "$connect",
      target: "integrations/" + connectIntegration.ref
    });

    const disconnectIntegration = new apigateway.CfnIntegrationV2(this, "DisconnectIntegration", {
      apiId: this.ref,
      integrationType: "AWS_PROXY",
      integrationUri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/" + onDisconnectLambda.functionArn + "/invocations"
    });

    const disconnectRoute = new apigateway.CfnRouteV2(this, "DisconnectRoute", {
      apiId: this.ref,
      routeKey: "$disconnect",
      target: "integrations/" + disconnectIntegration.ref
    });

    // Web Socket Deployment Information
    const webSocketDeployment = new apigateway.CfnDeploymentV2(this, "WebSocketDeployment", {
      apiId: this.ref
    });

    webSocketDeployment.addDependsOn(connectRoute);
    webSocketDeployment.addDependsOn(disconnectRoute);

    const thisStage = new apigateway.CfnStageV2(this, "WebSocketProdStage", {
      apiId: this.ref,
      stageName: "prod",
      deploymentId: webSocketDeployment.ref
    });

    const webSocketApiOutput = new cdk.CfnOutput(this, "WebSocketApiEndpoint", {
      value: "wss://" + this.ref + ".execute-api.us-east-1.amazonaws.com/" + thisStage.stageName + "/"
    });
    
  }
}
