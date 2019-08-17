import React from 'react';
import ReactDOM from 'react-dom';
import './style/index.css';
import App from './App';
import Pano from './pano';
import * as serviceWorker from './serviceWorker';
import { Canvas } from 'react-three-fiber'

ReactDOM.render(<App />, document.getElementById('root'));
ReactDOM.render(
    <div className="Pano-canvas">
        <Pano />
    </div>,
    document.getElementById('panoWindow')
  );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
