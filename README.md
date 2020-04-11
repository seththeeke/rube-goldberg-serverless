This project is a rube goldberg machine showing off all the cool capabilities of serverless tech!

# Setup
Follow the instructions at https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html to ensure your machine is setup correctly

You'll need to bootstrap the account by:

cdk bootstrap aws://159622748176/us-east-1

# Deploy
In order to deploy, you need to run:
npm run build
cdk synth
cdk deploy

Note: You must have appropriate creds setup for the AWS account that is being used

# Web Socket testing

You can test web socket connection using wscat given the web socket url that is exported when a deployment occurs

```
wscat <url>
```