import React from 'react';
import './../css/Home.css';
import text from './../img/text.png';
import slogan from './../img/slogan.png';
import definition from './../img/rube-goldberg-definition.png';

import lambda from './../img/AWS-Lambda_light-bg@4x.png';
import sqs from './../img/Amazon-Simple-Queue-Service-SQS_light-bg@4x.png';
import s3 from './../img/Amazon-Simple-Storage-Service-S3@4x.png';
import cognito from './../img/Amazon-Cognito@4x.png';
import sns from './../img/Amazon-Simple-Notification-Service-SNS_light-bg@4x.png';
import apigateway from './../img/Amazon-API-Gateway@4x.png';
import stepfunction from './../img/AWS-Step-Functions_light-bg@4x.png';

class Home extends React.Component {
   constructor(props){
      super(props);
      this.state = {
         state: "",
         requestId: "",
         tableRows: [],
         machineStarted: false,
         stateIcon: apigateway
      }
      this.descriptionMap = {
         "StartStepFunctionLambda": {
            description: "Your SQS message has been read and is on its way to trigger a step function machine",
            image: stepfunction
         },
         "SQSLambda": {
            description: "Your SQS message has been read and is on it's way to SQS",
            image: lambda
         },
         "SQS": {
            description: "Your request is on an SQS Queue",
            image: sqs
         },
         "CognitoAuthorizedRequestLambda": {
            description: "Your request credentials are being used to access a secure endpoint to put the request on SQS",
            image: lambda
         },
         "CredentialsinS3": {
            description: "Your request credentials for SQS have been put into S3",
            image: s3
         },
         "Authenticated": {
            description: "Your request has authenticated with a Cognito User Pool",
            image: cognito
         },
         "Authenticating": {
            description: "Your request is working on authenticating with a Cognito User Pool",
            image: cognito
         },
         "AuthenticationLambda": {
            description: "Your request is in a Lambda that will attempt to acquire Cognito identity tokens",
            image: lambda
         },
         "SNS": {
            description: "Your request has been published to an SNS Topic",
            image: sns
         },
         "Start": {
            description: "The machine has been started by invoking a lambda function that will publish a message to SNS",
            image: apigateway
         }
      }

      this.buildTableRow = this.buildTableRow.bind(this);
      this.startMachine = this.startMachine.bind(this);
      this.ws = new WebSocket("wss://qdjkqebo39.execute-api.us-east-1.amazonaws.com/prod/");
   }

   componentDidMount() {
      this.ws.onopen = (evt, other) => {
         console.log('connected');
      }
  
      this.ws.onmessage = event => {
         let events = JSON.parse(event.data);
         for (let event of events){
            let newState = event.dynamodb.NewImage.state.S;
            console.log("New state: " + newState);
            if (this.state.requestId.length > 0){
               if (this.state.requestId === event.dynamodb.NewImage.requestId.S){
                  if (this.state.state){
                     let row = this.buildTableRow(this.state.state, this.state.tableRows.length);
                     let rows = this.state.tableRows;
                     rows.unshift(row);
                     this.setState({
                        state: newState,
                        tableRows: rows,
                        stateIcon: this.descriptionMap[newState.replace(/ /g,'')].image
                     });
                  } else {
                     this.setState({
                        state: newState,
                        stateIcon: this.descriptionMap[newState.replace(/ /g,'')].image
                     });
                  }
               }
            }
         }
      }
  
      this.ws.onclose = () => {
         console.log('disconnected');
      }
   }

   buildTableRow(state, key){
      let description = this.descriptionMap[state.replace(/ /g,'')].description;
      return (
         <tr className="tabler-row" key={key}>
            <th className="table-value location-col">{state}</th>
            <th className="table-value description-col">{description}</th>
         </tr>
      );
   }

   startMachine(){
      if (!this.requestId){
         this.props.rubeGoldbergMachineService.startRubeGoldbergMachine().then(function(event){
            this.setState({
               requestId: event.data,
               machineStarted: true
            });
         }.bind(this));
      }
   }

   render() {
      return (
         <div className='home-container'>
            <div><img className="text" src={text} alt="text"/></div>
            <div><img className="slogan" src={slogan} alt="slogan"/></div>
            <div hidden={this.state.machineStarted}>
               <div><img className="definition" src={definition} alt="definition"/></div>
               <div>
                  <button className="start-machine-button" onClick={this.startMachine}>Start!</button>
               </div>
            </div>
            <div hidden={!this.state.machineStarted}>
               <div className="request-id-text">Your request id is: <span className="request-id-val">{this.state.requestId}</span></div>
               <div className="current-state-text">{this.state.state}</div>
               <div><img className="state-icon" src={this.state.stateIcon} alt="stateIcon"/></div>
               <div className="state-table-container">
                  <table className="state-table">
                     <thead>
                        <tr className="tabler-header-row">
                           <th className="table-header location-col">Location</th>
                           <th className="table-header description-col">Description</th>
                        </tr>
                     </thead>
                     <tbody>
                        {this.state.tableRows}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      );
   }
}

export default Home;