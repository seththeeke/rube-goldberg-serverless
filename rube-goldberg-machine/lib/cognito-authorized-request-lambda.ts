import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import * as s3 from '@aws-cdk/aws-s3';
import path = require('path');

export interface CognitoAuthorizedRequestLambdaProps {
    readonly stateTable: dynamodb.Table;
    readonly credentialsBucket: s3.Bucket;
}
export class CognitoAuthorizedRequestLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: CognitoAuthorizedRequestLambdaProps) {
    super(scope, id, {
        code: lambda.Code.fromAsset(path.join(__dirname, '../../cognito-authorized-request-lambda')),
        handler: "app.lambdaHandler",
        runtime: lambda.Runtime.NODEJS_12_X,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          "TABLE_NAME": props.stateTable.tableName
        },
        timeout: cdk.Duration.seconds(120)
    });

    props.stateTable.grant(this, "dynamodb:PutItem");
    props.credentialsBucket.grantRead(this);
    
    const s3EventSource = new lambdaEventSource.S3EventSource(props.credentialsBucket, {
        events: [s3.EventType.OBJECT_CREATED]
    });
    this.addEventSource(s3EventSource);
  }
}
