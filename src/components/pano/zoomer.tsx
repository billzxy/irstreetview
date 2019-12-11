import React, { Component, useEffect, useRef } from "react";
import { observable, reaction } from "mobx";
import { observer } from "mobx-react";
import PanoPageStore from "./pageStore"

const maxZoom = 2;

@observer
export default class ZoomController extends Component<{panoPageStore},{}>{

    constructor(props){
        super(props);
    }

    zoomerReactionDisposer;
    zBase = require("../../assets/viewPano/zoomerBase.svg");
    zPlus = require("../../assets/viewPano/zoomerPlus.svg");
    zMinus = require("../../assets/viewPano/zoomerMinus.svg");
    zoomerInElement;
    zoomerOutElement;
    currZoomLevel = 0;

    componentDidMount(){
        this.setZoomerControlReaction();
        this.zoomerElementHandlerInit();
    }

    zoomerElementHandlerInit = () => {
        this.zoomerInElement = document.getElementById("zoomerIn");
        this.zoomerOutElement = document.getElementById("zoomerOut");
        this.zoomerInElement.addEventListener("mouseup", e => this.zoomerInOnClick(e), false);
        this.zoomerOutElement.addEventListener("mouseup", e => this.zoomerOutOnClick(e), false);
        this.zoomerInElement.addEventListener("mouseover", e => this.zoomerInOver(e), false);
        this.zoomerOutElement.addEventListener("mouseover", e => this.zoomerOutOver(e), false);
        this.zoomerInElement.addEventListener("mouseout", e => this.zoomerInOut(e), false);
        this.zoomerOutElement.addEventListener("mouseout", e => this.zoomerOutOut(e), false);
    }

    zoomerInOnClick = (e) => {
        e.preventDefault();
        this.props.panoPageStore.zoomIn();
    }

    zoomerOutOnClick = (e) => {
        e.preventDefault();
        this.props.panoPageStore.zoomOut();
    }

    zoomerInOver = (e) => {
        e.preventDefault();
        this.zoomerInElement.style.opacity = 0.5;
    }

    zoomerOutOver = (e) => {
        e.preventDefault();
        this.zoomerOutElement.style.opacity = 0.5;
    }

    zoomerInOut = (e) => {
        e.preventDefault();
        //this.props.panoPageStore.reset = true;
        this.zoomerInElement.style.opacity = 0.2;
    }

    zoomerOutOut = (e) => {
        e.preventDefault();
        this.zoomerOutElement.style.opacity = 0.2;
    }

    setZoomerControlReaction() {
        this.zoomerReactionDisposer = reaction(
            () => this.props.panoPageStore.cameraY,
            (cameraY, reaction) => {
                //this.RotateCompass(cameraY);
            }
        );
    }

    ZoomerElement = () => {
        return (
            <div>
                <div id="zoomerBase">
                    <img src={this.zBase} alt="Zoom Controller" />
                    <div id="zoomerIn">
                        <img src={this.zPlus} alt="Zoom In" />
                    </div>
                    <div id="zoomerOut">
                        <img src={this.zMinus} alt="Zoom Out" />
                    </div>
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
                <this.ZoomerElement /> 
            </>
        )
    }
}