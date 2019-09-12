import React, { Component } from "react";
import ReactDOM from "react-dom"
import { Map, GoogleApiWrapper, Marker } from 'google-maps-react';
import Pano from './pano'
import api from './api/index'


const mapStyles = {
    width: '60%',
    height: '60%',
};

class MapContainer extends Component {
    //ett = {"latitude":42.36000888,"longitude":-71.05416259}
    //ffe = {"latitude":42.36000896,"longitude":-71.05425626}

    constructor(props) {
        super(props);
        //TODO: Make the coordinates dynamically acquired 
        this.state = {
            showComp: false
        }
        var getAllPanoCoords = async () => {
            await api.getAllPanoIdAndCoord().then(result =>{
                var coordArr = [];
                let data = result.data.data;
                for(var i = 0; i < data.length; i++){
                    coordArr.push( {id: data[i].id, lat: data[i].coord.lat, lng: data[i].coord.lng} );
                }
                //console.log(data);
                this.setState( {
                    coords: coordArr,
                    showComp: true
                })
            })
        }
        getAllPanoCoords();
    }

    showComponent(i){
        if(i!==true&&i!==false) return;
        this.setState({showComp:i});
    }

    bounds = new (this.props as any).google.maps.LatLngBounds();

    setBounds(){
        for (var i = 0; i < (this.state as any).coords.length; i++) {
            this.bounds.extend((this.state as any).coords[i]);
        }
    }

    addMarkers(){
        this.setBounds();

        return (this.state as any).coords.map((coord, index) => {
            return <Marker lid={coord.id}position={{
             lat: coord.lat,
             lng: coord.lng
           }}
           onClick={(e) => {
               //console.log("Click");
               this.showComponent(false);
               return this.gotoPano(e.lid);
                
            }} />
          })
    }
    //TODO: make a pano go back to map feature
    gotoPano(id){
        ReactDOM.render(<Pano lid={id} />, document.getElementById('panoWindow'));
    }
    

    render() {
        return (this.state as any).showComp ? (
            <Map
              google={(this.props as any ).google} //TODO: fix this TS/JS problem
              zoom={18}
              style={mapStyles}
              initialCenter={{ lat: 42.36, lng: -71.054}}
              bounds={this.bounds}
            >
                {this.addMarkers()}
            </Map>
        ) : null
    }
}
export default GoogleApiWrapper({
    apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
  })(MapContainer);