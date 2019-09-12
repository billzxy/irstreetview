import * as geolib from 'geolib'
import api from './api/index'


class Location{
    //Members
    coord: { 
        lat: number,
        lng: number
    } = {lat:0,lng:0}
    calibration: number = 0.0;
    id: string;
    fname: string = "";

    //Methods
    constructor(id: string){
        this.id = id;
    }

    setAllAttr = async()=>{
        await api.getPanoAllAttrById(this.id).then(result =>{
            this.fname = result.data.data.filename; 
            this.coord.lat = result.data.data.coord.lat;
            this.coord.lng = result.data.data.coord.lng;
            this.calibration = result.data.data.calibration;
        })
    }

    getDistanceTo(loc: Location){
        return geolib.getDistance(this.coord,loc.coord);
    }

    getDistanceToNeighbors(neighbor:Location[]){
        return neighbor.map(this.getDistanceTo);
    }

    getBearingTo(loc: Location){
        return geolib.getRhumbLineBearing(this.coord, loc.coord);
    }

    getBearingToNeighbors(neighbor: Location[]){
        return neighbor.map(this.getBearingTo);
    }
}

export {Location}
