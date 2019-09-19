import React, { Component, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from 'react-three-fiber'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import './style/pano.css'
import { Location } from './geo'
import { Arrow, Cylinder } from './shapes'

const TWEEN = require('@tweenjs/tween.js');

interface PanoProps extends RouteComponentProps<{ id?: string }> {
    lid: string
}

type PanoState = { isLoading: boolean }
type NeighborType = {
    location: Location,
    distance: number,
    bearing: number
}

class Pano extends Component<PanoProps, PanoState> {
    //Members
    currLoc: Location
    neighbors: Map<string, NeighborType>

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true
        };
        this.RenderPano = this.RenderPano.bind(this);
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
            this.setState({ isLoading: false })
        }
        setCurrLocAndNeighbors();
    }

    async setNeighbors() {//Hardcoded function to test out two panos
        this.neighbors.clear();//Purge previous neighbors
        var next;
        console.log(this.currLoc.id)
        switch (this.currLoc.id) {
            case "20190724143833":
                next = new Location("20190724143458");
                break;
            case "20190724143458":
                next = new Location("20190724143833");
                break;
        }
        await next.setAllAttr().then(() => {
            this.addNeighbor(next);
        });
    }

    get panoId() {
        return this.props.match.params.id
    }

    addNeighbor(n: Location) {
        this.neighbors.set(n.id, {
            location: n,
            distance: this.currLoc.getDistanceTo(n),
            bearing: this.currLoc.getBearingTo(n)
        })
    }

    cylindergeometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);
    cylindermaterial = undefined;
    cylindermesh = undefined;
    texture = undefined;
    loader = new THREE.TextureLoader();
    lines = []

    loadTexture() {
        this.texture = this.loader.load(process.env.PUBLIC_URL + 'resource/' + this.currLoc.fname, undefined, undefined, err => {
            console.error(err)
        });

        this.cylindermaterial = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.DoubleSide });
        this.cylindermesh = new THREE.Mesh(this.cylindergeometry, this.cylindermaterial);
        this.cylindergeometry.scale(-1, 1, 1);
        //this.cylindermesh.position.y = 0
        this.cylindermesh.rotation.y = this.currLoc.calibration
    }

    InitNeighborPins() {
        console.log(this.lines)
        if (this.lines.length !== 0) {
            this.lines = [];
        }
        this.neighbors.forEach((loc, id) => {
            let bearing = loc.bearing;
            let line = new THREE.LineBasicMaterial({ color: "blue" });
            let geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(0, -5, 0));
            geometry.vertices.push(new THREE.Vector3(20 * Math.sin(bearing * Math.PI / 180), -5, -20 * Math.cos(bearing * Math.PI / 180)));
            this.lines.push(new THREE.Line(geometry, line));
        })
    }

    RenderPano() {
        var mainCam = useRef();
        var { gl, camera, canvas, scene } = useThree();
        (camera as any).fov = 40;
        gl.setSize(window.innerWidth, window.innerHeight)
        camera.position.set(0, 0, 0)
        camera.lookAt(0, 0, 0)

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
        canvas.addEventListener('mousemove', e => onMouseMove(e), false);
        canvas.addEventListener('mousedown', e => onMouseDown(e), false);
        canvas.addEventListener('mouseup', e => onMouseUp(e), false);
        function rotateScene(deltaX) {
            //console.log(camera.rotation.y);
            camera.rotation.y += deltaX / 1000;
            camera.rotation.y %= (2 * Math.PI)
        }

        var camZoom = (id) => {
            const depth = 15.5;
            const resFov = 75;
            const camAt = this.neighbors.get(id).bearing * Math.PI / 180;
            var endAt = -(this.neighbors.get(id).bearing) * Math.PI / 180;
            if (camera.rotation.y > 0) {
                endAt = 2 * Math.PI - (this.neighbors.get(id).bearing) * Math.PI / 180;
            }
            var rotBegin = {
                at: (camera as any).rotation.y
            }
            var rotEnd = {
                at: endAt
            }
            var tweenRot = new TWEEN.Tween(rotBegin).to(rotEnd, 500).easing(TWEEN.Easing.Quadratic.InOut);
            tweenRot.onUpdate(function () {
                (camera as any).rotation.y = rotBegin.at;
            });
            tweenRot.onComplete(() => {

                camera.rotation.y = -(this.neighbors.get(id).bearing) * Math.PI / 180
            })

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

            tweenZoom.onUpdate(function () {
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
                //this.cylindermesh.rotation.y = this.currLoc.calibration
                //await this.setNeighbors();//.then(()=>{this.InitNeighborPins()});
                ;
            });
            tweenRot.chain(tweenZoom);
            tweenRot.start();
        }

        scene.add(this.cylindermesh);

        var updateTexture = async () => {
            //TODO: Implement parameter passing
            var id = "";
            switch (this.currLoc.id) {
                case "20190724143833":
                    id = "20190724143458";
                    break;
                case "20190724143458":
                    id = "20190724143833";
                    break;
            }
            this.currLoc = new Location(id);
            await this.currLoc.setAllAttr();
            this.texture = this.loader.load(process.env.PUBLIC_URL + 'resource/' + this.currLoc.fname, () => { camZoom(id) }, undefined, err => {
                console.error(err)
            });
        }
        //this.InitNeighborPins();
        /*
        var line1 = new THREE.LineBasicMaterial( { color: "black" } );
        var geometry1 = new THREE.Geometry();
        geometry1.vertices.push(new THREE.Vector3( 0, -5, 0) );
        geometry1.vertices.push(new THREE.Vector3( 0, -5, -20) );
        var line2 = new THREE.LineBasicMaterial( { color: "red" } );
        var geometry2 = new THREE.Geometry();
        geometry2.vertices.push(new THREE.Vector3( 0, -5, 0) );
        geometry2.vertices.push(new THREE.Vector3( 0, -5, 20) );
        var southline = new THREE.Line( geometry1, line1 );
        var northline = new THREE.Line( geometry2, line2 );
        
        scene.add( northline );
        scene.add( southline );
        //scene.add(this.lines[0]);
        */
        let cone = new Arrow();
        var conemesh = useRef();
        useRender(() => {
            TWEEN.update();
            (conemesh.current as any).position.set(-13 * Math.sin(camera.rotation.y), -2, -13 * Math.cos(camera.rotation.y));
        })

        return (
            <>
                <perspectiveCamera
                    ref={mainCam}
                    fov={45}
                    aspect={window.innerWidth / window.innerHeight}
                    onUpdate={self => self.updateProjectionMatrix()}
                />
                <group>
                    {/*<mesh onClick={updateTexture} position={[0, -6.6, 0]} rotation={[-1.571, 0, 0]}
                        geometry={new THREE.CircleGeometry(20, 100, 0)}>
                        <meshBasicMaterial attach="material" color="grey" />
        </mesh>*/}
                    <mesh onClick={() => { this.currLoc.updateCalibration(camera) }}
                        ref={conemesh}
                        geometry={cone.geometry}
                    >
                        <meshBasicMaterial attach="material" color="white" />
                    </mesh>
                </group>
            </>
        )
    }
    //TODO: change the pano window render size
    render() {
        const { isLoading } = this.state

        return isLoading
            ? (<div><h3>Loading...</h3></div>)
            : (
                <div className="Pano-canvas">
                    <Canvas>
                        <this.RenderPano />
                    </Canvas>
                </div>
            )
    }
}

export default withRouter(Pano);

