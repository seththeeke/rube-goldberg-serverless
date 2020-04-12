import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import * as sqs from '@aws-cdk/aws-sqs';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import path = require('path');

export interface StartStepFunctionLambdaProps {
    readonly stateTable: dynamodb.Table;
    readonly sqsQueue: sqs.Queue;
    readonly stepFunctionStateMachine: sfn.StateMachine;
}
export class StartStepFunctionLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: StartStepFunctionLambdaProps) {
    super(scope, id, {
        code: lambda.Code.fromAsset(path.join(__dirname, '../../start-step-function-lambda')),
        handler: "app.lambdaHandler",
        runtime: lambda.Runtime.NODEJS_12_X,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          "TABLE_NAME": props.stateTable.tableName,
          "STATE_MACHINE_ARN": props.stepFunctionStateMachine.stateMachineArn
        },
        timeout: cdk.Duration.seconds(120),
        functionName: "StartStepFunctionLambda",
        description: "Reads from an SQS queue and kicks off a step function state machine"
    });

    props.stateTable.grant(this, "dynamodb:PutItem");
    props.stepFunctionStateMachine.grantStartExecution(this);
    
    const sqsEventSource = new lambdaEventSource.SqsEventSource(props.sqsQueue)
    this.addEventSource(sqsEventSource);
  }
}
