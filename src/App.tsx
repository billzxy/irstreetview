import React from 'react';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import GMap from './maps'
import './style/App.css';


export function Header() {
    return (
      <div className="App">
        <header className="App-header">
          <h2>SmartIR Infrared Street View</h2>
        </header>
      </div>
    );
  }

export class Interface extends React.Component{
  mainMenuList = 
  <div>
    <Router>
      <Link to="/maps">Click to see panorama locations on maps</Link>
      <Route path="/maps" component={GMap} />
    </Router>
    </div>;

  render(){
    return this.mainMenuList;  
  }
}


