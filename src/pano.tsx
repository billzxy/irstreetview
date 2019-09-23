import React, { Component, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from "react-three-fiber";
import { withRouter, RouteComponentProps } from "react-router-dom";
import SVGLoader from "three-svg-loader";

import "./style/pano.css";
import { Location } from "./geo";
import { Arrow, Cylinder } from "./shapes";
import Spinner from "./components/spinner";
//import OrbitControls from 'three-orbitcontrols'

const TWEEN = require("@tweenjs/tween.js");

interface PanoProps extends RouteComponentProps<{ id?: string }> {
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

	constructor(props) {
		super(props);
		this.state = {
			isLoading: true
		};
		this.RenderPano = this.RenderPano.bind(this);
	}
	
	get panoId() {
		// @ts-ignore
		return this.props.match.params.id || "20190724151553";
	}

	componentDidMount() {
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

	//THREEjs objects
	cylindergeometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);
	cylindermaterial = undefined;
	cylindermesh = undefined;
	texture = undefined;
	loader = new THREE.TextureLoader();
	lines = [];

	loadTexture() {
		this.texture = this.loader.load(
			require(`./assets/viewPano/resource/${this.currLoc.fname}`),
			() => {
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
		});
		tweenRot.start();
	}

	RenderPano() {
		var mainCam = useRef();
		var { gl, camera, canvas, scene } = useThree();
		(camera as any).fov = 40;
		//gl.setSize(window.innerWidth, window.innerHeight);
		gl.setSize(canvas.clientWidth, canvas.clientHeight);
		
		camera.position.set(0, 0, 0);
		camera.lookAt(0, 0, 0);
		//canvas.width  = canvas.clientWidth;
		//canvas.height = canvas.clientHeight;
		//gl.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
		/*var controls = new OrbitControls( camera, gl.domElement );
		controls.update();
		controls.touches = {
			ONE: THREE.TOUCH.ROTATE,
			TWO: THREE.TOUCH.DOLLY_PAN
		}
		controls.mouseButtons = {
			LEFT: THREE.MOUSE.ROTATE,
			MIDDLE: THREE.MOUSE.DOLLY,
			RIGHT: THREE.MOUSE.PAN
		}*/

		let cone = new Arrow();
		var conemesh = useRef();
		var conemesh1 = useRef();
		var n0, n1;

		var mouseDown = false,
			mouseX = 0,
			mouseY = 0;

		function onMouseMove(evt) {
			if (!mouseDown) {
				return;
			}
			evt.preventDefault();
			var deltaX = evt.clientX - mouseX,
				deltaY = evt.clientY - mouseY;
			mouseX = evt.clientX;
			mouseY = evt.clientY;

			rotateScene(deltaX);
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
		}

		var startX = 0;

		function onTouchStart(event) {
			startX = (event.targetTouches[0].pageX);
		}

		function onTouchMove(event) {
			var deltaX = (event.targetTouches[0].pageX - startX);
			startX = (event.targetTouches[0].pageX);
			camera.rotation.y += ( deltaX / 1000 );
		}

		function onWindowResize(){
			gl.setSize( canvas.clientWidth, canvas.clientHeight );
			(camera as any).aspect = window.innerWidth / window.innerHeight;
			(camera as any).updateProjectionMatrix();
		}
		
		function rotateScene(deltaX) {
			//console.log(camera.rotation.y);
			camera.rotation.y += deltaX / 1000;
			camera.rotation.y %= 2 * Math.PI;
			
		}

		canvas.addEventListener("mousemove", e => onMouseMove(e), false);
		canvas.addEventListener("mousedown", e => onMouseDown(e), false);
		canvas.addEventListener("mouseup", e => onMouseUp(e), false);

		canvas.addEventListener("touchmove", e => onTouchMove(e), false);
		canvas.addEventListener("touchstart", e => onTouchStart(e), false);
		window.addEventListener( 'resize', onWindowResize, false );
		

		var camZoom = id => {
			const depth = 15.5;
			const resFov = 75;
			const camAt = (this.neighbors.get(id).bearing * Math.PI) / 180;
			var endAt = (-this.neighbors.get(id).bearing * Math.PI) / 180;
			if (camera.rotation.y > 0) {
				endAt = 2 * Math.PI - (this.neighbors.get(id).bearing * Math.PI) / 180;
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
				
			});

			var zoom = {
				zVal: (camera as any).position.z,
				xVal: (camera as any).position.x,
				fovValue: (camera as any).fov
			};
			var zoomEnd = {
				zVal: -depth * Math.cos(camAt),
				xVal: depth * Math.sin(camAt),
				fovValue: resFov
			};
			var tweenZoom = new TWEEN.Tween(zoom).to(zoomEnd, 500);

			tweenZoom.onUpdate(function() {
				(camera as any).position.z = zoom.zVal;
				(camera as any).position.x = zoom.xVal;
				(camera as any).fov = zoom.fovValue;
				(camera as any).updateProjectionMatrix();
			});
			tweenZoom.onComplete(async () => {
				(camera as any).position.z = 0;
				(camera as any).position.x = 0;
				(camera as any).fov = 40;
				(camera as any).updateProjectionMatrix();
				this.cylindermaterial.map = this.texture;
				this.cylindermesh.rotation.y = this.currLoc.calibration
				await this.setNeighbors().then(RenderArrows);//.then(()=>{this.InitNeighborPins()});
			});
			tweenRot.chain(tweenZoom);
			tweenRot.start();
		};

		scene.add(this.cylindermesh);
		//RenderCompass();

		var updateTexture = async (id) => {
			this.currLoc = this.neighbors.get(id).location;
			//await this.currLoc.setAllAttr();
			this.texture = this.loader.load(
				require(`./assets/viewPano/resource/${this.currLoc.fname}`),
				() => {
					camZoom(id);
				},
				undefined,
				err => {
					console.error(err);
				}
			);
		};
		//this.InitNeighborPins();
		
		/*
		var compassGroup = useRef();
		function RenderCompass() {
			var loader = new SVGLoader();
			loader.load(
				process.env.PUBLIC_URL + "compass.svg",
				function(data) {
					var paths = data.paths;
					for (var i = 0; i < paths.length; i++) {
						var path = paths[i];
						var material = new THREE.MeshBasicMaterial({
							color: path.color,
							side: THREE.DoubleSide,
							depthWrite: false
						});
						var shapes = path.toShapes(true);
						for (var j = 0; j < shapes.length; j++) {
							var shape = shapes[j];
							var geometry = new THREE.ShapeBufferGeometry(shape);
							var mesh = new THREE.Mesh(geometry, material);
							(compassGroup.current as any).add(mesh);
						}
					}
					//console.log(compassGroup);
					(compassGroup.current as any).scale.set(13, 13, 13);
					scene.add(compassGroup.current);
				},
				undefined,
				function(error) {
					console.log("Error Loading Compass");
				}
			);
		}*/

		var RenderArrows = () => {
			var iter = this.neighbors.keys();
			//iter.next();
			n0 = this.neighbors.get(iter.next().value);
			let cone0 = conemesh.current as any;
			let cone1 = conemesh1.current as any;
			//position
			cone0.position.z = -Math.cos(n0.bearing * Math.PI / 180);
			cone0.position.x = Math.sin(n0.bearing * Math.PI / 180);
			//rotation
			cone0.rotation.x = -1.5708;
			cone0.rotation.z = (-n0.bearing) * Math.PI / 180;
			cone1.visible = false;
			if(this.neighbors.size>1){
				n1 = this.neighbors.get(iter.next().value);
				cone1.visible = true;
				//position
				cone1.position.z = -Math.cos(n1.bearing * Math.PI / 180);
				cone1.position.x = Math.sin(n1.bearing * Math.PI / 180);
				//rotation
				cone1.rotation.x = -1.5708;
				cone1.rotation.z = (-n1.bearing) * Math.PI / 180;
			}
		}
        if(conemesh.current&&conemesh1.current){
			RenderArrows();
        }
		var coneGroup = useRef();

		useRender(() => {
			TWEEN.update();
			(coneGroup.current as any).position.set(
				-13 * Math.sin(camera.rotation.y),
				-4,
				-13 * Math.cos(camera.rotation.y)
			);
			/*
			(compassGroup.current as any).position.set(
				-13 * Math.sin(camera.rotation.y),
				4,
				-13 * Math.cos(camera.rotation.y)
			);*/
		});

		return (
			<>
				<perspectiveCamera
					ref={mainCam}
					fov={45}
					aspect={window.innerWidth / window.innerHeight}
					onUpdate={self => self.updateProjectionMatrix()}
				/>
				<group ref={coneGroup} /*group of arrows */>
					<mesh //Compass Plate 
						//onClick={()=>{this.CameraLookNorth(camera);}} 
						position={[0, -0.5, 0]} rotation={[-1.571, 0, 0]}
                        geometry={new THREE.CircleGeometry(2, 100, 0)}>
                        <meshBasicMaterial attach="material" color="white" opacity={0.0} transparent={true}/>
					</mesh>

					<mesh //First Arrow
						onClick={() => {
							updateTexture(n0.location.id); /*this.currLoc.updateCalibration(camera)*/
						}}
						onPointerOver={e => {(e.object as any).material.opacity=0.9;}}
						onPointerOut={e => {(e.object as any).material.opacity=0.5;}}
						ref={conemesh}
						geometry={cone.geometry}
					>
						<meshBasicMaterial attach="material" color="light grey" opacity={0.5} transparent={true}/>
					</mesh>
					<mesh //Second Arrow
						onClick={() => {
							updateTexture(n1.location.id);
						}}
						onPointerOver={e => {(e.object as any).material.opacity=0.9;}}
						onPointerOut={e => {(e.object as any).material.opacity=0.5;}}
                        ref={conemesh1}
                        geometry={cone.geometry}
                    >
                        <meshBasicMaterial attach="material" color="white" opacity={0.5} transparent={true}/>
                    </mesh>
				</group>
				{/*
				<group
					onClick={() => this.CameraLookNorth(camera)}
					ref={compassGroup}
				></group>*/}
			</>
		);
	}
	//TODO: change the pano window render size
	render() {
		const { isLoading } = this.state;
		return isLoading ? (
			<div className={"spinner-container"}>
				<Spinner width={100} height={100} />
			</div>
		) : (
			<div className="Pano-canvas">
				<Canvas>
					<this.RenderPano />
				</Canvas>
			</div>
		);
	}
}

export default withRouter(Pano);
