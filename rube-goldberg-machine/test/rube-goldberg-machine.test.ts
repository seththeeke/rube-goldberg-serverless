import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import RubeGoldbergMachine = require('../lib/rube-goldberg-machine-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new RubeGoldbergMachine.RubeGoldbergMachineStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
