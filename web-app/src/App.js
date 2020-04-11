import React from 'react';
import './App.css';
import AppRouter from './components/AppRouter.js';
import { Link } from "react-router-dom";
import AppFooter from './components/AppFooter.js';
import { BrowserRouter as Router } from "react-router-dom";
import RubeGoldbergMachineService from './services/RubeGoldbergMachineService.js';
import AmplifyRequestService from './services/AmplifyRequestService.js';
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
          <Link to="/">Home</Link>
          <Link to="/some-other-page">Some Other Page</Link>
          <AppRouter
            rubeGoldbergMachineService={this.rubeGoldbergMachineService}
          ></AppRouter>
          <AppFooter></AppFooter>
        </Router>
      </div>
    );
  }
  
}

export default App;