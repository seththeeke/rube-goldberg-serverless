import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import path = require('path');

export interface SNSLambdaProps {
    readonly stateTable: dynamodb.Table;
    readonly snsTopic: sns.Topic;
}
export class SNSLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: SNSLambdaProps) {
    super(scope, id, {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../sns-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": props.stateTable.tableName,
        "TOPIC_ARN": props.snsTopic.topicArn
      },
      timeout: cdk.Duration.seconds(120),
      functionName: "SNSLambda",
      description: "Invoked via a public endpoint and posts a requestId to an SNS Topic"
    });

    props.stateTable.grant(this, "dynamodb:PutItem");
    props.snsTopic.grantPublish(this);

    const publicApiGateway = new apigateway.RestApi(this, "PublicApi");
    publicApiGateway.root.addMethod('ANY');

    const snsLambdaResource = publicApiGateway.root.addResource('sns-lambda');
    const snsLambdaIntegration = new apigateway.LambdaIntegration(this);
    snsLambdaResource.addMethod('GET', snsLambdaIntegration);
  }
}
