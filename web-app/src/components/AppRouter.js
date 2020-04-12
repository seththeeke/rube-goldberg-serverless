import React from 'react';
import {
  Switch,
  Route
} from "react-router-dom";
import Home from './Home';

class AppRouter extends React.Component {
    render() {
        return (
            <div>
                <Switch>
                    {/* <Route path="/some-other-page">
                        <div>Some Other Page</div>
                    </Route> */}
                    <Route path="/">
                        <Home
                            rubeGoldbergMachineService={this.props.rubeGoldbergMachineService}
                        >
                        </Home>
                    </Route>
                </Switch>
            </div>
        );
    }
}

export default AppRouter;