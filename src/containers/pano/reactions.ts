import React, { Component, useRef, PureComponent } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from "react-three-fiber";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
//import SVGLoader from "three-svg-loader";
import { disableBodyScroll } from "body-scroll-lock";
import { observable, reaction, Reaction, IReactionDisposer } from "mobx";
import { Vector3 } from "three";
const TWEEN = require("@tweenjs/tween.js");


import InfoBox from "@/components/pano/infoBox";
import Minimap from "@/components/pano/minimap";
import PanoPageStore from "@/components/pano/pageStore";
import { Location } from "@/components/pano/location";
import { Arrow, Cylinder } from "@/components/pano/shapes";
import Spinner from "@/components/spinner";
import Compass from "@/components/pano/compass";
import ZoomController from "@/components/pano/zoomer";
import PanoTypeController from "@/components/pano/panotype";

import "./styles.css";

import {Pano} from "./index";
import * as Consts from "./constants";
import {Members, Flags, Locks, ThreeObjs} from "./members";
import {Methods} from "./methods";
import {Animations} from "./animations";

export class Reactions {
    pano: Pano;

    panoIdChangeReactionDisposer: IReactionDisposer;
    panoViewDirectionResetReactionDisposer: IReactionDisposer;
    panoZoomChangeReactionDisposer: IReactionDisposer;
    panoTypeChangeReactionDisposer: IReactionDisposer;

    constructor(pano: Pano){
        this.pano = pano;
    
    }

    //MobX Reaction controls
    setPanoPageStoreIDChangeReaction() {
		this.panoIdChangeReactionDisposer = reaction(
			() => this.pano.members.panoPageStore.id,
			(id, reaction) => {
				this.teleportToScene(id);
			}
		);
	}

	setCameraResetReaction() {
		this.panoViewDirectionResetReactionDisposer = reaction(
			() => this.pano.members.panoPageStore.reset,
			(reset, reaction) => {
				if (reset === true) {
					this.CameraLookNorth(this.pano.threeObjs.threeCamera);
				}
				this.pano.members.panoPageStore.reset = false;
			}
		);
	}

	setZoomChangeReaction() {
		this.panoZoomChangeReactionDisposer = reaction(
			() => this.pano.members.panoPageStore.zoom,
			(zoom, reaction) => {
				this.changeZoom();
			}
		);
	}

	setTypeChangeReaction() {
		this.panoTypeChangeReactionDisposer = reaction(
			() => this.pano.members.panoPageStore.panoType,
			(type, reaction) => {
				this.changePanoType(type);
			}
		);
    }
    
    setAllReactions() {
		this.setPanoPageStoreIDChangeReaction();
		this.setCameraResetReaction();
		this.setZoomChangeReaction();
		this.setTypeChangeReaction();
	}
}