import React from 'react';

class Home extends React.Component {
   constructor(props){
      super(props);
      this.startMachine = this.startMachine.bind(this);
      this.ws = new WebSocket("wss://ir0bypn4ik.execute-api.us-east-1.amazonaws.com/prod/");
   }

   componentDidMount() {
      this.ws.onopen = (evt, other) => {
         console.log(other);
         console.log(evt);
         console.log('connected');
      }
  
      this.ws.onmessage = event => {
         console.log(JSON.parse(event.data));
         let events = JSON.parse(event.data);
         for (let event of events){
            console.log(event.dynamodb.NewImage.state.S);
         }
      }
  
      this.ws.onclose = () => {
         console.log('disconnected');
      }
   }

   startMachine(){
      this.props.rubeGoldbergMachineService.startRubeGoldbergMachine().then(function(event){
         console.log(event);
      }.bind(this));
   }

   render() {
      return (
         <div className='home-container'>
            <button onClick={this.startMachine}>Start Machine</button>
         </div>
      );
   }
}

export default Home;