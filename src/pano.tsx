import React, { Component, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from "react-three-fiber";
import { withRouter, RouteComponentProps } from "react-router-dom";
//import SVGLoader from "three-svg-loader";
import { disableBodyScroll } from 'body-scroll-lock';

import "./style/pano.css";
import Minimap, {MapStore} from "./minimap"
import { Location } from "./geo";
import { Arrow, Cylinder } from "./shapes";
import Spinner from "./components/spinner";
import { observable, reaction } from "mobx";
import { Vector3 } from "three";
//import { observer } from "mobx-react";
//import OrbitControls from 'three-orbitcontrols'

const TWEEN = require("@tweenjs/tween.js");

interface PanoProps extends RouteComponentProps<{ id?: string, position? }> {
	lid: string;
}

type PanoState = { isLoading: boolean };
type NeighborType = {
	location: Location;
	distance: number;
	bearing: number;
};

class Pano extends Component<PanoProps, PanoState> {
	//Members
	currLoc: Location;
	neighbors: Map<string, NeighborType>;
	mapStore = undefined;
	panoStore = undefined;
	panoIdChangeReaction;
	canvasStyle = {cursor:"default"};	

	constructor(props) {
		super(props);
		this.state = {
			isLoading: true
		};
		this.RenderPano = this.RenderPano.bind(this);
	}
	
	get panoId() {
		// @ts-ignore
		return this.props.match.params.id || "20190724143833";
	}

	componentDidMount() {
		disableBodyScroll(document.querySelector('#interface'));
		var setCurrLocAndNeighbors = async () => {
			//setCurrLoc
			this.currLoc = new Location(this.panoId);
			await this.currLoc.setAllAttr().then(() => {
				this.loadTexture();
			});
			//setNeighbors
			this.neighbors = new Map();
			this.setNeighbors();
		};
		setCurrLocAndNeighbors();
	}

	componentWillUnmount(){
		console.log("Unmount pano...");
	}
	
	async setNeighbors() {//Only supports two neighbors for now
        this.neighbors.clear();//Purge previous neighbors
		await this.currLoc.getNeighborIds();
		let nidArr = this.currLoc.neighborArr;
		if((nidArr as any).length===0){
			console.log("No neighbors discorvered...");
			return ;
		}
		else{
			for(let nid of nidArr as any){
				let nextLoc = new Location(nid);
				await nextLoc.setAllAttr().then(() => {
					this.addNeighbor(nextLoc);
				});
			}
		}
	}

	addNeighbor(n: Location) {
		this.neighbors.set(n.id, {
			location: n,
			distance: this.currLoc.getDistanceTo(n),
			bearing: this.currLoc.getBearingTo(n)
		});
	}

	toggleCursor(isPointer){
		if(isPointer){
			this.canvasStyle = {cursor:"pointer"}
		}else{
			this.canvasStyle = {cursor:"default"}
		}
	}

	//THREEjs objects
	cylindergeometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);
	cylindermaterial = undefined;
	cylindermesh = undefined;
	texture = undefined;
	loader = new THREE.TextureLoader();
	lines = [];
	
    tempcylindergeometry = new THREE.CylinderBufferGeometry(21, 21, 15, 100, 1, true);
	tempcylindermaterial = undefined;
	tempcylindermesh = undefined;
	threeCamera = undefined;
	threeScene = undefined;

	cone0:THREE.Mesh;
	cone1:THREE.Mesh;
	cone2:THREE.Mesh;

	pinSphereGeometry = new THREE.SphereGeometry(0.5,16,16);
	pinNeedleGeometry = new THREE.CylinderGeometry(0.075, 0.025, 3, 10, 1, false);
	pin0:THREE.Group;
	pin1:THREE.Group;
	pin2:THREE.Group;

	//Neighbors
	n0:NeighborType;
	n1:NeighborType;
	n2:NeighborType;

	mouseSelectedArrowMesh:THREE.Mesh;

	

	loadTexture() {
		this.texture = this.loader.load(
			require(`./assets/viewPano/resource/${this.currLoc.fname}`),
			() => {
				this.mapStore = new MapStore(this.currLoc.coord.lat, this.currLoc.coord.lng, 0.0, this.currLoc.id);
				this.panoStore = new PanoStore(this.currLoc.id);
				this.panoIdChangeReaction = reaction(
					() => this.panoStore.id,
					(id, reaction) => {
						//console.log(this.panoStore);
						this.teleportToScene(id);
						//reaction.dispose();
					}
				);
				this.setState({ isLoading: false });
			},
			undefined,
			err => {
				console.error(err);
			}
		);

		this.cylindermaterial = new THREE.MeshBasicMaterial({
			map: this.texture,
			side: THREE.DoubleSide
		});
		this.cylindermesh = new THREE.Mesh(
			this.cylindergeometry,
			this.cylindermaterial
		);
		this.cylindergeometry.scale(-1, 1, 1);
		//this.cylindermesh.position.y = 0
        this.cylindermesh.rotation.y = this.currLoc.calibration;
	}
	

	/*
	InitNeighborPins() {
		console.log(this.lines);
		if (this.lines.length !== 0) {
			this.lines = [];
		}
		this.neighbors.forEach((loc, id) => {
			let bearing = loc.bearing;
			let line = new THREE.LineBasicMaterial({ color: "blue" });
			let geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(0, -5, 0));
			geometry.vertices.push(
				new THREE.Vector3(
					20 * Math.sin((bearing * Math.PI) / 180),
					-5,
					-20 * Math.cos((bearing * Math.PI) / 180)
				)
			);
			this.lines.push(new THREE.Line(geometry, line));
		});
	}*/

	CameraLookNorth(camera) {
		var rotBegin = {
			at: camera.rotation.y
		};
		var rotEnd = {
			at: 0
		};
		var tweenRot = new TWEEN.Tween(rotBegin)
			.to(rotEnd, 750)
			.easing(TWEEN.Easing.Quadratic.InOut);
		tweenRot.onUpdate(function() {
			camera.rotation.y = rotBegin.at;
		});
		tweenRot.onComplete(() => {
			camera.rotation.y = 0;
			this.mapStore.updatePegmanOffset(0.0);
		});
		tweenRot.start();
	}

	teleportToScene = async (id) => {
		//console.log("Teleporting to: "+id);
		this.currLoc = new Location(id);
		await this.currLoc.setAllAttr().then(()=>{
			this.texture = this.loader.load(
				require(`./assets/viewPano/resource/${this.currLoc.fname}`),
				() => {//onComplete
					this.tempcylindermaterial = new THREE.MeshBasicMaterial({
						map: this.texture,
						side: THREE.DoubleSide
					});
					this.tempcylindermesh = new THREE.Mesh(
						this.tempcylindergeometry,
						this.tempcylindermaterial
					);
					this.tempcylindergeometry.scale(-1, 1, 1);
					this.tempcylindermesh.rotation.y = this.currLoc.calibration;
					this.threeScene.add(this.tempcylindermesh);
					this.animateTeleportationTextureFade();
					let {coord, cameraY, id} = this.currLoc;
					this.mapStore.updateValues(coord.lat, coord.lng, cameraY, id);
				},
				undefined,
				err => {
					console.error(err);
				}
			);
		});
	}

	animateTeleportationTextureFade = () => {
		var fadeBegin = {
			at: this.cylindermaterial.opacity
		};
		var fadeEnd = {
			at: 0.1
		};
		var crossfade = new TWEEN.Tween(fadeBegin)
			.to(fadeEnd, 500)
			.easing(TWEEN.Easing.Quadratic.InOut);
		crossfade.onUpdate(() => {
			//console.log(this.cylindermaterial);
			this.cylindermaterial.opacity = fadeBegin.at;
		});
		crossfade.onComplete( async () => {
			//reset camera zoom and pos
			this.threeCamera.rotation.y = 0;
			(this.threeCamera as any).fov = 40;
			(this.threeCamera as any).updateProjectionMatrix();
			//When animations are completed, textures are swapped
			
			this.cylindermaterial.map = this.texture;
			this.cylindermesh.rotation.y = this.currLoc.calibration;
			this.cylindermaterial.transparent = false;
			this.cylindermaterial.opacity = 1.0;

			this.threeScene.remove(this.tempcylindermesh);
			this.tempcylindermesh.geometry.dispose();
			this.tempcylindermesh.material.dispose();
			this.tempcylindermesh = undefined;
			this.tempcylindergeometry.scale(-1,1,1);
			await this.setNeighbors().then(this.RenderArrows);
		});
		this.cylindermaterial.transparent = true;
		crossfade.start();
	}

	RenderArrows = () => {
		var iter = this.neighbors.keys();
		//iter.next();
		this.n0 = this.neighbors.get(iter.next().value);
		console.log(this.currLoc.id);
		let arrowSpacing = 7.5;
		//position
		this.cone0.position.z = - arrowSpacing * Math.cos(this.n0.bearing * Math.PI / 180);
		this.cone0.position.x = arrowSpacing * Math.sin(this.n0.bearing * Math.PI / 180);
		//rotation
		this.cone0.rotation.x = -1.5708;
		this.cone0.rotation.z = (-this.n0.bearing) * Math.PI / 180;
		this.cone1.visible = false;
		this.cone2.visible = false;
		//this.cone0.geometry.computeBoundingSphere();
		
		if(this.neighbors.size>1){
			this.n1 = this.neighbors.get(iter.next().value);
			this.cone1.visible = true;
			//position
			this.cone1.position.z = -arrowSpacing * Math.cos(this.n1.bearing * Math.PI / 180);
			this.cone1.position.x = arrowSpacing * Math.sin(this.n1.bearing * Math.PI / 180);
			//rotation
			this.cone1.rotation.x = -1.5708;
			this.cone1.rotation.z = (-this.n1.bearing) * Math.PI / 180;
			//console.log(this.cone1.rotation.z);
			//this.cone1.geometry.computeBoundingSphere();
			//console.log(this.cone1.localToWorld(this.cone1.geometry.boundingSphere.center));
		}
		if(this.neighbors.size===3){
			this.n2 = this.neighbors.get(iter.next().value);
			this.cone2.visible = true;
			//position
			this.cone2.position.z = -arrowSpacing * Math.cos(this.n2.bearing * Math.PI / 180);
			this.cone2.position.x = arrowSpacing * Math.sin(this.n2.bearing * Math.PI / 180);
			//rotation
			this.cone2.rotation.x = -1.5708;
			this.cone2.rotation.z = (-this.n2.bearing) * Math.PI / 180;
			//this.cone2.geometry.computeBoundingSphere();
			//console.log(this.cone2.rotation.z);
		}
	}

	RenderPano() {
		var { gl, camera, scene, canvas, raycaster } = useThree();
		//var canvas = gl.domElement;  // for react-three-fiber v3.x
		this.threeCamera = camera;
		this.threeScene = scene;
		
		(camera as any).fov = 40;
		//gl.setSize(window.innerWidth, window.innerHeight);
		gl.setSize(canvas.clientWidth, canvas.clientHeight);
		
		camera.position.set(0, 0, 0.01);
		camera.lookAt(0, 0, 0);

		let cone = new Arrow();
		var conemesh = useRef();
		var conemesh1 = useRef();
		var conemesh2 = useRef();
		//var mousedir = useRef();
		var compassPlate = useRef();

		this.cone0 = conemesh.current as any;
		this.cone1 = conemesh1.current as any;
		this.cone2 = conemesh2.current as any;

		

		var mouse = { x: 0, y: 0 };
		let arrow = new Arrow();
		let mouseplateG = useRef();
		var showMousePlate = true;
		var isAnimating = false;
		let isDraggin = false;
	
		var rcObjects = [];

		var planegeo = new THREE.PlaneGeometry(40, 40);
		var planemat = new THREE.MeshBasicMaterial({ color: "grey", side: THREE.DoubleSide, opacity:0.0, transparent:true });
		var rcplane = new THREE.Mesh(planegeo, planemat); //not a remotely-controlled plane, but a mathematical plane that involves in raycast
		rcplane.rotation.set(-1.5708, 0, 0);
		rcplane.position.set(0,-1,0);
		scene.add(rcplane);
		if (conemesh.current && conemesh1.current && conemesh2.current && compassPlate.current) {
			rcObjects.push(conemesh.current);
			rcObjects.push(conemesh1.current);
			rcObjects.push(conemesh2.current);
			rcObjects.push(compassPlate.current);
			rcObjects.push(rcplane);
			//rcObjects.push(compassGroup.current);
		}

		var bsphere = useRef();
		if(bsphere.current){
			this.cone0.geometry.computeBoundingSphere();
			let center1 = this.cone0.geometry.boundingSphere.center;
			let v1 = new Vector3(center1.x,center1.y,center1.z);
			//@ts-ignore
			coneGroup.current.localToWorld(v1);
		}

		var distanceToArrowInWorldCoord = (mesh) => {
			(mouseplateG.current as any).children[1].geometry.computeBoundingSphere();
			let center0 = (mouseplateG.current as any).children[1].geometry.boundingSphere.center;
			let v0 = new Vector3(center0.x,center0.y,center0.z);
			(mouseplateG.current as any).localToWorld(v0);

			mesh.geometry.computeBoundingSphere();
			let center1 = mesh.geometry.boundingSphere.center;
			let v1 = new Vector3(center1.x,center1.y,center1.z);
			mesh.localToWorld(v1);
			
			return v0.distanceTo(v1);
		}

		var getClosestArrowAndAdjustDirection = () => {
			if(!mouseplateG.current)
				return;
			let arr = [this.cone0, this.cone1, this.cone2];
			let dist = new Map<number, THREE.Mesh>();
			for(let cone of arr){
				if(!cone.visible){
					continue;
				}
				dist.set( distanceToArrowInWorldCoord(cone), cone );
			}
			let min = Math.min(...dist.keys());
			(mouseplateG.current as any).rotation.z = dist.get(min).rotation.z;
			this.mouseSelectedArrowMesh = dist.get(min);
		}

		var navigateWithMouse = () => {
			let nArr = [this.n0, this.n1, this.n2];
			let id = nArr[this.mouseSelectedArrowMesh.userData.neighbor].location.id;
			transitionToScene(id);
		}

		var onMouseMove2 = ( event ) => {
			if(mouseplateG.current){
				event.preventDefault();
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
				raycaster.setFromCamera(mouse, camera);
				var intersects = raycaster.intersectObjects(rcObjects);
				if (intersects.length > 0) {
					var intersect = intersects[0];
					//console.log( intersects[ 0 ]);
					if( intersects.length === 1){//intersect.object===rcplane){
						//console.log(compassGroup.current);
						(mouseplateG.current as any).visible = true;
						(mouseplateG.current as any).position.copy(intersect.point).add(new THREE.Vector3(0, 0.01, 0));
					}else{
						(mouseplateG.current as any).visible = false;
					}
					
				}
			}
		}

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
			startX = (event.targetTouches[0].pageX);
		}

		function onTouchMove(event) {
			var deltaX = (event.targetTouches[0].pageX - startX);
			startX = (event.targetTouches[0].pageX);
			rotateScene(deltaX);
		}

		//Mouse wheel rotation control
		function onScroll(event) {
			if(event.path[0]===canvas){
				var deltaY = event.wheelDeltaY / 3;
				rotateScene(deltaY);
			}
        }
        
		var rotateScene = (deltaX) => {
			isDraggin = true;
			camera.rotation.y += deltaX / 1000;
			camera.rotation.y %= 2 * Math.PI;
			this.mapStore.updatePegmanOffset(camera.rotation.y);
		}
		
		function onWindowResize(){
			gl.setSize(canvas.clientWidth, canvas.clientHeight);
			(camera as any).aspect = canvas.clientWidth / canvas.clientHeight;
			(camera as any).updateProjectionMatrix();
		}


		window.addEventListener('mousemove', onMouseMove2, false);
		canvas.addEventListener("mousemove", e => onMouseMove(e), false);
		canvas.addEventListener("mousedown", e => onMouseDown(e), false);
		canvas.addEventListener("mouseup", e => onMouseUp(e), false);
		canvas.addEventListener("mousewheel", e => onScroll(e),false);
		canvas.addEventListener("touchmove", e => onTouchMove(e), false);
		canvas.addEventListener("touchstart", e => onTouchStart(e), false);
		window.addEventListener( 'resize', onWindowResize, false );

		var animateTransition = id => {
			(mouseplateG.current as any).visible = false;
			isAnimating = true;
            //Set up parameters for TWEEN animations
			const depth = 13;
			const resFov = 65;
			const camAt = (this.neighbors.get(id).bearing * Math.PI) / 180;
			var endAt = (-this.neighbors.get(id).bearing * Math.PI) / 180;
			if (camera.rotation.y > 0) {
				endAt = 2 * Math.PI - (this.neighbors.get(id).bearing * Math.PI) / 180;
			}
			if(camera.rotation.y-endAt >= Math.PI && camera.rotation.y-endAt<2*Math.PI){
				endAt += 2 * Math.PI; 
			}else if( camera.rotation.y-endAt <= -Math.PI && camera.rotation.y-endAt< -2*Math.PI){
				endAt = - 2 * Math.PI + endAt;
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
			tweenRot.onUpdate(function() {
				(camera as any).rotation.y = rotBegin.at;
			});
			tweenRot.onComplete(() => {
				camera.rotation.y = (-this.neighbors.get(id).bearing * Math.PI) / 180;
				this.mapStore.updatePegmanOffset(camera.rotation.y);
			});

			var zoom = {
				zVal: (camera as any).position.z,
				xVal: (camera as any).position.x,
                fovValue: (camera as any).fov,
                opacity: this.cylindermaterial.opacity
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
                this.cylindermaterial.opacity = zoom.opacity;
			});
			tweenZoom.onComplete(async () => {
                //reset camera zoom and pos
                camera.position.set(0,0,0);
				(camera as any).fov = 40;
                (camera as any).updateProjectionMatrix();
                //When animations are completed, textures are swapped
                
                this.cylindermaterial.map = this.texture;
                this.cylindermesh.rotation.y = this.currLoc.calibration;
                this.cylindermaterial.transparent = false;
                this.cylindermaterial.opacity = 1.0;

                scene.remove(this.tempcylindermesh);
                this.tempcylindermesh.geometry.dispose();
                this.tempcylindermesh.material.dispose();
                this.tempcylindermesh = undefined;
				this.tempcylindergeometry.scale(-1,1,1);
				isAnimating = false;
				(mouseplateG.current as any).visible = true;
				await this.setNeighbors().then(this.RenderArrows);//.then(()=>{this.InitNeighborPins()});
			});
            tweenRot.chain(tweenZoom);
            this.cylindermaterial.transparent = true;
            
			tweenRot.start();
		};
        
        scene.add(this.cylindermesh);
		//RenderCompass();

		var transitionToScene = async (pid) => {
			this.currLoc = this.neighbors.get(pid).location;
			//await this.currLoc.setAllAttr();
			this.texture = this.loader.load(
				require(`./assets/viewPano/resource/${this.currLoc.fname}`),
				() => {//onComplete
                    this.tempcylindermaterial = new THREE.MeshBasicMaterial({
                        map: this.texture,
                        side: THREE.DoubleSide
                    });
                    this.tempcylindermesh = new THREE.Mesh(
                        this.tempcylindergeometry,
                        this.tempcylindermaterial
                    );
                    this.tempcylindergeometry.scale(-1, 1, 1);
                    this.tempcylindermesh.rotation.y = this.currLoc.calibration;
                    scene.add(this.tempcylindermesh);
					animateTransition(pid);
					let {coord, cameraY, id} = this.currLoc;
					this.mapStore.updateValues(coord.lat, coord.lng, cameraY, id);
				},
				undefined,
				err => {
					console.error(err);
				}
			);
		};
		
        if(conemesh.current&&conemesh1.current&&conemesh2.current){
			this.RenderArrows();
        }
		var coneGroup = useRef();
		var compassGroup = useRef();
		var triGeo = useRef();
		let triGeoArr = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.6, -1, 0), new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0.6, -1, 0)];
		if (triGeo.current){
			(triGeo.current as any).vertices = triGeoArr;
			(triGeo.current as any).faces.push( new THREE.Face3( 0, 1, 2 ) );
			(triGeo.current as any).faces.push( new THREE.Face3( 0, 2, 3 ) );
			(triGeo.current as any).computeFaceNormals();
			(triGeo.current as any).scale(0.3, 0.3, 0.3);
		}
		function setChildrenOpacity(group, opc){
			for(let child of group){
				child.material.opacity = opc;
			}
        }
        
        var testMesh = useRef();
        if(testMesh.current){
            (testMesh.current as any).geometry.scale(2,2,2);
		}

		useRender(() => {
			TWEEN.update();
			(coneGroup.current as any).position.set(
				-3 * Math.sin(camera.rotation.y),
				-0.9,
				-3 * Math.cos(camera.rotation.y)
			);
			(compassGroup.current as any).position.set(
				-3 * Math.sin(camera.rotation.y-0.4),
				-0.8,
				-3 * Math.cos(camera.rotation.y-0.4)
			);
			(compassGroup.current as any).rotation.y=camera.rotation.y;
			(compassGroup.current as any).rotation.z=-camera.rotation.y;
			
			getClosestArrowAndAdjustDirection();
			

		});

		return (
			<>
				<group /*group of arrows */

					ref={coneGroup}
					scale={[0.2, 0.2, 0.2]}
				>
					<mesh //First Arrow
						userData={{neighbor:0}}
						onClick={() => {
							transitionToScene(this.n0.location.id); /*this.currLoc.updateCalibration(camera)*/
						}}
						onPointerOver={e => {(e.object as any).material.opacity=0.9;}}
						onPointerOut={e => {(e.object as any).material.opacity=0.65;}}
						ref={conemesh}
						geometry={cone.geometry}
					>
						<meshBasicMaterial attach="material" color="white" opacity={0.5} transparent={true}/>
					</mesh>
					<mesh //Second Arrow
						userData={{neighbor:1}}
						onClick={() => {
							transitionToScene(this.n1.location.id);
						}}
						onPointerOver={e => {(e.object as any).material.opacity=0.9;}}
						onPointerOut={e => {(e.object as any).material.opacity=0.65;}}
                        ref={conemesh1}
                        geometry={cone.geometry}
                    >
                        <meshBasicMaterial attach="material" color="white" opacity={0.5} transparent={true}/>
                    </mesh>
					<mesh //Third Arrow
						userData={{neighbor:2}}
						onClick={() => {
							transitionToScene(this.n2.location.id);
						}}
						onPointerOver={e => {(e.object as any).material.opacity=0.9;}}
						onPointerOut={e => { (e.object as any).material.opacity = 0.65; }}
						ref={conemesh2}
						geometry={cone.geometry}
					>
						<meshBasicMaterial attach="material" color="white" opacity={0.5} transparent={true} />
					</mesh>
					
					
				</group>
				<group
					onPointerOver={e => {setChildrenOpacity(e.object.children, 0.8); this.toggleCursor(true);}}
					onPointerOut={e => {setChildrenOpacity(e.object.children, 0.5); this.toggleCursor(false);}}
					ref={compassGroup}
					position={[0,0,-3]}
					scale={[0.3, 0.3, 0.3]}
				>
					<mesh //Compass Plate 
						onClick={() => this.CameraLookNorth(camera)}
						geometry={new THREE.CircleGeometry(0.4, 100, 0)}
						ref={compassPlate}	
					>
						<meshBasicMaterial attach="material" color="white" opacity={0.5} transparent={true} />
					</mesh>
					<mesh //Compass North Arrow 
						position={[0, 0.03, 0.01]}
					>
						<geometry
							attach="geometry"
							ref={triGeo}
						/>
						<meshBasicMaterial attach="material" color="red" opacity={0.5} transparent={true} />
					</mesh>
				</group>

				<group
					ref={mouseplateG}
					rotation={[-1.5708, 0, 0]}
					onPointerUp={()=>{if(!isDraggin){ navigateWithMouse(); }}}
				>
					<mesh
						geometry={arrow.geometry}
						position={[0, 0.05, 0.001]}
						
						scale={[0.2, 0.12, 0.2]}
					>
						<meshBasicMaterial attach="material" color="grey" opacity={0.7} transparent={true} />
					</mesh>
					<mesh
						geometry={new THREE.CircleGeometry(0.4, 100, 0)}
					>
						<meshBasicMaterial attach="material" color="white" opacity={0.7} transparent={true} />
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
							geometry={this.pinNeedleGeometry}
							position={[0, -2, 0]}
						>
							<meshBasicMaterial attach="material" color="white" opacity={0.75} transparent={true} />
						</mesh>
						<mesh
							geometry={this.pinSphereGeometry}
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
		const { isLoading } = this.state;
		console.log("render")
		return isLoading ? (
			<div className={"spinner-container"}>
				<Spinner width={100} height={100} />
			</div>
		) : (
			<div className="Pano-container">
				<div className="Pano-canvas" style={this.canvasStyle}>
					<Canvas>
						<this.RenderPano />
					</Canvas>
				</div>
				<div>
					<Minimap mapStore={this.mapStore} panoStore={this.panoStore}/>
				</div>
			</div>
		);
	}
}

export class PanoStore{
	@observable id: string

	constructor(id){
		this.id=id;
	}

	public updateId(id){
		this.id=id;
	}
}

export default withRouter(Pano);

