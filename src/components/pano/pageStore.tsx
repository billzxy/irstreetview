import { observable } from "mobx";

const maxZoom = 2;

export default class PanoPageStore {
	@observable lng:number;
	@observable lat:number;
	//@observable bearing:number;
	@observable id:string;
	@observable pmanOffsetY:number;
	@observable cameraY:number;
    @observable reset:boolean;
	@observable zoom:number;
	@observable zoomLock:boolean;

	constructor(lat, lng, cameraY, id){
		this.lng = lng;
		this.lat = lat;
		//this.bearing = this.cameraYtoAbsRadian( cameraY );
		this.id = id;
		this.cameraY = cameraY;
		this.pmanOffsetY = this.setPegmanRotationOffsetYFromCameraY(cameraY);
		this.zoom = 0;
		this.zoomLock = false;
	}

	updateValues(lat, lng, cameraY, id){
		this.lng = lng;
		this.lat = lat;
		//this.bearing = this.cameraYtoAbsRadian( cameraY );
		this.id = id;
		this.cameraY = cameraY;
		this.pmanOffsetY = this.setPegmanRotationOffsetYFromCameraY(cameraY);
	}

	updatePegmanOffset(cameraY){
		this.cameraY = cameraY;
		this.pmanOffsetY = this.setPegmanRotationOffsetYFromCameraY(cameraY);
	}

	setPegmanRotationOffsetYFromCameraY(cameraY){
		var deg = Math.ceil(-cameraY*180/Math.PI);
		if(deg<0){
			deg = 360+deg;
		}
		return 9+Math.floor(deg/22.5)*60;
	}

	zoomIn(){
		if(this.zoomLock||this.zoom>=maxZoom){
			return ;
		}
		this.zoom++;
	}

	zoomOut(){
		if(this.zoomLock||this.zoom<=0){
			return ;
		}
		this.zoom--;
	}
} 