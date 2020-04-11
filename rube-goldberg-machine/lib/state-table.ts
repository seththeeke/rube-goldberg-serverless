import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';

export class StateTable extends cdk.Construct {
  readonly dynamoWritePolicy: iam.PolicyStatement;  
  readonly table: dynamodb.Table;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.table = new dynamodb.Table(this, "StateTable", {
      partitionKey: {
        name: "requestId",
        type: dynamodb.AttributeType.STRING
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    this.dynamoWritePolicy = new iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      effect: iam.Effect.ALLOW,
      resources: [this.table.tableArn]
    });
  }
}
