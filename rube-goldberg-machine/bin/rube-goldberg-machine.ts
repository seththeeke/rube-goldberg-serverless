#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RubeGoldbergMachineStack } from '../lib/rube-goldberg-machine-stack';

const app = new cdk.App();
new RubeGoldbergMachineStack(app, 'RubeGoldbergMachineStack', {
    env: {
        region: "us-east-1",
        account: "159622748176"
    }
});
