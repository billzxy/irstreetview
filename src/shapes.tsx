import * as THREE from "three"

class Cylinder{
    //Members
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    geometry: THREE.CylinderBufferGeometry;
    texture: THREE.Texture;
    loader: THREE.TextureLoader;

    constructor(){
        this.geometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true);
        this.texture = new THREE.Texture();
        this.loader = new THREE.TextureLoader();
        this.material = new THREE.MeshBasicMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
    
    LoadPanoTexture(fname:string, onComplete:Function){
        this.texture = this.loader.load(process.env.PUBLIC_URL + 'resource/'+fname, undefined, undefined, err => {
            console.error(err)
        });
    }
}

class Arrow{
    //Members
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    geometry: THREE.ConeBufferGeometry;
    id: string

    constructor(){
        this.geometry = new THREE.ConeBufferGeometry(0.2,1,16);
        this.material = new THREE.MeshBasicMaterial({color:"white"})
        this.mesh = new THREE.Mesh(this.geometry,this.material);
    }
    onClickHandler(){
        
    }

}

export{Arrow, Cylinder}

