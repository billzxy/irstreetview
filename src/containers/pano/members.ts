import React, { Component, useRef, PureComponent } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from "react-three-fiber";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
//import SVGLoader from "three-svg-loader";
import { disableBodyScroll } from "body-scroll-lock";
import { observable, reaction, Reaction, IReactionDisposer } from "mobx";
import { Vector3 } from "three";

import InfoBox from "@/components/pano/infoBox";
import Minimap from "@/components/pano/minimap";
import PanoPageStore from "@/components/pano/pageStore";
import { Location } from "@/components/pano/location";
import { Arrow, Cylinder } from "@/components/pano/shapes";
import Spinner from "@/components/spinner";
import Compass from "@/components/pano/compass";
import ZoomController from "@/components/pano/zoomer";
import PanoTypeController from "@/components/pano/panotype";

type NeighborType = {
	location: Location;
	distance: number;
	bearing: number;
};

export class Members {
    currLoc: Location;
    neighbors: Map<string, NeighborType>;
    n0: NeighborType;
	n1: NeighborType;
	n2: NeighborType;

    panoPageStore = undefined;
    canvasStyle = { cursor: "default" };
    loaderSpinnerElem = undefined;


    constructor(){
        this.currLoc = undefined;
    }
	
}

export class Flags {
	eventListenersLoaded = false;
	currPanoType = 0;
}

export class Locks {
    animationLock = false;
	wheelLockTemp = false;
}

export class ThreeObjs {
    cylindergeometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);
	cylindermaterial: THREE.MeshBasicMaterial;
	cylindermesh: THREE.Mesh;
	texture: THREE.Texture;
	loader = new THREE.TextureLoader();
	lines = [];

	tempcylindergeometry = new THREE.CylinderBufferGeometry(
		20.1,
		20.1,
		15,
		100,
		1,
		true
	);
	tempcylindermaterial: THREE.MeshBasicMaterial;
	tempcylindermesh: THREE.Mesh;
	threeCamera = undefined;
	threeScene: THREE.Scene;
	threeCanvas = undefined;

	cone0: THREE.Mesh;
	cone1: THREE.Mesh;
	cone2: THREE.Mesh;

	conevis0: THREE.Mesh;
	conevis1: THREE.Mesh;
	conevis2: THREE.Mesh;

	coneg0: THREE.Group;
	coneg1: THREE.Group;
	coneg2: THREE.Group;

	pinSphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
	pinNeedleGeometry = new THREE.CylinderGeometry(0.075, 0.025, 3, 10, 1, false);
	
    
    mouseSelectedArrowMesh: THREE.Mesh;

}