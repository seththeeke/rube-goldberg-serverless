import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import path = require('path');

export interface AuthenticationLambdaProps {
    readonly stateTable: dynamodb.Table;
    readonly snsTopic: sns.Topic;
    readonly cognitoUsername: string;
    readonly cognitoPassword: string;
    readonly userPoolId: string;
    readonly userPoolClientId: string;
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
        "TABLE_NAME": props.stateTable.tableName,
        "USERNAME": props.cognitoUsername,
        "PASSWORD": props.cognitoPassword,
        "USER_POOL_ID": props.userPoolId,
        "USER_POOL_CLIENT_ID": props.userPoolClientId
      }
    });

    props.stateTable.grant(authenticationLambda, "dynamodb:PutItem");

    const authPolicy = new iam.PolicyStatement({
      actions: ["cognito-idp:AdminSetUserPassword", "cognito-idp:InitiateAuth"],
      effect: iam.Effect.ALLOW,
      resources: ["*"]
    });
    
    authenticationLambda.addToRolePolicy(authPolicy);
    authenticationLambda.addEventSource(new lambdaEventSource.SnsEventSource(props.snsTopic));
  }
}
