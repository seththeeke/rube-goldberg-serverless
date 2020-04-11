import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import path = require('path');

export interface StateChangeListenerLambdaProps {
    readonly connectionTable: dynamodb.Table;
    readonly stateTable: dynamodb.Table;
    readonly endpoint: string;
}
export class StateChangeListenerLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: StateChangeListenerLambdaProps) {
    super(scope, id, {
        code: lambda.Code.fromAsset(path.join(__dirname, '../../state-change-listener-lambda')),
        handler: "app.lambdaHandler",
        runtime: lambda.Runtime.NODEJS_12_X,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          "TABLE_NAME": props.connectionTable.tableName,
          "ENDPOINT": props.endpoint
        }
    });
    props.connectionTable.grant(this, "dynamodb:DeleteItem", "dynamodb:Scan");

    const stateChangeEventStream = new lambdaEventSource.DynamoEventSource(props.stateTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 1,
        bisectBatchOnError: true,
        retryAttempts: 10
    });
    this.addEventSource(stateChangeEventStream);

    const managePolicy = new iam.PolicyStatement({
        actions: ["execute-api:ManageConnections"],
        effect: iam.Effect.ALLOW,
        resources: ["*"]
    });

    this.addToRolePolicy(managePolicy);
  }
}
