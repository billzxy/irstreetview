import React, { Component, useRef, PureComponent } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from "react-three-fiber";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
//import SVGLoader from "three-svg-loader";
import { disableBodyScroll } from "body-scroll-lock";
import { observable, reaction, Reaction } from "mobx";
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
import {Members, Flags, Locks, ThreeObjs} from "./members"
import {Methods} from "./methods"
import {Animations} from "./animations"

//import { observer } from "mobx-react";
//import OrbitControls from 'three-orbitcontrols'

const StyledInfoBox = styled(InfoBox)`
	margin-right: 12px;
`;

const PanoHeaderContainer = styled.div`
	z-index: 2;
	position: absolute;
	left: 12px;
	top: 30px;
	display: flex;
	flex-direction: row;
`;


interface PanoProps extends RouteComponentProps<{ id?: string }> {}

type PanoState = {
	isLoading: boolean;
	lid: string;
	cameraY: number;
};

export class Pano extends PureComponent<PanoProps, PanoState> {
	members: Members;
	flags: Flags;
	locks: Locks;
	threeObjs: ThreeObjs;

	methods: Methods;
	animations: Animations;

	constructor(props) {
		super(props);

		//class members init
		this.members = new Members();
		this.flags = new Flags();
		this.locks = new Locks();
		this.threeObjs = new ThreeObjs();

		this.methods = new Methods(this, this.members, this.flags, this.locks, this.threeObjs);
		this.animations = new Animations(this.members, this.flags, this.locks, this.threeObjs);

		this.state = {
			isLoading: true,
			lid: props.match.params.id,
			cameraY: 0.0
		};
		this.RenderPano = this.RenderPano.bind(this);
	}

	get panoId() {
		// @ts-ignore
		return this.props.match.params.id || "20190724143833";
	}

	componentDidMount() {
		disableBodyScroll(document.querySelector("#interface"));
		this.methods.setCurrLocAndNeighbors();
	}

	componentWillUnmount() {
		console.log("Unmount pano...");
	}

	panoSetStates()

	onChangeCurId = (newId: string) => {
		this.setState({ lid: newId }, () => {
			const { lid } = this.state;
			this.teleportToScene(lid);
		});
	};

	toggleCursor(isPointer) {
		if (isPointer) {
			this.members.canvasStyle = { cursor: "pointer" };
		} else {
			this.members.canvasStyle = { cursor: "default" };
		}
	}

	onScroll = event => {
		if (this.locks.wheelLockTemp) return;
		this.locks.wheelLockTemp = true;
		if (event.path[0] === this.threeObjs.threeCanvas) {
			if (event.wheelDeltaY > 0) {
				this.members.panoPageStore.zoomIn();
			}
			if (event.wheelDeltaY < 0) {
				this.members.panoPageStore.zoomOut();
			}
		}
		this.locks.wheelLockTemp = false;
		/*/// Following code let wheel controls y-axis scene rotation
		if(event.path[0]===canvas){
			var deltaY = event.wheelDeltaY / 3;
			rotateScene(deltaY);
		}*/
	};

	generatePanoFilename() {
		if (this.members.currLoc.types.includes(this.flags.currPanoType)) {
			return `${Consts.PANOTYPES[this.flags.currPanoType]}/pano-${this.members.currLoc.id}-${
				Consts.PANOTYPES[this.flags.currPanoType]
			}.png`;
		} else {
			return `mx/pano-${this.members.currLoc.id}-mx.png`;
		}
	}


	changeZoom() {
		if (this.locks.wheelLockTemp) return;
		this.locks.wheelLockTemp = true;
		this.members.panoPageStore.zoomLock = true;
		this.members.panoZoomChangeReactionDisposer();
		var zoomBegin = {
			at: this.threeObjs.threeCamera.fov
		};
		var zoomEnd = {
			at: Consts.ZOOMFOV[this.members.panoPageStore.zoom]
		};
		var tweenZoom = new TWEEN.Tween(zoomBegin)
			.to(zoomEnd, 150)
			.easing(TWEEN.Easing.Quadratic.InOut);
		tweenZoom.onUpdate(() => {
			this.threeObjs.threeCamera.fov = zoomBegin.at;
			this.threeObjs.threeCamera.updateProjectionMatrix();
		});
		tweenZoom.onComplete(() => {
			this.setZoomChangeReaction();
			this.locks.wheelLockTemp = false;
			this.members.panoPageStore.zoomLock = false;
		});
		tweenZoom.start();
	}

	changePanoType(type) {
		if (this.flags.currPanoType || !this.members.currLoc.types.includes(this.flags.currPanoType))
			return;
		this.flags.currPanoType = true;
		this.members.panoPageStore.typeLock = true;
		this.members.panoTypeChangeReactionDisposer();
		this.members.loaderSpinnerElem.style.visibility = "visible";
		this.flags.currPanoType = type;
		//console.log(this.generatePanoFilename());

		this.threeObjs.texture = this.threeObjs.loader.load(
			require(`@/assets/viewPano/resource/${this.generatePanoFilename()}`),
			() => {
				//onComplete
				this.members.loaderSpinnerElem.style.visibility = "hidden";
				this.setTypeChangeReaction();
				this.threeObjs.tempcylindermaterial = new THREE.MeshBasicMaterial({
					map: this.threeObjs.texture,
					side: THREE.DoubleSide
				});
				this.threeObjs.tempcylindermesh = new THREE.Mesh(
					this.threeObjs.tempcylindergeometry,
					this.threeObjs.tempcylindermaterial
				);
				this.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
				this.threeObjs.tempcylindermesh.rotation.y = this.threeObjs.cylindermesh.rotation.y;
				this.threeObjs.threeScene.add(this.threeObjs.tempcylindermesh);
				this.animatePanoTypeChangeTextureFade();
			},
			undefined,
			err => {
				console.error(err);
			}
		);
	}

	animatePanoTypeChangeTextureFade = () => {
		var fadeBegin = {
			at: this.threeObjs.cylindermaterial.opacity
		};
		var fadeEnd = {
			at: 0.1
		};
		var crossfade = new TWEEN.Tween(fadeBegin)
			.to(fadeEnd, 500)
			.easing(TWEEN.Easing.Quadratic.InOut);
		crossfade.onUpdate(() => {
			//console.log(this.threeObjs.cylindermaterial);
			this.threeObjs.cylindermaterial.opacity = fadeBegin.at;
		});
		crossfade.onComplete(async () => {
			//When animations are completed, textures are swapped
			this.threeObjs.cylindermaterial.map = this.threeObjs.texture;
			this.threeObjs.cylindermaterial.transparent = false;
			this.threeObjs.cylindermaterial.opacity = 1.0;

			this.threeObjs.threeScene.remove(this.threeObjs.tempcylindermesh);
			this.threeObjs.tempcylindermesh.geometry.dispose();
			this.threeObjs.tempcylindermesh.material.dispose();
			this.threeObjs.tempcylindermesh = undefined;
			this.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
			this.locks.currPanoType = false;
			this.members.panoPageStore.typeLock = false;
		});
		this.threeObjs.cylindermaterial.transparent = true;
		crossfade.start();
	};

	CameraLookNorth(camera) {
		if (this.locks.currPanoType) return;
		this.locks.currPanoType = true;
		this.members.panoViewDirectionResetReactionDisposer();
		var rotBegin = {
			at: camera.rotation.y
		};
		var rotEnd = {
			at: 0
		};
		var tweenRot = new TWEEN.Tween(rotBegin)
			.to(rotEnd, 750)
			.easing(TWEEN.Easing.Quadratic.InOut);
		tweenRot.onUpdate(() => {
			camera.rotation.y = rotBegin.at;
			this.members.panoPageStore.updatePegmanOffset(camera.rotation.y);
		});
		tweenRot.onComplete(() => {
			camera.rotation.y = 0;
			this.members.panoPageStore.updatePegmanOffset(0.0);
			this.setCameraResetReaction();
			this.locks.currPanoType = false;
		});
		tweenRot.start();
	}

	teleportToScene = async id => {
		this.members.panoIdChangeReactionDisposer();
		this.locks.currPanoType = true;
		this.members.loaderSpinnerElem.style.visibility = "visible";
		//console.log("Teleporting to: "+id);
		this.members.currLoc = new Location(id);
		await this.members.currLoc.setAllAttr().then(() => {
			this.threeObjs.texture = this.threeObjs.loader.load(
				require(`@/assets/viewPano/resource/${this.generatePanoFilename()}`),
				() => {
					//onComplete
					this.members.loaderSpinnerElem.style.visibility = "hidden";
					this.threeObjs.tempcylindermaterial = new THREE.MeshBasicMaterial({
						map: this.threeObjs.texture,
						side: THREE.DoubleSide
					});
					this.threeObjs.tempcylindermesh = new THREE.Mesh(
						this.threeObjs.tempcylindergeometry,
						this.threeObjs.tempcylindermaterial
					);
					this.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
					this.threeObjs.tempcylindermesh.rotation.y = this.members.currLoc.calibration;
					this.threeObjs.threeScene.add(this.threeObjs.tempcylindermesh);
					this.animateTeleportationTextureFade();
					let { coord, cameraY, id } = this.members.currLoc;
					this.members.panoPageStore.updateValues(coord.lat, coord.lng, cameraY, id);

					this.setState({ cameraY });
					this.setPanoPageStoreIDChangeReaction();
				},
				undefined,
				err => {
					console.error(err);
				}
			);
		});
	};

	animateTeleportationTextureFade = () => {
		var fadeBegin = {
			at: this.threeObjs.cylindermaterial.opacity
		};
		var fadeEnd = {
			at: 0.1
		};
		var crossfade = new TWEEN.Tween(fadeBegin)
			.to(fadeEnd, 500)
			.easing(TWEEN.Easing.Quadratic.InOut);
		crossfade.onUpdate(() => {
			//console.log(this.threeObjs.cylindermaterial);
			this.threeObjs.cylindermaterial.opacity = fadeBegin.at;
		});
		crossfade.onComplete(async () => {
			//reset camera zoom and pos
			this.threeObjs.threeCamera.rotation.y = 0;
			(this.threeObjs.threeCamera as any).fov = 40;
			(this.threeObjs.threeCamera as any).updateProjectionMatrix();
			//When animations are completed, textures are swapped

			this.threeObjs.cylindermaterial.map = this.threeObjs.texture;
			this.threeObjs.cylindermesh.rotation.y = this.members.currLoc.calibration;
			this.threeObjs.cylindermaterial.transparent = false;
			this.threeObjs.cylindermaterial.opacity = 1.0;

			this.threeObjs.threeScene.remove(this.threeObjs.tempcylindermesh);
			this.threeObjs.tempcylindermesh.geometry.dispose();
			this.threeObjs.tempcylindermesh.material.dispose();
			this.threeObjs.tempcylindermesh = undefined;
			this.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
			await this.setNeighbors().then(this.RenderArrows);
			this.locks.currPanoType = false;
		});
		this.threeObjs.cylindermaterial.transparent = true;
		crossfade.start();
	};

	RenderSpinner = () => {
		return (
			<div className={"spinner-container"}>
				<Spinner width={100} />
			</div>
		);
	};

	RenderArrows = () => {
		var iter = this.members.neighbors.keys();
		//iter.next();
		this.members.n0 = this.members.neighbors.get(iter.next().value);
		console.log(this.members.currLoc.id);
		let arrowSpacing = 7.5;
		//position
		this.threeObjs.cone0.position.z =
			-arrowSpacing * Math.cos((this.members.n0.bearing * Math.PI) / 180);
		this.threeObjs.cone0.position.x =
			arrowSpacing * Math.sin((this.members.n0.bearing * Math.PI) / 180);
		//rotation
		this.threeObjs.cone0.rotation.x = -1.5708;
		this.threeObjs.cone0.rotation.z = (-this.members.n0.bearing * Math.PI) / 180;
		//position
		this.threeObjs.conevis0.position.z =
			-arrowSpacing * Math.cos((this.members.n0.bearing * Math.PI) / 180);
		this.threeObjs.conevis0.position.x =
			arrowSpacing * Math.sin((this.members.n0.bearing * Math.PI) / 180);
		//rotation
		this.threeObjs.conevis0.rotation.x = -1.5708;
		this.threeObjs.conevis0.rotation.z = (-this.members.n0.bearing * Math.PI) / 180;

		this.threeObjs.coneg1.visible = false;
		this.threeObjs.coneg2.visible = false;
		//this.threeObjs.cone0.geometry.computeBoundingSphere();

		if (this.members.neighbors.size > 1) {
			this.members.n1 = this.members.neighbors.get(iter.next().value);
			this.threeObjs.coneg1.visible = true;
			//position
			this.threeObjs.cone1.position.z =
				-arrowSpacing * Math.cos((this.members.n1.bearing * Math.PI) / 180);
			this.threeObjs.cone1.position.x =
				arrowSpacing * Math.sin((this.members.n1.bearing * Math.PI) / 180);
			//rotation
			this.threeObjs.cone1.rotation.x = -1.5708;
			this.threeObjs.cone1.rotation.z = (-this.members.n1.bearing * Math.PI) / 180;
			//position
			this.threeObjs.conevis1.position.z =
				-arrowSpacing * Math.cos((this.members.n1.bearing * Math.PI) / 180);
			this.threeObjs.conevis1.position.x =
				arrowSpacing * Math.sin((this.members.n1.bearing * Math.PI) / 180);
			//rotation
			this.threeObjs.conevis1.rotation.x = -1.5708;
			this.threeObjs.conevis1.rotation.z = (-this.members.n1.bearing * Math.PI) / 180;
			//console.log(this.threeObjs.cone1.rotation.z);
			//this.threeObjs.cone1.geometry.computeBoundingSphere();
			//console.log(this.threeObjs.cone1.localToWorld(this.threeObjs.cone1.geometry.boundingSphere.center));
		}
		if (this.members.neighbors.size === 3) {
			this.members.n2 = this.members.neighbors.get(iter.next().value);
			this.threeObjs.coneg2.visible = true;
			//position
			this.threeObjs.cone2.position.z =
				-arrowSpacing * Math.cos((this.members.n2.bearing * Math.PI) / 180);
			this.threeObjs.cone2.position.x =
				arrowSpacing * Math.sin((this.members.n2.bearing * Math.PI) / 180);
			//rotation
			this.threeObjs.cone2.rotation.x = -1.5708;
			this.threeObjs.cone2.rotation.z = (-this.members.n2.bearing * Math.PI) / 180;
			//position
			this.threeObjs.conevis2.position.z =
				-arrowSpacing * Math.cos((this.members.n2.bearing * Math.PI) / 180);
			this.threeObjs.conevis2.position.x =
				arrowSpacing * Math.sin((this.members.n2.bearing * Math.PI) / 180);
			//rotation
			this.threeObjs.conevis2.rotation.x = -1.5708;
			this.threeObjs.conevis2.rotation.z = (-this.members.n2.bearing * Math.PI) / 180;
			//this.threeObjs.cone2.geometry.computeBoundingSphere();
			//console.log(this.threeObjs.cone2.rotation.z);
		}
	};

	RenderPano() {
		this.members.loaderSpinnerElem = document.getElementById("trans-spinner");
		let { gl, camera, scene, canvas, raycaster } = useThree();
		//var canvas = gl.domElement;  // for react-three-fiber v3.x
		this.threeObjs.threeCamera = camera;
		this.threeObjs.threeScene = scene;
		this.threeObjs.threeCanvas = canvas;

		(camera as any).fov = 40;
		//gl.setSize(window.innerWidth, window.innerHeight);
		gl.setSize(canvas.clientWidth, canvas.clientHeight);

		camera.position.set(0, 0, 0.0);
		camera.lookAt(0, 0, 0);

		let cone = new Arrow();
		let conemesh = useRef();
		let conemesh1 = useRef();
		let conemesh2 = useRef();
		//var mousedir = useRef();
		let compassPlate = useRef();

		this.threeObjs.cone0 = conemesh.current as any;
		this.threeObjs.cone1 = conemesh1.current as any;
		this.threeObjs.cone2 = conemesh2.current as any;

		let coneVisible0 = useRef<THREE.Mesh>();
		this.threeObjs.conevis0 = coneVisible0.current;
		let coneVisible1 = useRef<THREE.Mesh>();
		this.threeObjs.conevis1 = coneVisible1.current;
		let coneVisible2 = useRef<THREE.Mesh>();
		this.threeObjs.conevis2 = coneVisible2.current;

		let conegroup0 = useRef<THREE.Group>();
		this.threeObjs.coneg0 = conegroup0.current;
		let conegroup1 = useRef<THREE.Group>();
		this.threeObjs.coneg1 = conegroup1.current;
		let conegroup2 = useRef<THREE.Group>();
		this.threeObjs.coneg2 = conegroup2.current;

		let c0Sphere;
		let c1Sphere;
		let c2Sphere;
		let coneBoundingSpheres = [c0Sphere, c1Sphere, c2Sphere];

		let mouse = { x: 0, y: 0 };
		let arrow = new Arrow();
		let mouseplateG = useRef();
		let showMousePlate = true;
		let isAnimating = false;
		let isDraggin = false;

		let rcObjects = [];

		let planegeo = new THREE.PlaneGeometry(40, 40);
		let planemat = new THREE.MeshBasicMaterial({
			color: "grey",
			side: THREE.DoubleSide,
			opacity: 0.0,
			transparent: true
		});
		let rcplane = new THREE.Mesh(planegeo, planemat); //not a remotely-controlled plane, but a mathematical plane that involves in raycast
		rcplane.rotation.set(-1.5708, 0, 0);
		rcplane.position.set(0, -1, 0);
		scene.add(rcplane);

		let getInitialConeBoundingSpheres = () => {
			this.threeObjs.cone0.geometry.computeBoundingSphere();
			this.threeObjs.cone1.geometry.computeBoundingSphere();
			this.threeObjs.cone2.geometry.computeBoundingSphere();
			c0Sphere = this.threeObjs.cone0.geometry.boundingSphere;
			c1Sphere = this.threeObjs.cone1.geometry.boundingSphere;
			c2Sphere = this.threeObjs.cone2.geometry.boundingSphere;
		};

		if (this.threeObjs.cone0 && this.threeObjs.cone1 && this.threeObjs.cone2 && compassPlate.current) {
			//getInitialConeBoundingSpheres();
			/*rcObjects.push(c0Sphere);
			rcObjects.push(c1Sphere);
			rcObjects.push(c2Sphere);*/
			rcObjects.push(this.threeObjs.cone0);
			rcObjects.push(this.threeObjs.cone1);
			rcObjects.push(this.threeObjs.cone2);
			//rcObjects.push(compassPlate.current);
			rcObjects.push(rcplane);
			//rcObjects.push(compassGroup.current);
		}

		let bsphere = useRef();
		if (bsphere.current) {
			this.threeObjs.cone0.geometry.computeBoundingSphere();
			let center1 = this.threeObjs.cone0.geometry.boundingSphere.center;
			let v1 = new Vector3(center1.x, center1.y, center1.z);
			//@ts-ignore
			coneGroup.current.localToWorld(v1);
		}

		var distanceToArrowInWorldCoord = (mesh, index) => {
			(mouseplateG.current as any).children[1].geometry.computeBoundingSphere();
			let center0 = (mouseplateG.current as any).children[1].geometry
				.boundingSphere.center;
			let v0 = new Vector3(center0.x, center0.y, center0.z);
			(mouseplateG.current as any).localToWorld(v0);

			mesh.geometry.computeBoundingSphere();
			coneBoundingSpheres[index] = mesh.geometry.boundinSphere;
			let center1 = mesh.geometry.boundingSphere.center;
			let v1 = new Vector3(center1.x, center1.y, center1.z);
			mesh.localToWorld(v1);

			return v0.distanceTo(v1);
		};

		var getClosestArrowAndAdjustDirection = () => {
			if (!mouseplateG.current) return;
			let arr = [this.threeObjs.cone0, this.threeObjs.cone1, this.threeObjs.cone2];
			let dist = new Map<number, THREE.Mesh>();
			for (let i = 0; i < arr.length; i++) {
				if (!arr[i].parent.visible) {
					continue;
				}
				dist.set(distanceToArrowInWorldCoord(arr[i], i), arr[i]);
			}
			let min = Math.min(...dist.keys());
			(mouseplateG.current as any).rotation.z = dist.get(min).rotation.z;
			this.threeObjs.mouseSelectedArrowMesh = dist.get(min);
		};

		var navigateWithMouse = () => {
			let nArr = [this.members.n0, this.members.n1, this.members.n2];
			let id = nArr[this.threeObjs.mouseSelectedArrowMesh.userData.neighbor].location.id;
			transitionToScene(id);
		};

		var onMouseMove2 = event => {
			if (mouseDown) return;
			if (mouseplateG.current) {
				event.preventDefault();
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
				raycaster.setFromCamera(mouse, camera);
				var intersects = raycaster.intersectObjects(rcObjects);
				if (intersects.length > 0) {
					var intersect = intersects[0];
					//console.log( intersects[ 0 ]);
					if (intersects.length === 1) {
						//intersect.object===rcplane){
						//console.log(compassGroup.current);
						(mouseplateG.current as any).visible = true;
						(mouseplateG.current as any).position
							.copy(intersect.point)
							.add(new THREE.Vector3(0, 0.01, 0));
					} else {
						(mouseplateG.current as any).visible = false;
					}
				}
			}
		};

		// Mouse drag rotation controls
		var mouseDown = false,
			mouseX = 0,
			mouseY = 0;

		function onMouseMove(evt) {
			if (mouseDown) {
				evt.preventDefault();
				var deltaX = evt.clientX - mouseX,
					deltaY = evt.clientY - mouseY;
				mouseX = evt.clientX;
				mouseY = evt.clientY;

				rotateScene(deltaX);
			}
		}

		function onMouseDown(evt) {
			evt.preventDefault();
			mouseDown = true;
			mouseX = evt.clientX;
			mouseY = evt.clientY;
		}

		function onMouseUp(evt) {
			evt.preventDefault();
			mouseDown = false;
			isDraggin = false;
		}

		//Touch rotation control
		var startX = 0;

		function onTouchStart(event) {
			startX = event.targetTouches[0].pageX;
		}

		function onTouchMove(event) {
			var deltaX = event.targetTouches[0].pageX - startX;
			startX = event.targetTouches[0].pageX;
			rotateScene(deltaX);
		}

		var rotateScene = deltaX => {
			if (this.locks.currPanoType) return;
			if (deltaX !== 0) {
				isDraggin = true;
			}
			camera.rotation.y += deltaX / 1000;
			camera.rotation.y %= 2 * Math.PI;
			// this.setState({ cameraY: camera.rotation.y })
			this.members.panoPageStore.updatePegmanOffset(camera.rotation.y);
		};

		function onWindowResize() {
			gl.setSize(canvas.clientWidth, canvas.clientHeight);
			(camera as any).aspect = canvas.clientWidth / canvas.clientHeight;
			(camera as any).updateProjectionMatrix();
		}

		window.addEventListener("mousemove", onMouseMove2, false);
		canvas.addEventListener("mousemove", e => onMouseMove(e), false);
		canvas.addEventListener("mousedown", e => onMouseDown(e), false);
		canvas.addEventListener("mouseup", e => onMouseUp(e), false);

		canvas.addEventListener("touchmove", e => onTouchMove(e), false);
		canvas.addEventListener("touchstart", e => onTouchStart(e), false);
		window.addEventListener("resize", onWindowResize, false);

		if (!this.flags.eventListenersLoaded) {
			canvas.addEventListener("mousewheel", e => this.onScroll(e), false);
			this.flags.eventListenersLoaded = true;
		}

		var animateTransition = id => {
			(mouseplateG.current as any).visible = false;
			isAnimating = true;
			//Set up parameters for TWEEN animations
			const depth = 13;
			const resFov = 65;
			const camAt = (this.members.neighbors.get(id).bearing * Math.PI) / 180;
			var endAt = (-this.members.neighbors.get(id).bearing * Math.PI) / 180;
			if (camera.rotation.y > 0) {
				endAt = 2 * Math.PI - (this.members.neighbors.get(id).bearing * Math.PI) / 180;
			}
			if (
				camera.rotation.y - endAt >= Math.PI &&
				camera.rotation.y - endAt < 2 * Math.PI
			) {
				endAt += 2 * Math.PI;
			} else if (
				camera.rotation.y - endAt <= -Math.PI &&
				camera.rotation.y - endAt < -2 * Math.PI
			) {
				endAt = -2 * Math.PI + endAt;
			}
			var rotBegin = {
				at: (camera as any).rotation.y
			};
			var rotEnd = {
				at: endAt
			};
			var tweenRot = new TWEEN.Tween(rotBegin)
				.to(rotEnd, 500)
				.easing(TWEEN.Easing.Quadratic.InOut);
			//console.log("begin: ",rotBegin," end: ",rotEnd);
			tweenRot.onUpdate(() => {
				(camera as any).rotation.y = rotBegin.at;
				this.members.panoPageStore.updatePegmanOffset(camera.rotation.y);
				//console.log(this.threeObjs.threeCamera.rotation.y);
			});
			tweenRot.onComplete(() => {
				camera.rotation.y = (-this.members.neighbors.get(id).bearing * Math.PI) / 180;
				this.members.panoPageStore.updatePegmanOffset(camera.rotation.y);
			});

			var zoom = {
				zVal: (camera as any).position.z,
				xVal: (camera as any).position.x,
				fovValue: (camera as any).fov,
				opacity: this.threeObjs.cylindermaterial.opacity
			};
			var zoomEnd = {
				zVal: -depth * Math.cos(camAt),
				xVal: depth * Math.sin(camAt),
				fovValue: resFov,
				opacity: 0.1
			};
			var tweenZoom = new TWEEN.Tween(zoom).to(zoomEnd, 500);

			tweenZoom.onUpdate(() => {
				(camera as any).position.z = zoom.zVal;
				(camera as any).position.x = zoom.xVal;
				(camera as any).fov = zoom.fovValue;
				(camera as any).updateProjectionMatrix();
				this.threeObjs.cylindermaterial.opacity = zoom.opacity;
			});
			tweenZoom.onComplete(async () => {
				//reset camera zoom and pos
				camera.position.set(0, 0, 0);
				(camera as any).fov = 40;
				(camera as any).updateProjectionMatrix();
				//When animations are completed, textures are swapped

				this.threeObjs.cylindermaterial.map = this.threeObjs.texture;
				this.threeObjs.cylindermesh.rotation.y = this.members.currLoc.calibration;
				this.threeObjs.cylindermaterial.transparent = false;
				this.threeObjs.cylindermaterial.opacity = 1.0;
				//console.log("b1");
				scene.remove(this.threeObjs.tempcylindermesh);
				this.threeObjs.tempcylindermesh.geometry.dispose();
				this.threeObjs.tempcylindermesh.material.dispose();
				this.threeObjs.tempcylindermesh = undefined;
				this.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
				isAnimating = false;
				(mouseplateG.current as any).visible = true;
				await this.setNeighbors().then(this.RenderArrows); //.then(()=>{this.InitNeighborPins()});
				this.locks.currPanoType = false;
				//console.log("b2");
			});
			tweenRot.chain(tweenZoom);
			this.threeObjs.cylindermaterial.transparent = true;

			tweenRot.start();
		};

		scene.add(this.threeObjs.cylindermesh);
		//RenderCompass();

		var transitionToScene = async pid => {
			this.locks.currPanoType = true;
			this.members.loaderSpinnerElem.style.visibility = "visible";
			this.members.panoIdChangeReactionDisposer();
			if (!this.members.neighbors.get(pid)) {
				return;
			}
			this.members.currLoc = this.members.neighbors.get(pid).location;
			//await this.members.currLoc.setAllAttr();
			this.threeObjs.texture = this.threeObjs.loader.load(
				require(`@/assets/viewPano/resource/${this.generatePanoFilename()}`),
				() => {
					//onComplete
					this.members.loaderSpinnerElem.style.visibility = "hidden";
					this.threeObjs.tempcylindermaterial = new THREE.MeshBasicMaterial({
						map: this.threeObjs.texture,
						side: THREE.DoubleSide
					});
					this.threeObjs.tempcylindermesh = new THREE.Mesh(
						this.threeObjs.tempcylindergeometry,
						this.threeObjs.tempcylindermaterial
					);
					this.threeObjs.tempcylindergeometry.scale(-1, 1, 1);
					this.threeObjs.tempcylindermesh.rotation.y = this.members.currLoc.calibration;
					scene.add(this.threeObjs.tempcylindermesh);
					//console.log("a");
					animateTransition(pid);
					//console.log("c");
					let { coord, cameraY, id } = this.members.currLoc;
					this.members.panoPageStore.updateValues(coord.lat, coord.lng, cameraY, id);

					this.setState({ cameraY });
					this.setPanoPageStoreIDChangeReaction();
				},
				undefined,
				err => {
					console.error(err);
				}
			);
		};

		if (this.threeObjs.cone0 && this.threeObjs.cone1 && this.threeObjs.cone2) {
			this.RenderArrows();
		}
		var coneGroup = useRef();
		var compassGroup = useRef();
		var triGeo = useRef();
		let triGeoArr = [
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(-0.6, -1, 0),
			new THREE.Vector3(0, -0.5, 0),
			new THREE.Vector3(0.6, -1, 0)
		];
		if (triGeo.current) {
			(triGeo.current as any).vertices = triGeoArr;
			(triGeo.current as any).faces.push(new THREE.Face3(0, 1, 2));
			(triGeo.current as any).faces.push(new THREE.Face3(0, 2, 3));
			(triGeo.current as any).computeFaceNormals();
			(triGeo.current as any).scale(0.3, 0.3, 0.3);
		}
		function setChildrenOpacity(group, opc) {
			for (let child of group) {
				child.material.opacity = opc;
			}
		}

		var testMesh = useRef();
		if (testMesh.current) {
			(testMesh.current as any).geometry.scale(2, 2, 2);
		}

		useRender(() => {
			TWEEN.update();
			(coneGroup.current as any).position.set(
				-3 * Math.sin(camera.rotation.y),
				-0.9,
				-3 * Math.cos(camera.rotation.y)
			);
			(compassGroup.current as any).position.set(
				-3 * Math.sin(camera.rotation.y - 0.4),
				-0.8,
				-3 * Math.cos(camera.rotation.y - 0.4)
			);
			(compassGroup.current as any).rotation.y = camera.rotation.y;
			(compassGroup.current as any).rotation.z = -camera.rotation.y;

			getClosestArrowAndAdjustDirection();
		});

		return (
			<>
				<group /*group of arrows */ ref={coneGroup} scale={[0.2, 0.2, 0.2]}>
					<group //-----------------FIRST ARROW -------------------//
						onPointerOver={e => {
							setChildrenOpacity(e.object.children, 0.9);
							this.toggleCursor(true);
						}}
						onPointerOut={e => {
							setChildrenOpacity(e.object.children, 0.65);
							this.toggleCursor(false);
						}}
						ref={conegroup0}
					>
						<mesh //First Arrow Hitbox
							userData={{ neighbor: 0 }}
							ref={conemesh}
							geometry={cone.hitbox}
							onClick={() => {
								if (!this.locks.currPanoType) {
									transitionToScene(
										this.members.n0.location.id
									); /*this.members.currLoc.updateCalibration(camera)*/
								}
							}}
						>
							<meshBasicMaterial
								attach="material"
								color="blue"
								opacity={0.5}
								transparent={true}
								visible={false}
							/>
						</mesh>
						<mesh //First Arrow Visible
							geometry={cone.geometry}
							ref={coneVisible0}
						>
							<meshBasicMaterial
								attach="material"
								color="white"
								opacity={0.65}
								transparent={true}
							/>
						</mesh>
					</group>
					<group //----------------SECOND ARROW ------------------------//
						onPointerOver={e => {
							setChildrenOpacity(e.object.children, 0.9);
							this.toggleCursor(true);
						}}
						onPointerOut={e => {
							setChildrenOpacity(e.object.children, 0.65);
							this.toggleCursor(false);
						}}
						ref={conegroup1}
					>
						<mesh //Second Arrow Hitbox
							userData={{ neighbor: 1 }}
							ref={conemesh1}
							geometry={cone.hitbox}
							onClick={() => {
								if (!this.locks.currPanoType) {
									transitionToScene(
										this.members.n1.location.id
									); /*this.members.currLoc.updateCalibration(camera)*/
								}
							}}
						>
							<meshBasicMaterial
								attach="material"
								color="blue"
								opacity={0.5}
								transparent={true}
								visible={false}
							/>
						</mesh>
						<mesh //Second Arrow Visible
							geometry={cone.geometry}
							ref={coneVisible1}
						>
							<meshBasicMaterial
								attach="material"
								color="white"
								opacity={0.65}
								transparent={true}
							/>
						</mesh>
					</group>
					<group //-----------------THIRD ARROW ----------------------- //
						onPointerOver={e => {
							setChildrenOpacity(e.object.children, 0.9);
							this.toggleCursor(true);
						}}
						onPointerOut={e => {
							setChildrenOpacity(e.object.children, 0.65);
							this.toggleCursor(false);
						}}
						ref={conegroup2}
					>
						<mesh //Third Arrow Hitbox
							userData={{ neighbor: 2 }}
							ref={conemesh2}
							geometry={cone.hitbox}
							onClick={() => {
								if (!this.locks.currPanoType) {
									transitionToScene(this.members.n2.location.id);
								}
							}}
						>
							<meshBasicMaterial
								attach="material"
								color="blue"
								opacity={0.5}
								transparent={true}
								visible={false}
							/>
						</mesh>
						<mesh //Second Arrow Visible
							geometry={cone.geometry}
							ref={coneVisible2}
						>
							<meshBasicMaterial
								attach="material"
								color="white"
								opacity={0.65}
								transparent={true}
							/>
						</mesh>
					</group>
				</group>
				<group
					onPointerOver={e => {
						setChildrenOpacity(e.object.children, 0.8);
						this.toggleCursor(true);
					}}
					onPointerOut={e => {
						setChildrenOpacity(e.object.children, 0.5);
						this.toggleCursor(false);
					}}
					ref={compassGroup}
					position={[0, 0, -3]}
					scale={[0.3, 0.3, 0.3]}
					visible={false}
				>
					<mesh //Compass Plate
						//onClick={() => this.CameraLookNorth(camera)}
						geometry={new THREE.CircleGeometry(0.4, 100, 0)}
						ref={compassPlate}
					>
						<meshBasicMaterial
							attach="material"
							color="white"
							opacity={0.5}
							transparent={true}
						/>
					</mesh>
					<mesh //Compass North Arrow
						position={[0, 0.03, 0.01]}
					>
						<geometry attach="geometry" ref={triGeo} />
						<meshBasicMaterial
							attach="material"
							color="red"
							opacity={0.5}
							transparent={true}
						/>
					</mesh>
				</group>

				<group ref={mouseplateG} rotation={[-1.5708, 0, 0]}>
					<mesh
						geometry={arrow.geometry}
						position={[0, 0.05, 0.001]}
						scale={[0.2, 0.12, 0.2]}
					>
						<meshBasicMaterial
							attach="material"
							color="grey"
							opacity={0.7}
							transparent={true}
						/>
					</mesh>
					<mesh
						geometry={new THREE.CircleGeometry(0.4, 100, 0)}
						onPointerUp={() => {
							if (!isDraggin && !this.locks.currPanoType) {
								navigateWithMouse();
							}
						}}
					>
						<meshBasicMaterial
							attach="material"
							color="white"
							opacity={0.7}
							transparent={true}
						/>
					</mesh>
				</group>

				{/*<group
					ref={pinGroup}
					position={[-7, 0.1, -7]}
					scale={[0.5,0.5,0.5]}
				>
					<group
						ref={ping0}
					>
						<mesh
							geometry={this.threeObjs.pinNeedleGeometry}
							position={[0, -2, 0]}
						>
							<meshBasicMaterial attach="material" color="white" opacity={0.75} transparent={true} />
						</mesh>
						<mesh
							geometry={this.threeObjs.pinSphereGeometry}
							position={[0, 0, 0]}
						>
							<meshBasicMaterial attach="material" color="red" opacity={0.75} transparent={true} />
						</mesh>
					</group>
				</group>*/}
			</>
		);
	}
	//TODO: change the pano window render size
	render() {
		const { isLoading, cameraY } = this.state;
		return isLoading ? (
			<div className={"spinner-container"}>
				<Spinner width={100} />
			</div>
		) : (
			<div className="Pano-container">
				<div className="Pano-canvas" style={this.members.canvasStyle}>
					<Canvas>
						<this.RenderPano />
					</Canvas>
				</div>
				<PanoHeaderContainer>
					<StyledInfoBox />
					<div>
						<PanoTypeController panoPageStore={this.members.panoPageStore} />
					</div>
				</PanoHeaderContainer>
				<Minimap
					panoPageStore={this.members.panoPageStore}
					onPanoIdChange={this.onChangeCurId}
				/>
				<div>
					<Compass panoPageStore={this.members.panoPageStore} />
				</div>
				<div>
					<ZoomController panoPageStore={this.members.panoPageStore} />
				</div>
				<div id="trans-spinner" style={{ visibility: "hidden" }}>
					<this.RenderSpinner />
				</div>
			</div>
		);
	}
}

export default withRouter(Pano);
