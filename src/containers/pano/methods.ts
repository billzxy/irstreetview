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
import {Reactions} from "./reactions";
import {Animations} from "./animations";

export class Methods {
    pano: Pano;

    constructor(pano: Pano){
        this.pano = pano;
    }

    //control methods
    setCurrLocAndNeighbors = async () => {
        //setCurrLoc
        this.pano.members.currLoc = new Location(this.pano.panoId);

        await this.pano.members.currLoc.setAllAttr().then(() => {
            this.loadTexture();
        });
        //setNeighbors
        this.pano.members.neighbors = new Map();
        this.setNeighbors();
    };

    loadTexture() {
		this.pano.threeObjs.texture = this.pano.threeObjs.loader.load(
			require(`@/assets/viewPano/resource/${this.generatePanoFilename()}`),
			() => {
				//On pano first load complete
				this.pano.members.panoPageStore = new PanoPageStore(
					this.pano.members.currLoc.coord.lat,
					this.pano.members.currLoc.coord.lng,
					0.0,
					this.pano.members.currLoc.id
				);
				this.pano.reactions.setAllReactions();
				this.pano.panoSetStates({ isLoading: false });
			},
			undefined,
			err => {
				console.error(err);
			}
		);

		this.pano.threeObjs.cylindermaterial = new THREE.MeshBasicMaterial({
			map: this.pano.threeObjs.texture,
			side: THREE.DoubleSide
		});
		this.pano.threeObjs.cylindermesh = new THREE.Mesh(
			this.pano.threeObjs.cylindergeometry,
			this.pano.threeObjs.cylindermaterial
		);
		this.pano.threeObjs.cylindergeometry.scale(-1, 1, 1);
		//this.threeObjs.cylindermesh.position.y = 0
		this.pano.threeObjs.cylindermesh.rotation.y = this.pano.members.currLoc.calibration;
    }
    
    async setNeighbors() {
		//Only supports two neighbors for now
		this.pano.members.neighbors.clear(); //Purge previous neighbors
		await this.pano.members.currLoc.getNeighborIds();
		let nidArr = this.pano.members.currLoc.neighborArr;
		if ((nidArr as any).length === 0) {
			console.log("No neighbors discorvered...");
			return;
		} else {
			for (let nid of nidArr as any) {
				let nextLoc = new Location(nid);
				await nextLoc.setAllAttr().then(() => {
					this.addNeighbor(nextLoc);
				});
			}
		}
    }
    
    addNeighbor(n: Location) {
		this.pano.members.neighbors.set(n.id, {
			location: n,
			distance: this.pano.members.currLoc.getDistanceTo(n),
			bearing: this.pano.members.currLoc.getBearingTo(n)
		});
    }

    generatePanoFilename() {
		if (this.pano.members.currLoc.types.includes(this.pano.flags.currPanoType)) {
			return `${Consts.PANOTYPES[this.pano.flags.currPanoType]}/pano-${this.pano.members.currLoc.id}-${
				Consts.PANOTYPES[this.pano.flags.currPanoType]
			}.png`;
		} else {
			return `mx/pano-${this.pano.members.currLoc.id}-mx.png`;
		}
	}
    
    teleportToScene = async id => {
		this.pano.reactions.panoIdChangeReactionDisposer();
		this.pano.locks.animationLock = true;
		this.pano.members.loaderSpinnerElem.style.visibility = "visible";
		//console.log("Teleporting to: "+id);
		this.pano.members.currLoc = new Location(id);
		await this.pano.members.currLoc.setAllAttr().then(() => {
			this.pano.threeObjs.texture = this.pano.threeObjs.loader.load(
				require(`@/assets/viewPano/resource/${this.pano.methods.generatePanoFilename()}`),
				() => {
					//onComplete
					this.pano.members.loaderSpinnerElem.style.visibility = "hidden";
					this.pano.threeObjs.tempcylindermaterial = new THREE.MeshBasicMaterial({
						map: this.pano.threeObjs.texture,
						side: THREE.DoubleSide
					});
					this.pano.threeObjs.tempcylindermesh = new THREE.Mesh(
						this.pano.threeObjs.tempcylindergeometry,
						this.pano.threeObjs.tempcylindermaterial
					);
					this.pano.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
					this.pano.threeObjs.tempcylindermesh.rotation.y = this.pano.members.currLoc.calibration;
					this.pano.threeObjs.threeScene.add(this.pano.threeObjs.tempcylindermesh);
					this.pano.animations.animateTeleportationTextureFade();
					let { coord, cameraY, id } = this.pano.members.currLoc;
					this.pano.members.panoPageStore.updateValues(coord.lat, coord.lng, cameraY, id);

					this.pano.panoSetStates({ cameraY });
					this.pano.reactions.panoTypeChangeReactionDisposer();
				},
				undefined,
				err => {
					console.error(err);
				}
			);
		});
	};


    RenderArrows = () => {
		let iter = this.pano.members.neighbors.keys();
		//iter.next();
		this.pano.members.n0 = this.pano.members.neighbors.get(iter.next().value);
		console.log(this.pano.members.currLoc.id);
		let arrowSpacing = 7.5;
		//position
		this.pano.threeObjs.cone0.position.z =
			-arrowSpacing * Math.cos((this.pano.members.n0.bearing * Math.PI) / 180);
		this.pano.threeObjs.cone0.position.x =
			arrowSpacing * Math.sin((this.pano.members.n0.bearing * Math.PI) / 180);
		//rotation
		this.pano.threeObjs.cone0.rotation.x = -1.5708;
		this.pano.threeObjs.cone0.rotation.z = (-this.pano.members.n0.bearing * Math.PI) / 180;
		//position
		this.pano.threeObjs.conevis0.position.z =
			-arrowSpacing * Math.cos((this.pano.members.n0.bearing * Math.PI) / 180);
		this.pano.threeObjs.conevis0.position.x =
			arrowSpacing * Math.sin((this.pano.members.n0.bearing * Math.PI) / 180);
		//rotation
		this.pano.threeObjs.conevis0.rotation.x = -1.5708;
		this.pano.threeObjs.conevis0.rotation.z = (-this.pano.members.n0.bearing * Math.PI) / 180;

		this.pano.threeObjs.coneg1.visible = false;
		this.pano.threeObjs.coneg2.visible = false;
		//this.threeObjs.cone0.geometry.computeBoundingSphere();

		if (this.pano.members.neighbors.size > 1) {
			this.pano.members.n1 = this.pano.members.neighbors.get(iter.next().value);
			this.pano.threeObjs.coneg1.visible = true;
			//position
			this.pano.threeObjs.cone1.position.z =
				-arrowSpacing * Math.cos((this.pano.members.n1.bearing * Math.PI) / 180);
			this.pano.threeObjs.cone1.position.x =
				arrowSpacing * Math.sin((this.pano.members.n1.bearing * Math.PI) / 180);
			//rotation
			this.pano.threeObjs.cone1.rotation.x = -1.5708;
			this.pano.threeObjs.cone1.rotation.z = (-this.pano.members.n1.bearing * Math.PI) / 180;
			//position
			this.pano.threeObjs.conevis1.position.z =
				-arrowSpacing * Math.cos((this.pano.members.n1.bearing * Math.PI) / 180);
			this.pano.threeObjs.conevis1.position.x =
				arrowSpacing * Math.sin((this.pano.members.n1.bearing * Math.PI) / 180);
			//rotation
			this.pano.threeObjs.conevis1.rotation.x = -1.5708;
			this.pano.threeObjs.conevis1.rotation.z = (-this.pano.members.n1.bearing * Math.PI) / 180;
			//console.log(this.threeObjs.cone1.rotation.z);
			//this.threeObjs.cone1.geometry.computeBoundingSphere();
			//console.log(this.threeObjs.cone1.localToWorld(this.threeObjs.cone1.geometry.boundingSphere.center));
		}
		if (this.pano.members.neighbors.size === 3) {
			this.pano.members.n2 = this.pano.members.neighbors.get(iter.next().value);
			this.pano.threeObjs.coneg2.visible = true;
			//position
			this.pano.threeObjs.cone2.position.z =
				-arrowSpacing * Math.cos((this.pano.members.n2.bearing * Math.PI) / 180);
			this.pano.threeObjs.cone2.position.x =
				arrowSpacing * Math.sin((this.pano.members.n2.bearing * Math.PI) / 180);
			//rotation
			this.pano.threeObjs.cone2.rotation.x = -1.5708;
			this.threeObjs.cone2.rotation.z = (-this.pano.members.n2.bearing * Math.PI) / 180;
			//position
			this.pano.threeObjs.conevis2.position.z =
				-arrowSpacing * Math.cos((this.pano.members.n2.bearing * Math.PI) / 180);
			this.pano.threeObjs.conevis2.position.x =
				arrowSpacing * Math.sin((this.pano.members.n2.bearing * Math.PI) / 180);
			//rotation
			this.pano.threeObjs.conevis2.rotation.x = -1.5708;
			this.pano.threeObjs.conevis2.rotation.z = (-this.pano.members.n2.bearing * Math.PI) / 180;
			//this.threeObjs.cone2.geometry.computeBoundingSphere();
			//console.log(this.threeObjs.cone2.rotation.z);
		}
	};
    

    

}