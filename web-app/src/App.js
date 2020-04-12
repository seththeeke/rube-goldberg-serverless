import React from 'react';
import './App.css';
import AppRouter from './components/AppRouter.js';
import { BrowserRouter as Router } from "react-router-dom";
import RubeGoldbergMachineService from './services/RubeGoldbergMachineService.js';
import AmplifyRequestService from './services/AmplifyRequestService.js';
import github from "./img/github.png";
// AWS Amplify Imports
import Amplify from "aws-amplify";
import config from "./aws-exports";
Amplify.configure(config);

class App extends React.Component {
  constructor(props){
    super(props);
    this.rubeGoldbergMachineServiceApiName = "RubeGoldbergMachineService";
    this.amplifyRequestService = new AmplifyRequestService();
    this.rubeGoldbergMachineService = new RubeGoldbergMachineService(this.amplifyRequestService, this.rubeGoldbergMachineServiceApiName);
  }

  render(){
    return (
      <div className="App">          
        <Router>
          <AppRouter
            rubeGoldbergMachineService={this.rubeGoldbergMachineService}
          ></AppRouter>
          <a target="_blank" rel="noopener noreferrer" href="https://www.github.com/seththeeke/rube-goldberg-serverless">
            <img className="icon" alt="github" src={github}></img>
          </a>
        </Router>
      </div>
    );
  }
  
}

export default App;