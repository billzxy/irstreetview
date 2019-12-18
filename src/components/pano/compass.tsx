import React, { Component, useEffect, useRef } from "react";
import { observable, reaction } from "mobx";
import { observer } from "mobx-react";
import PanoPageStore from "./pageStore"


@observer
export default class Compass extends Component<{panoPageStore},{}>{

    constructor(props){
        super(props);
    }

    compassRotationReactionDisposer;
    cBaseSrc = require("../../assets/viewPano/compassBase.svg");
    cDiamondSrc = require("../../assets/viewPano/compassDiamond.svg");
    compassElement;

    componentDidMount(){
        this.setCompassRotationReaction();
        this.compassHandlerInit();
    }

    compassHandlerInit = () => {
        this.compassElement = document.getElementById("compassDiamond");
        this.compassElement.addEventListener("mouseup", e => this.compassOnClick(e), false);
    }

    compassOnClick = (e) => {
        e.preventDefault();
        this.props.panoPageStore.reset = true;
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
                <div id="compassBase">
                    <img src={this.cBaseSrc} alt="Compass" />
                </div>
                <div id="compassDiamond">
                    <img src={this.cDiamondSrc} alt="Compass" />
                </div>
            </div>
        );
    }


    RotateCompass = (cameraY) => {
        var deg = Math.ceil(-cameraY*180/Math.PI);
		if(deg<0){
			deg = 360+deg;
        }
        document.getElementById("compassDiamond").style.transform = `rotate(${deg}deg)`;
    }

    render() {
        return (
            <> 
                <this.CompassElement /> 
            </>
        )
    }
}