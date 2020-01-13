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
import {Reactions} from "./reactions";

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
	reactions: Reactions;

	constructor(props) {
		super(props);

		//class members init
		this.members = new Members();
		this.flags = new Flags();
		this.locks = new Locks();
		this.threeObjs = new ThreeObjs();

		this.methods = new Methods(this);
		this.animations = new Animations(this);
		this.reactions = new Reactions(this);

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

	panoSetStates(state){
		this.setState(state);
	}

	onChangeCurId = (newId: string) => {
		this.setState({ lid: newId }, () => {
			const { lid } = this.state;
			this.methods.teleportToScene(lid);
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
			let deltaY = event.wheelDeltaY / 3;
			rotateScene(deltaY);
		}*/
	};

	// Mouse drag rotation controls
	mouseDown: boolean = false;
	mouse = { x: 0, y: 0 };
	mouseX: number = 0;
	mouseY: number = 0;
	isDraggin: boolean = false;
	startX: number = 0;

	onMouseMove(evt) {
		if (this.mouseDown) {
			evt.preventDefault();
			let deltaX = evt.clientX - this.mouseX,
				deltaY = evt.clientY - this.mouseY;
			this.mouseX = evt.clientX;
			this.mouseY = evt.clientY;

			this.methods.rotateScene(deltaX);
		}
	}

	onMouseMove2 = event => {
		if (this.mouseDown) return;
		if (this.threeObjs.navigatorPlate) {
			event.preventDefault();
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			this.threeObjs.threeRaycaster.setFromCamera(this.mouse, this.threeObjs.threeCamera);
			let intersects = this.threeObjs.threeRaycaster.intersectObjects(this.threeObjs.raycastedObjects);
			if (intersects.length > 0) {
				let intersect = intersects[0];
				//console.log( intersects[ 0 ]);
				if (intersects.length === 1) {
					//intersect.object===rcplane){
					//console.log(compassGroup.current);
					this.threeObjs.navigatorPlate.visible = true;
					this.threeObjs.navigatorPlate.position
						.copy(intersect.point)
						.add(new THREE.Vector3(0, 0.01, 0));
				} else {
					this.threeObjs.navigatorPlate.visible = false;
				}
			}
		}
	};

	onMouseDown(evt) {
		evt.preventDefault();
		this.mouseDown = true;
		this.mouseX = evt.clientX;
		this.mouseY = evt.clientY;
	}

	onMouseUp(evt) {
		evt.preventDefault();
		this.mouseDown = false;
		this.isDraggin = false;
	}

	//Touch rotation controls

	onTouchStart(event) {
		this.startX = event.targetTouches[0].pageX;
	}

	onTouchMove(event) {
		let deltaX = event.targetTouches[0].pageX - this.startX;
		this.startX = event.targetTouches[0].pageX;
		this.methods.rotateScene(deltaX);
	}

	onWindowResize() {
		this.threeObjs.threeRenderer.setSize(this.threeObjs.threeCanvas.clientWidth, this.threeObjs.threeCanvas.clientHeight);
		this.threeObjs.threeCamera.aspect = this.threeObjs.threeCanvas.clientWidth / this.threeObjs.threeCanvas.clientHeight;
		this.threeObjs.threeCanvas.updateProjectionMatrix();
	}


	setUpEventListeners() {
		this.threeObjs.threeCanvas.addEventListener("mousemove", e => this.onMouseMove(e), false);
		window.addEventListener("mousemove", this.onMouseMove2, false);
		this.threeObjs.threeCanvas.addEventListener("mousedown", e => this.onMouseDown(e), false);
		this.threeObjs.threeCanvas.addEventListener("mouseup", e => this.onMouseUp(e), false);
		this.threeObjs.threeCanvas.addEventListener("touchmove", e => this.onTouchMove(e), false);
		this.threeObjs.threeCanvas.addEventListener("touchstart", e => this.onTouchStart(e), false);
		window.addEventListener("resize", this.onWindowResize, false);
	}

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
		this.reactions.panoZoomChangeReactionDisposer();
		let zoomBegin = {
			at: this.threeObjs.threeCamera.fov
		};
		let zoomEnd = {
			at: Consts.ZOOMFOV[this.members.panoPageStore.zoom]
		};
		let tweenZoom = new TWEEN.Tween(zoomBegin)
			.to(zoomEnd, 150)
			.easing(TWEEN.Easing.Quadratic.InOut);
		tweenZoom.onUpdate(() => {
			this.threeObjs.threeCamera.fov = zoomBegin.at;
			this.threeObjs.threeCamera.updateProjectionMatrix();
		});
		tweenZoom.onComplete(() => {
			this.reactions.setZoomChangeReaction();
			this.locks.wheelLockTemp = false;
			this.members.panoPageStore.zoomLock = false;
		});
		tweenZoom.start();
	}

	changePanoType(type) {
		if (this.locks.animationLock || !this.members.currLoc.types.includes(this.flags.currPanoType))
			return;
		this.locks.animationLock = true;
		this.members.panoPageStore.typeLock = true;
		this.reactions.panoTypeChangeReactionDisposer();
		this.members.loaderSpinnerElem.style.visibility = "visible";
		this.flags.currPanoType = type;
		//console.log(this.generatePanoFilename());

		this.threeObjs.texture = this.threeObjs.loader.load(
			require(`@/assets/viewPano/resource/${this.generatePanoFilename()}`),
			() => {
				//onComplete
				this.members.loaderSpinnerElem.style.visibility = "hidden";
				this.reactions.setTypeChangeReaction();
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
		let fadeBegin = {
			at: this.threeObjs.cylindermaterial.opacity
		};
		let fadeEnd = {
			at: 0.1
		};
		let crossfade = new TWEEN.Tween(fadeBegin)
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
			this.locks.animationLock = false;
			this.members.panoPageStore.typeLock = false;
		});
		this.threeObjs.cylindermaterial.transparent = true;
		crossfade.start();
	};

	CameraLookNorth(camera) {
		if (this.locks.animationLock) return;
		this.locks.animationLock = true;
		this.reactions.panoViewDirectionResetReactionDisposer();
		let rotBegin = {
			at: camera.rotation.y
		};
		let rotEnd = {
			at: 0
		};
		let tweenRot = new TWEEN.Tween(rotBegin)
			.to(rotEnd, 750)
			.easing(TWEEN.Easing.Quadratic.InOut);
		tweenRot.onUpdate(() => {
			camera.rotation.y = rotBegin.at;
			this.members.panoPageStore.updatePegmanOffset(camera.rotation.y);
		});
		tweenRot.onComplete(() => {
			camera.rotation.y = 0;
			this.members.panoPageStore.updatePegmanOffset(0.0);
			this.reactions.setCameraResetReaction();
			this.locks.animationLock = false;
		});
		tweenRot.start();
	}

	RenderSpinner = () => {
		return (
			<div className={"spinner-container"}>
				<Spinner width={100} />
			</div>
		);
	};

	RenderPano() {
		this.members.loaderSpinnerElem = document.getElementById("trans-spinner");
		let { gl, camera, scene, canvas, raycaster } = useThree();
		//let canvas = gl.domElement;  // for react-three-fiber v3.x
		this.threeObjs.threeRenderer = gl;
		this.threeObjs.threeCamera = camera;
		this.threeObjs.threeScene = scene;
		this.threeObjs.threeCanvas = canvas;
		this.threeObjs.threeRaycaster = raycaster;

		(camera as any).fov = 40;
		//gl.setSize(window.innerWidth, window.innerHeight);
		gl.setSize(canvas.clientWidth, canvas.clientHeight);

		camera.position.set(0, 0, 0.0);
		camera.lookAt(0, 0, 0);

		let cone = new Arrow();
		let conemesh = useRef();
		let conemesh1 = useRef();
		let conemesh2 = useRef();
		//let mousedir = useRef();
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

		let arrow = new Arrow();
		let mouseplateG = useRef<THREE.Group>();
		this.threeObjs.navigatorPlate = mouseplateG.current; 
		let showMousePlate = true;
		let isAnimating = false;

		let planegeo = new THREE.PlaneGeometry(40, 40);
		let planemat = new THREE.MeshBasicMaterial({
			color: "grey",
			side: THREE.DoubleSide,
			opacity: 0.0,
			transparent: true
		});
		let rcplane = new THREE.Mesh(planegeo, planemat); //not a remotely-controlled plane, but a mathematical plane that involves in raycast
		rcplane.rotation.set(-Math.PI/2, 0, 0);
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

		let rcObjs: THREE.Object3D[] = [];
		if (this.threeObjs.cone0 && this.threeObjs.cone1 && this.threeObjs.cone2 && compassPlate.current) {
			//getInitialConeBoundingSpheres();
			/*this.threeObjs.raycastedObjects.push(c0Sphere);
			this.threeObjs.raycastedObjects.push(c1Sphere);
			this.threeObjs.raycastedObjects.push(c2Sphere);*/
			rcObjs.push(this.threeObjs.cone0);
			rcObjs.push(this.threeObjs.cone1);
			rcObjs.push(this.threeObjs.cone2);
			//this.threeObjs.raycastedObjects.push(compassPlate.current);
			rcObjs.push(rcplane);
			//this.threeObjs.raycastedObjects.push(compassGroup.current);
			this.threeObjs.raycastedObjects = rcObjs;
		}

		let bsphere = useRef();
		if (bsphere.current) {
			this.threeObjs.cone0.geometry.computeBoundingSphere();
			let center1 = this.threeObjs.cone0.geometry.boundingSphere.center;
			let v1 = new Vector3(center1.x, center1.y, center1.z);
			//@ts-ignore
			coneGroup.current.localToWorld(v1);
		}

		let distanceToArrowInWorldCoord = (mesh, index) => {
			this.threeObjs.navigatorPlate.children[1].geometry.computeBoundingSphere();
			let center0 = this.threeObjs.navigatorPlate.children[1].geometry
				.boundingSphere.center;
			let v0 = new Vector3(center0.x, center0.y, center0.z);
			this.threeObjs.navigatorPlate.localToWorld(v0);

			mesh.geometry.computeBoundingSphere();
			coneBoundingSpheres[index] = mesh.geometry.boundinSphere;
			let center1 = mesh.geometry.boundingSphere.center;
			let v1 = new Vector3(center1.x, center1.y, center1.z);
			mesh.localToWorld(v1);

			return v0.distanceTo(v1);
		};

		let getClosestArrowAndAdjustDirection = () => {
			if (!this.threeObjs.navigatorPlate) return;
			let arr = [this.threeObjs.cone0, this.threeObjs.cone1, this.threeObjs.cone2];
			let dist = new Map<number, THREE.Mesh>();
			for (let i = 0; i < arr.length; i++) {
				if (!arr[i].parent.visible) {
					continue;
				}
				dist.set(distanceToArrowInWorldCoord(arr[i], i), arr[i]);
			}
			let min = Math.min(...dist.keys());
			this.threeObjs.navigatorPlate.rotation.z = dist.get(min).rotation.z;
			this.threeObjs.mouseSelectedArrowMesh = dist.get(min);
		};

		let navigateWithMouse = () => {
			let nArr = [this.members.n0, this.members.n1, this.members.n2];
			let id = nArr[this.threeObjs.mouseSelectedArrowMesh.userData.neighbor].location.id;
			transitionToScene(id);
		};
		
		this.setUpEventListeners();

		if (!this.flags.eventListenersLoaded) {
			canvas.addEventListener("mousewheel", e => this.onScroll(e), false);
			this.flags.eventListenersLoaded = true;
		}

		let animateTransition = id => {
			this.threeObjs.navigatorPlate.visible = false;
			isAnimating = true;
			//Set up parameters for TWEEN animations
			const depth = 13;
			const resFov = 65;
			const camAt = (this.members.neighbors.get(id).bearing * Math.PI) / 180;
			let endAt = (-this.members.neighbors.get(id).bearing * Math.PI) / 180;
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
			let rotBegin = {
				at: (camera as any).rotation.y
			};
			let rotEnd = {
				at: endAt
			};
			let tweenRot = new TWEEN.Tween(rotBegin)
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

			let zoom = {
				zVal: (camera as any).position.z,
				xVal: (camera as any).position.x,
				fovValue: (camera as any).fov,
				opacity: this.threeObjs.cylindermaterial.opacity
			};
			let zoomEnd = {
				zVal: -depth * Math.cos(camAt),
				xVal: depth * Math.sin(camAt),
				fovValue: resFov,
				opacity: 0.1
			};
			let tweenZoom = new TWEEN.Tween(zoom).to(zoomEnd, 500);

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
				this.threeObjs.navigatorPlate.visible = true;
				await this.methods.setNeighbors().then(this.methods.RenderArrows); //.then(()=>{this.InitNeighborPins()});
				this.locks.animationLock = false;
				//console.log("b2");
			});
			tweenRot.chain(tweenZoom);
			this.threeObjs.cylindermaterial.transparent = true;

			tweenRot.start();
		};

		scene.add(this.threeObjs.cylindermesh);
		//RenderCompass();

		let transitionToScene = async pid => {
			this.locks.animationLock = true;
			this.members.loaderSpinnerElem.style.visibility = "visible";
			this.reactions.panoIdChangeReactionDisposer();
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
					//Temporary solution
					cameraY = -this.threeObjs.threeCamera.rotation.y;
					this.members.panoPageStore.updateValues(coord.lat, coord.lng, cameraY, id);

					this.setState({ cameraY });
					this.reactions.panoTypeChangeReactionDisposer();
				},
				undefined,
				err => {
					console.error(err);
				}
			);
		};

		if (this.threeObjs.cone0 && this.threeObjs.cone1 && this.threeObjs.cone2) {
			this.methods.RenderArrows();
		}
		let coneGroup = useRef();
		let compassGroup = useRef();
		let triGeo = useRef();
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

		let testMesh = useRef();
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
								if (!this.locks.animationLock) {
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
								if (!this.locks.animationLock) {
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
								if (!this.locks.animationLock) {
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

				<group ref={mouseplateG} rotation={[-Math.PI/2, 0, 0]}>
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
							if (!this.isDraggin && !this.locks.animationLock) {
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
