import React, { Component } from "react";
import ReactDOM from 'react-dom';
import * as THREE from "three";
import { Canvas, useThree } from 'react-three-fiber'
import './style/pano.css'
import * as App from "./App"

type PanoProps = {lid: number}
type PanoState = {lid: number}

class Pano extends Component<PanoProps, PanoState> {
    constructor(props){
        super(props);
        this.state = {
            lid: props.lid,
        }
        this.PanoMain = this.PanoMain.bind(this);
    }

    PanoMain() {
        var { gl, camera, canvas, scene } = useThree()
        gl.setSize(window.innerWidth, window.innerHeight)
        camera.position.z = 0
        camera.lookAt(1, 0, 0)

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

            rotateScene(deltaX, deltaY);
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
        function rotateScene(deltaX, deltaY) {
            camera.rotation.y += deltaX / 500;
            //camera.rotation.x += deltaY / 500;
        }
        //TODO: texture is wrongly attached inside out
        var loader = new THREE.TextureLoader();
        var texture = loader.load(process.env.PUBLIC_URL + 'resource/pano-'+(this.state as any).lid+'-mx.png', undefined, undefined, err => {
            console.error(err)
        });

        //var texture = loader.load(process.env.PUBLIC_URL + 'resource/pano-demo.png', undefined, undefined, err => {
            //console.error(err)
        //});

        var plane = new THREE.BoxBufferGeometry(1, 1, 1);
        var material1 = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        var mesh = new THREE.Mesh(plane, material1);

        var geometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);
        var material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        var tubeMesh = new THREE.Mesh(geometry, material);
        //scene.add(mesh);
        scene.add(tubeMesh);

        return (
            <group></group>
        )
    }
    //TODO: change the pano window render size
    render() {
        return (
            <div className="Pano-canvas">
                <Canvas
                    camera={new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000)}
                >
                    <this.PanoMain />
                </Canvas>
            </div>
        )
    }
}

export default Pano;

