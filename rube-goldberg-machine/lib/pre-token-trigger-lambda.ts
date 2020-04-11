import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import path = require('path');

export class PreTokenTriggerLambda extends lambda.Function {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
        code: lambda.Code.fromAsset(path.join(__dirname, '../../pre-token-lambda')),
        handler: "app.lambdaHandler",
        runtime: lambda.Runtime.NODEJS_12_X,
        tracing: lambda.Tracing.ACTIVE
    });
  }
}
