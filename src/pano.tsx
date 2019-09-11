import React, { Component, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from 'react-three-fiber'
import './style/pano.css'
import {Neighbors,Location} from './geo'
//import { EffectComposer } from './postprocessing/EffectComposer'

const TWEEN = require('@tweenjs/tween.js');

type PanoProps = {lid: string}
type PanoState = {isLoading: boolean}

class Pano extends Component<PanoProps, PanoState> {
    //Members
    currLoc: Location
    neighbors: Neighbors[]

    constructor(props){
        super(props);
        this.state = {
            isLoading: true
        };
        var setCurrLoc = async () =>{
            this.currLoc = new Location(this.props.lid);
            await this.currLoc.setAllAttr();
            this.loadTexture();
            this.setState({isLoading:false})
        }
        setCurrLoc();
        this.RenderPano = this.RenderPano.bind(this);

        
    }
    /*
    getPanoAttributes= async (id) => {
        this.setState({ isLoading: true })
        await api.getPanoAllAttrById(id).then(result =>{
            console.log(result.data.data.filename);
            this.setState({
                filename: result.data.data.filename,
                isLoading: false
            })
            this.calibration = result.data.data.calibration
        })
    }*/
    //calibration = undefined
    //boxRef = React.createRef();
    //isUpdating = false;
    //fname = this.state.filename;
    cylindergeometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);
    cylindermaterial = undefined;
    cylindermesh = undefined;
    texture = undefined;
    loader = new THREE.TextureLoader();

    loadTexture() {
        this.texture = this.loader.load(process.env.PUBLIC_URL + 'resource/'+this.currLoc.fname, undefined, undefined, err => {
            console.error(err)
        });
        //texture.needsUpdate = true;
        
        this.cylindermaterial = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.DoubleSide });
        this.cylindermesh = new THREE.Mesh(this.cylindergeometry, this.cylindermaterial);
        this.cylindergeometry.scale(-1, 1, 1);
        this.cylindermesh.position.y = 2
        //console.log(this.currLoc.calibration);
        this.cylindermesh.rotation.y = this.currLoc.calibration
        //console.log("LoadTexture")
    }

    RenderPano() {
        //var direction = 2.54;
        var mainCam = useRef();
        var { gl, camera, canvas, scene } = useThree();
        (camera as any).fov = 40;
        gl.setSize(window.innerWidth, window.innerHeight)
        camera.position.set(0,0,0)
        camera.lookAt(0,0,0)
        
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
            //console.log(camera.rotation.y);
        }

        var camZoom = ()=> {
            //this.isUpdating=true;
            const depth = 12.5;
            const resFov = 100;
            var zoom = {
              zVal: (camera as any).position.z,
              xVal: (camera as any).position.x,
              fovValue: (camera as any).fov // from current zoom (no matter if it's more or less than 1)
            };
            var zoomEnd = {
              zVal: -depth *Math.cos(-camera.rotation.y),
              xVal: depth * Math.sin(-camera.rotation.y),
              fovValue: resFov
            };
            var tween = new TWEEN.Tween(zoom).to(zoomEnd, 500); // duration of tweening is 0.5 second

            tween.onUpdate(function() {
              (camera as any).position.z = zoom.zVal;
              (camera as any).position.x = zoom.xVal;
              (camera as any).fov = zoom.fovValue;
              (camera as any).updateProjectionMatrix();
            });
            tween.onComplete(()=>{
                (camera as any).position.z = 0;
                (camera as any).position.x = 0;
                (camera as any).fov = 40;
                (camera as any).updateProjectionMatrix();
                
                //this.cylindermaterial = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.DoubleSide });
                //this.cylindermesh = new THREE.Mesh(this.cylindergeometry, this.cylindermaterial);
                //this.cylindermesh.position.y = 2
                console.log(this.currLoc.calibration);
                this.cylindermaterial.map.needsUpdate = true;
                this.cylindermaterial.needsUpdate = true;
                this.texture.needsUpdate = true;
                this.cylindermesh.rotation.y = this.currLoc.calibration
                scene.add(this.cylindermesh);
                //camera.rotation.y = direction;
                //this.setState({filename:"pano-20190724143833-mx.png"});
                
            ;});
            tween.start();
        }
        /*
        const composer = new THREE.EffectComposer(renderer);

        var MotionBlur = () => {
            // render pass
            const renderPass = new THREE.RenderPass(scene, camera);

            const renderTargetParameters = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                stencilBuffer: false
            };

            // save pass
            const savePass = new THREE.SavePass(
                new THREE.WebGLRenderTarget(
                    container.clientWidth,
                    container.clientHeight,
                    renderTargetParameters
                )
            );

            // blend pass
            const blendPass = new THREE.ShaderPass(THREE.BlendShader, "tDiffuse1");
            blendPass.uniforms["tDiffuse2"].value = savePass.renderTarget.texture;
            blendPass.uniforms["mixRatio"].value = 0.8;

            // output pass
            const outputPass = new THREE.ShaderPass(THREE.CopyShader);
            outputPass.renderToScreen = true;

            // adding passes to composer
            composer.addPass(renderPass);
            composer.addPass(blendPass);
            composer.addPass(savePass);
            composer.addPass(outputPass);

        }*/
        console.log("Scene add cylinder")
        scene.add(this.cylindermesh);
        

        var updateTexture = async () => {
            //TODO: Implement parameter passing
            let id =  "20190724143833";
            this.currLoc = new Location(id);
            await this.currLoc.setAllAttr();
            console.log(this.currLoc.fname);
            this.texture = this.loader.load(process.env.PUBLIC_URL + 'resource/'+this.currLoc.fname, fLoad, undefined, err => {
                console.error(err)
            });
            function fLoad() {
                camZoom();
            }
            
        }
        
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
        scene.add( southline) 
        
        useRender(() => {
            TWEEN.update();
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
                    <mesh onClick={updateTexture} position={[0, -5.6, 0]} rotation={[-1.571, 0, 0]}
                        geometry={new THREE.CircleGeometry(20, 100, 0)}>
                        <meshBasicMaterial attach="material" color="grey" />
                    </mesh>
                </group>
            </>
        )
    }
    //TODO: change the pano window render size
    render() {
        
        if(this.state.isLoading){
            console.log("Loading...")
            return <div><h3>Loading...</h3></div>
        }
        return (
            <div className="Pano-canvas">
                <Canvas>
                    <this.RenderPano/>
                </Canvas>
            </div>
        )
    }
}

export default Pano;

