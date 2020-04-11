import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import path = require('path');

export interface OnConnectLambdaProps {
    readonly connectionTable: dynamodb.Table;
}
export class OnConnectLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: OnConnectLambdaProps) {
    super(scope, id, {
        code: lambda.Code.fromAsset(path.join(__dirname, '../../on-connect-lambda')),
        handler: "app.lambdaHandler",
        runtime: lambda.Runtime.NODEJS_12_X,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          "TABLE_NAME": props.connectionTable.tableName
        },
        functionName: "WebSocketOnConnectLambda",
        description: "Serves connection requests to the web socket api, creating an entry in the connection table to be used for sending messages to clients"
    });
    props.connectionTable.grant(this, "dynamodb:PutItem");
  }
}
