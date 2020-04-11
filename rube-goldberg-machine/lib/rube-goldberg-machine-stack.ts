import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import path = require('path');

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

    const dynamoWritePolicy = new iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      effect: iam.Effect.ALLOW,
      resources: [stateTable.tableArn]
    });

    const snsTopic = new sns.Topic(this, "Topic");

    const snsWritePolicy = new iam.PolicyStatement({
      actions: ["sns:Publish"],
      effect: iam.Effect.ALLOW,
      resources: [snsTopic.topicArn]
    });

    const snsLambda = new lambda.Function(this, "snsLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../sns-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": stateTable.tableName,
        "TOPIC_ARN": snsTopic.topicArn
      }
    });

    snsLambda.addToRolePolicy(dynamoWritePolicy);
    snsLambda.addToRolePolicy(snsWritePolicy);

    const publicApiGateway = new apigateway.RestApi(this, "PublicApi");
    publicApiGateway.root.addMethod('ANY');

    const snsLambdaResource = publicApiGateway.root.addResource('sns-lambda');
    const snsLambdaIntegration = new apigateway.LambdaIntegration(snsLambda);
    snsLambdaResource.addMethod('GET', snsLambdaIntegration);
    
  }
}
