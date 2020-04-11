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
export class SQSLambda extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: SQSLambdaProps) {
    super(scope, id);

    const sqsLambda = new lambda.Function(this, "sqsLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../sqs-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": props.stateTable.tableName,
        "SQS_QUEUE_URL": props.sqsQueue.queueUrl
      }
    });

    props.stateTable.grant(sqsLambda, "dynamodb:PutItem");
    props.sqsQueue.grantSendMessages(sqsLambda);

    const cognitoProtectedApiGateway = new apigateway.RestApi(this, "CognitoProtectedApi");
    cognitoProtectedApiGateway.root.addMethod('ANY');
    const sqsLambdaResource = cognitoProtectedApiGateway.root.addResource('sqs-lambda');

    const cognitoAuthorizer = new apigateway.CfnAuthorizer(this, 'CognitoAuthorizer', {
        name: 'CognitoAuthorizer',
        identitySource: 'method.request.header.Authorization',
        providerArns: [props.userPool.userPoolArn.toString()],
        restApiId: cognitoProtectedApiGateway.restApiId,
        type: apigateway.AuthorizationType.COGNITO
    });
    
    const sqsLambdaIntegration = new apigateway.LambdaIntegration(sqsLambda);
    sqsLambdaResource.addMethod('POST', sqsLambdaIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: {
            authorizerId: cognitoAuthorizer.ref
        }
    });
  }
}
