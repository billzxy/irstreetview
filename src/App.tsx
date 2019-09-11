import React from 'react';
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import GMap from './maps'
import Pano from './pano'
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
      <Link to="/viewPano">View Pano</Link>
      <Route path="/maps" component={GMap} />
      <Route path="/viewPano" render={()=>{ReactDOM.render(<Pano lid={"20190724143458"} />, document.getElementById('panoWindow'))}} />
    </Router>
    </div>;

  render(){
    return this.mainMenuList;  
  }
}


