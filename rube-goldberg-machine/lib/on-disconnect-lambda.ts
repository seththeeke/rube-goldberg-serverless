import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import path = require('path');

export interface OnDisconnectLambdaProps {
    readonly connectionTable: dynamodb.Table;
}
export class OnDisconnectLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: OnDisconnectLambdaProps) {
    super(scope, id, {
        code: lambda.Code.fromAsset(path.join(__dirname, '../../on-disconnect-lambda')),
        handler: "app.lambdaHandler",
        runtime: lambda.Runtime.NODEJS_12_X,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          "TABLE_NAME": props.connectionTable.tableName
        },
        functionName: "WebSocketOnDisconnectLambda",
        description: "Handler for on disconnect events to the web socket api and deletes the connection id in the table"
    });
    props.connectionTable.grant(this, "dynamodb:DeleteItem");
  }
}
