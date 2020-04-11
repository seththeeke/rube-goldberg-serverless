import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import * as s3 from '@aws-cdk/aws-s3';
import path = require('path');

export interface AuthenticationLambdaProps {
    readonly stateTable: dynamodb.Table;
    readonly snsTopic: sns.Topic;
    readonly cognitoUsername: string;
    readonly cognitoPassword: string;
    readonly userPoolId: string;
    readonly userPoolClientId: string;
    readonly credentialsBucket: s3.Bucket;
}
export class AuthenticationLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: AuthenticationLambdaProps) {
    super(scope, id, {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../authentication-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": props.stateTable.tableName,
        "USERNAME": props.cognitoUsername,
        "PASSWORD": props.cognitoPassword,
        "USER_POOL_ID": props.userPoolId,
        "USER_POOL_CLIENT_ID": props.userPoolClientId,
        "BUCKET_NAME": props.credentialsBucket.bucketName
      },
      timeout: cdk.Duration.seconds(120),
      functionName: "AuthenticationLambda",
      description: "Reads a request from SNS, authenticates with cognito, and then pushes credentials to S3"
    });

    props.stateTable.grant(this, "dynamodb:PutItem");
    props.credentialsBucket.grantPut(this);

    const authPolicy = new iam.PolicyStatement({
      actions: ["cognito-idp:AdminSetUserPassword", "cognito-idp:InitiateAuth"],
      effect: iam.Effect.ALLOW,
      resources: ["*"]
    });
    
    this.addToRolePolicy(authPolicy);
    this.addEventSource(new lambdaEventSource.SnsEventSource(props.snsTopic));
  }
}
