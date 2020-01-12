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

import * as Consts from "./constants";
import {Pano} from "./index"
import {Members, Flags, Locks, ThreeObjs} from "./members";

export class Animations {
    pano: Pano;

    constructor(pano: Pano){
        this.pano = pano
        
    }

    animateTeleportationTextureFade = () => {
		let fadeBegin = {
			at: this.pano.threeObjs.cylindermaterial.opacity
		};
		let fadeEnd = {
			at: 0.1
		};
		let crossfade = new TWEEN.Tween(fadeBegin)
			.to(fadeEnd, 500)
			.easing(TWEEN.Easing.Quadratic.InOut);
		crossfade.onUpdate(() => {
			//console.log(this.threeObjs.cylindermaterial);
			this.pano.threeObjs.cylindermaterial.opacity = fadeBegin.at;
		});
		crossfade.onComplete(async () => {
			//reset camera zoom and pos
			this.pano.threeObjs.threeCamera.rotation.y = 0;
			(this.pano.threeObjs.threeCamera as any).fov = 40;
			(this.pano.threeObjs.threeCamera as any).updateProjectionMatrix();
			//When animations are completed, textures are swapped

			this.pano.threeObjs.cylindermaterial.map = this.pano.threeObjs.texture;
			this.pano.threeObjs.cylindermesh.rotation.y = this.pano.members.currLoc.calibration;
			this.pano.threeObjs.cylindermaterial.transparent = false;
			this.pano.threeObjs.cylindermaterial.opacity = 1.0;

			this.pano.threeObjs.threeScene.remove(this.pano.threeObjs.tempcylindermesh);
			this.pano.threeObjs.tempcylindermesh.geometry.dispose();
			this.pano.threeObjs.tempcylindermesh.material.dispose();
			this.pano.threeObjs.tempcylindermesh = undefined;
			this.pano.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
			await this.pano.methods.setNeighbors().then(this.pano.methods.RenderArrows);
			this.pano.locks.animationLock = false;
		});
		this.pano.threeObjs.cylindermaterial.transparent = true;
		crossfade.start();
	};
}