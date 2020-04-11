import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import path = require('path');
import { StateTable } from './state-table';

export interface SNSLambdaProps {
    readonly stateTable: StateTable;
}
/**
 * Contains all resources for the public endpoint of kicking off the machine, the initial lambda and resources like the sns topic
 */
export class SNSLambda extends cdk.Construct {
  readonly snsTopic: sns.Topic;
  constructor(scope: cdk.Construct, id: string, props: SNSLambdaProps) {
    super(scope, id);

    this.snsTopic = new sns.Topic(this, "Topic");

    const snsWritePolicy = new iam.PolicyStatement({
      actions: ["sns:Publish"],
      effect: iam.Effect.ALLOW,
      resources: [this.snsTopic.topicArn]
    });

    const snsLambda = new lambda.Function(this, "snsLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../sns-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": props.stateTable.table.tableName,
        "TOPIC_ARN": this.snsTopic.topicArn
      }
    });

    snsLambda.addToRolePolicy(props.stateTable.dynamoWritePolicy);
    snsLambda.addToRolePolicy(snsWritePolicy);

    const publicApiGateway = new apigateway.RestApi(this, "PublicApi");
    publicApiGateway.root.addMethod('ANY');

    const snsLambdaResource = publicApiGateway.root.addResource('sns-lambda');
    const snsLambdaIntegration = new apigateway.LambdaIntegration(snsLambda);
    snsLambdaResource.addMethod('GET', snsLambdaIntegration);
  }
}
