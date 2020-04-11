import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as sqs from '@aws-cdk/aws-sqs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cognito from '@aws-cdk/aws-cognito';
import path = require('path');

export interface SQSLambdaProps {
    readonly stateTable: dynamodb.Table;
    readonly sqsQueue: sqs.Queue;
    readonly userPool: cognito.UserPool;
}
export class SQSLambda extends lambda.Function {
  readonly cognitoProtectedApiGateway: apigateway.RestApi;

  constructor(scope: cdk.Construct, id: string, props: SQSLambdaProps) {
    super(scope, id, {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../sqs-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": props.stateTable.tableName,
        "SQS_QUEUE_URL": props.sqsQueue.queueUrl
      },
      timeout: cdk.Duration.seconds(120),
      functionName: "SQSLambda",
      description: "Invoked through a cognito protected api and posts the request to an SQS queue"
    });

    props.stateTable.grant(this, "dynamodb:PutItem");
    props.sqsQueue.grantSendMessages(this);

    this.cognitoProtectedApiGateway = new apigateway.RestApi(this, "CognitoProtectedApi");
    this.cognitoProtectedApiGateway.root.addMethod('ANY');
    const sqsLambdaResource = this.cognitoProtectedApiGateway.root.addResource('sqs-lambda');

    const cognitoAuthorizer = new apigateway.CfnAuthorizer(this, 'CognitoAuthorizer', {
        name: 'CognitoAuthorizer',
        identitySource: 'method.request.header.Authorization',
        providerArns: [props.userPool.userPoolArn.toString()],
        restApiId: this.cognitoProtectedApiGateway.restApiId,
        type: apigateway.AuthorizationType.COGNITO,
    });
    
    const sqsLambdaIntegration = new apigateway.LambdaIntegration(this);
    sqsLambdaResource.addMethod('POST', sqsLambdaIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: {
            authorizerId: cognitoAuthorizer.ref
        }
    });
  }
}
