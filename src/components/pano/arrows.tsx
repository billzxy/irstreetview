import * as THREE from 'three'

export class Arrow {
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