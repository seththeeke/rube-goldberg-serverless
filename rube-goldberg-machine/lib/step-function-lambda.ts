import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import path = require('path');

export interface StepFunctionLambdaProps {
    readonly stateTable: dynamodb.Table;
}
export class StepFunctionLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: StepFunctionLambdaProps) {
    super(scope, id, {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../step-function-lambda')),
      handler: "app.lambdaHandler",
      runtime: lambda.Runtime.NODEJS_12_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "TABLE_NAME": props.stateTable.tableName,
      },
      timeout: cdk.Duration.seconds(120),
      functionName: "StepFunctionLambda",
      description: "Invoked from Step Function State Machine as a task"
    });

    props.stateTable.grant(this, "dynamodb:PutItem");
  }
}
