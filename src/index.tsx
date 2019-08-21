import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './style/index.css';
import * as App from './App';
import Pano from './pano';
import GMap from './maps'
import * as serviceWorker from './serviceWorker';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";


ReactDOM.render(<App.Header />, document.getElementById('root'));
ReactDOM.render(<App.Interface />, document.getElementById('interface'));


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
