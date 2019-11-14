import React, { Component, useEffect, useRef } from "react";
import { observable, reaction } from "mobx";
import { observer } from "mobx-react";
import {PanoPageStore} from "./minimap"


@observer
export default class Compass extends Component<{panoPageStore},{}>{

    constructor(props){
        super(props);
    }

    compassRotationReactionDisposer;
    svgSrc = require("../../assets/viewPano/compass.svg");

    componentDidMount(){
        this.setCompassRotationReaction();
    }

    setCompassRotationReaction() {
        this.compassRotationReactionDisposer = reaction(
            () => this.props.panoPageStore.cameraY,
            (cameraY, reaction) => {
                this.RotateCompass(cameraY);
            }
        );
    }

    CompassElement = () => {
        return (
            <div>
                <img src={this.svgSrc} alt="Compass" />
            </div>
        );
    }

    RotateCompass = (cameraY) => {
        var deg = Math.ceil(-cameraY*180/Math.PI);
		if(deg<0){
			deg = 360+deg;
        }
        document.getElementById("compassDom").style.transform = `rotate(${deg-60}deg)`;
        console.log(deg);
    }

    render() {
        return (
            <div id="compassDom" > 
                <this.CompassElement /> 
            </div>
        )
    }
}