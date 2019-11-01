import * as THREE from 'three'

class Cylinder {
  //Members
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  geometry: THREE.CylinderBufferGeometry
  texture: THREE.Texture
  loader: THREE.TextureLoader

  constructor() {
    this.geometry = new THREE.CylinderBufferGeometry(20, 20, 15, 100, 1, true)
    this.texture = new THREE.Texture()
    this.loader = new THREE.TextureLoader()
    this.material = new THREE.MeshBasicMaterial()
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  LoadPanoTexture(fname: string, onComplete: Function) {
    this.texture = this.loader.load(
      process.env.PUBLIC_URL + 'resource/' + fname,
      undefined,
      undefined,
      err => {
        console.error(err)
      }
    )
  }
}

class Arrow {
  //Members
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  geometry
  id: string

  constructor() {
    this.geometry = new THREE.Geometry()
    this.geometry.vertices.push(
      new THREE.Vector3(0, 0, 0), // 0
      new THREE.Vector3(1.5, -2, 0), // 1
      new THREE.Vector3(1.5, -0.5, 0), // 2
      new THREE.Vector3(0, 1.5, 0), // 3
      new THREE.Vector3(-1.5, -0.5, 0), // 4
      new THREE.Vector3(-1.5, -2, 0) // 5
    )
    this.geometry.faces.push(
      new THREE.Face3(0, 1, 2),
      new THREE.Face3(0, 2, 3),
      new THREE.Face3(4, 0, 3),
      new THREE.Face3(5, 0, 4)
    )

    this.material = new THREE.MeshBasicMaterial({color: 'white'})
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }
  onClickHandler() {}
}

export {Arrow, Cylinder}
