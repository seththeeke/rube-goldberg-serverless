import React from 'react';

class Home extends React.Component {
   constructor(props){
      super(props);
      this.startMachine = this.startMachine.bind(this);
   }


   startMachine(){
      this.props.rubeGoldbergMachineService.startRubeGoldbergMachine();
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