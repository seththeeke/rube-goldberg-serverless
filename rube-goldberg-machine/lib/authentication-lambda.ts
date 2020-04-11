import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import path = require('path');

export interface AuthenticationLambdaProps {
    readonly stateTable: dynamodb.Table;
    readonly snsTopic: sns.Topic;
}
export class AuthenticationLambda extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: AuthenticationLambdaProps) {
    super(scope, id);

    const authenticationLambda = new lambda.Function(this, "authenticationLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../authentication-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": props.stateTable.tableName
      }
    });

    props.stateTable.grant(authenticationLambda, "dynamodb:PutItem");

    authenticationLambda.addEventSource(new lambdaEventSource.SnsEventSource(props.snsTopic));
  }
}
