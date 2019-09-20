import React, { Component, useRef } from "react";
import ReactDOM from "react-dom"
import { Map, GoogleApiWrapper, Marker } from 'google-maps-react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import api from './api/index'

const mapStyles = {
    width: '60%',
    height: '60%',
    position: 'relative'
};

export interface Coordinate {
    id: string | number;
    lat: number;
    lng: number;
}
export interface MapContainerState {
    showComp: boolean;
    coords?: Coordinate[]
}

export interface MapContainerProps extends RouteComponentProps { }

class MapContainer extends Component<MapContainerProps, MapContainerState> {

    constructor(props) {
        super(props);
        this.state = {
            showComp: false
        }
    }

    componentDidMount() {
        var getAllPanoCoords = async () => {
            await api.getAllPanoIdAndCoord().then(result => {
                var coordArr = [];
                let data = result.data.data;
                for (var i = 0; i < data.length; i++) {
                    coordArr.push({ id: data[i].id, lat: data[i].coord.lat, lng: data[i].coord.lng });
                }
                //console.log(data);
                this.setState({
                    coords: coordArr,
                    showComp: true
                })
            })
        }
        getAllPanoCoords();
    }

    showComponent(i) {
        if (i !== true && i !== false) return;
        this.setState({ showComp: i });
    }

    bounds = new (this.props as any).google.maps.LatLngBounds();

    setBounds() {
        for (var i = 0; i < (this.state as any).coords.length; i++) {
            let coord = (this.state as any).coords[i];
            this.bounds.extend(new (this.props as any).google.maps.LatLng({ lat: coord.lat, lng: coord.lng }));
        }
    }

    addMarkers() {
        this.setBounds();

        //let map = new Map(this.refs.map,);
        //(this.props as any).google.maps.fitBounds(this.bounds);
        return (this.state as any).coords.map((coord, index) => {
            return <Marker
                lid={coord.id}
                position={{
                    lat: coord.lat,
                    lng: coord.lng
                }}
                onClick={(e) => {
                    this.showComponent(false);
                    return this.gotoPano(e.lid);

                }}
                key={coord.id}
            />
        })
    }
    //TODO: make a pano go back to map feature
    gotoPano(id) {
        // @ts-ignore
        this.props.history.push(`/viewPano/${id}`)
    }

    render() {
        const { showComp } = this.state
        return showComp ? (
            <Map
                ref={(this.props as any).onMapMounted}
                google={(this.props as any).google}
                zoom={17}
                style={mapStyles}
                initialCenter={{ lat: 42.36, lng: -71.053 }}
                bounds={this.bounds}
            >
                {this.addMarkers()}
            </Map>
        ) : null
    }
}
export default GoogleApiWrapper({
    apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
})(withRouter(MapContainer));