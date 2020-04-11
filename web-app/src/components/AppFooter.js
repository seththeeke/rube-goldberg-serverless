import React from 'react';
import { Link } from "react-router-dom";
import './../css/AppFooter.css';

class AppFooter extends React.Component {
    render(){
        return (
            <div className="app-footer-container">
                <div className="footer-text-container">
                    <Link to="/some-other-page">
                        <div className="footer-text">Contact</div>
                    </Link>
                    <Link to="/some-other-page">
                        <div className="footer-text">Architecture</div>
                    </Link>
                </div>
            </div>
        );
    }
}

export default AppFooter;