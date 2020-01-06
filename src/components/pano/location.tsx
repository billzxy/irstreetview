import * as geolib from "geolib";
import api, { PanoData } from "@/api";

class Location {
	//Members
	coord: {
		lat: number;
		lng: number;
	} = { lat: 0, lng: 0 };
	calibration: number = 0.0;
	id: string;
	fname: string = "";
	neighborhood: string = "";
	neighborArr?: string[];
	// cameraY;
	types?: number[];

	//Methods
	constructor(id: string) {
		this.id = id;
	}

	setAllAttr = async () => {
		const result = await api.getPanoAllAttrById(this.id);
		const panoData = result.data.data as PanoData;
		if (!panoData) {
			return;
		}
		this.fname = panoData.filename;
		this.coord.lat = panoData.coord.lat;
		this.coord.lng = panoData.coord.lng;
		this.calibration = panoData.calibration;
		this.neighborhood = panoData.neighborhood;
		this.types = panoData.types;
	};

	getNeighborIds = async () => {
		await api.getNeighborsById(this.id, this.neighborhood).then(result => {
			this.neighborArr = result.data.data;
		});
	};

	getDistanceTo(loc: Location) {
		return geolib.getDistance(this.coord, loc.coord);
	}

	getDistanceToNeighbors(neighbor: Location[]) {
		return neighbor.map(this.getDistanceTo);
	}

	getBearingTo(loc: Location) {
		return geolib.getRhumbLineBearing(this.coord, loc.coord);
	}

	getBearingToNeighbors(neighbor: Location[]) {
		return neighbor.map(this.getBearingTo);
	}

	updateCalibration = async (camera: THREE.Camera) => {
		const payload = {
			calibration: -camera.rotation.y
		};
		//await api.updateCalibrationById(this.id,payload).then(res=>{
		alert("Update Calibration is disabled at this moment!");
		//})
	};
}

export { Location };
