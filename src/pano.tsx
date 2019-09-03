import React, { Component, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from 'react-three-fiber'
import './style/pano.css'
import api from './api/index'
//import { EffectComposer } from './postprocessing/EffectComposer'

const TWEEN = require('@tweenjs/tween.js');

type PanoProps = {lid: number}
type PanoState = {lid: number, isLoading: boolean, filename: string}


class Pano extends Component<PanoProps, PanoState> {
    constructor(props){
        super(props);
        this.state = {
            lid: props.lid,
            isLoading: true,
            filename: undefined
        }
        this.getPanoFilename(this.props.lid);
        this.RenderPano = this.RenderPano.bind(this);
        //this.RenderComposite = this.RenderComposite.bind(this);
    }

    getPanoFilename = async (id) => {
        this.setState({ isLoading: true })
        await api.getPanoFileNameById(id).then(result =>{
            //console.log(result.data.filename);
            this.setState({
                filename: result.data.filename,
                isLoading: false
            })
        })
    }
    
    boxRef = React.createRef();
    isUpdating = false;
    //fname = this.state.filename;
    
    RenderPano() {
        var direction = 2.54;
        var mainCam = useRef();
        var { gl, camera, canvas, scene } = useThree();
        //console.log(camera);
        //camera = mainCam.current;
        //console.log(camera)
        //console.log(mainCam);
        (camera as any).fov = 40;
        gl.setSize(window.innerWidth, window.innerHeight)
        camera.position.set(0,0,0)
        camera.lookAt(0,0,0)
        camera.rotation.y = direction;
        
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
        
        var cylindergeometry = undefined;
        var cylindermaterial = undefined;
        var cylindermesh = undefined;
        var texture = undefined;
        

        var camZoom = ()=> {
            this.isUpdating=true;
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
                
                cylindermaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                cylindermesh = new THREE.Mesh(cylindergeometry, cylindermaterial);
                cylindermesh.position.y = 2
                scene.add(cylindermesh);
                camera.rotation.y = direction;
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
        
        //TODO: texture is wrongly attached inside out
        var loader = new THREE.TextureLoader();
        cylindergeometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);

        var loadTexture = (fname) => {
            texture = loader.load(process.env.PUBLIC_URL + 'resource/'+fname, ()=>{this.isUpdating=false}, undefined, err => {
                console.error(err)
            });
            //texture.needsUpdate = true;
            
            cylindermaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
            cylindermesh = new THREE.Mesh(cylindergeometry, cylindermaterial);
            cylindergeometry.scale(-1, 1, 1);
            cylindermesh.position.y = 2
            scene.add(cylindermesh);
        }
        loadTexture(this.state.filename);

        var updateTexture = () => {
            texture = loader.load(process.env.PUBLIC_URL + 'resource/pano-20190724143833-mx.png', fLoad, undefined, err => {
                console.error(err)
            });
            //texture.needsUpdate = true;
            function fLoad() {
                camZoom();
            }
            
        }
        

        useRender(() => {
            TWEEN.update();
            //console.log((camera as any).fov);
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
            {/*<mesh onClick={camZoom} position={[0,0,-5]}>
                <boxGeometry attach="geometry" ref={this.boxRef} />
                <meshBasicMaterial attach="material" color="white" />
            </mesh>*/}
            <mesh onClick={updateTexture} position={[0,-5.6,0]} rotation={[-1.571,0,0]} 
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

