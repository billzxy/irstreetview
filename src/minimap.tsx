import React, { Component, useRef } from "react";
import ReactDOM from "react-dom";
import { Map, GoogleApiWrapper, Marker } from "google-maps-react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
import { observable } from "mobx";
import { observer } from "mobx-react";

import { PanoStore } from "./pano";
import api from "./api/index";

const StyledMap = styled(Map)`
	width: 100% !important;
	height: 100% !important;
	position: relative !important;
`;

const Container = styled.div`
	width: 100%;
	height: 100%;

	& > div {
		width: 100%;
		height: 100%;
	}
`;

var minimapElement;
var mapHandlerInit = () => {
	minimapElement = (document.getElementsByClassName('Minimap') as HTMLCollectionOf<HTMLElement>)[0];
	//console.log(minimapElement[0]);
	minimapElement.addEventListener("mouseover", e => minimapZoomIn(e), false);
	minimapElement.addEventListener("mouseout", e => minimapZoomOut(e), false);
}
function minimapZoomIn(e){
	e.preventDefault();
	minimapElement.style.width = "250px";
	minimapElement.style.height = "200px";
}

function minimapZoomOut(e){
	e.preventDefault();
	minimapElement.style.width = "200px";
	minimapElement.style.height = "100px";
}

export interface Coordinate {
	id: string | number;
	lat: number;
	lng: number;
}
export interface MapContainerState {
	showComp: boolean;
	coords?: Coordinate[];
	mapStore?: MapStore;
}

type center = {
	lng: string,
	lat: string,
	bearing: string
}

export interface MapContainerProps extends RouteComponentProps<{MapStore}> {}

export class MapStore {
	@observable lng:number;
	@observable lat:number;
	@observable bearing:number;
	@observable id:string;

	constructor(lat, lng, cameraY, id){
		this.lng = lng;
		this.lat = lat;
		this.bearing = this.cameraYtoAbsRadian( cameraY );
		this.id = id;
	}

	updateValues(lat, lng, cameraY, id){
		this.lng = lng;
		this.lat = lat;
		this.bearing = this.cameraYtoAbsRadian( cameraY );
		this.id = id;
	}

	cameraYtoAbsRadian(cameraY){
		return cameraY
	}
} 


@observer
class MapContainer extends Component<MapContainerProps, MapContainerState> {
	
	panoStore:PanoStore;

	constructor(props) {
		super(props);
		this.state = {
			showComp: false,
			mapStore: (this.props as any).mapStore
		};
		this.panoStore = (this.props as any).panoStore;
	}
	
	componentDidMount() {
		var getAllPanoCoords = async () => {
			await api.getAllPanoIdAndCoord().then(result => {
				var coordArr = [];
				let data = result.data.data;
				for (var i = 0; i < data.length; i++) {
					coordArr.push({
						id: data[i].id,
						lat: data[i].coord.lat,
						lng: data[i].coord.lng
					});
				}
				this.setState({
					coords: coordArr,
					showComp: true
				});
			});
		};
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
			this.bounds.extend(
				new (this.props as any).google.maps.LatLng({
					lat: coord.lat,
					lng: coord.lng
				})
			);
		}
	}

	addMarkers() {
		this.setBounds();
		//let map = new Map(this.refs.map,);
		//(this.props as any).google.maps.fitBounds(this.bounds);

		var dotImage = {
			url: require(`./assets/pano_inside-0-tiny.png`),
			size: new (this.props as any).google.maps.Size(9, 9),
			origin: new (this.props as any).google.maps.Point(0, 0),
			anchor: new (this.props as any).google.maps.Point(4.5, 4.5)
		};
		var image;
		return (this.state as any).coords.map((coord, index) => {
			if((this.state as any).coords[index].id===this.state.mapStore.id){
				image = {
					url: require(`./assets/rotating.png`),
					size: new (this.props as any).google.maps.Size(44, 49),
					origin: new (this.props as any).google.maps.Point(8, 9),
					anchor: new (this.props as any).google.maps.Point(22, 34)
				};
			}else{
				image = dotImage;
			}
			return (
				<Marker
					lid={coord.id}
					position={{
						lat: coord.lat,
						lng: coord.lng
					}}
					onClick={e => {
						return this.gotoPano(e.lid);
					}}
					icon={image}
					key={coord.id}
				/>
			);
		});
    }
	
	gotoPano(id) {
		// @ts-ignore
		//this.props.history.push(`/viewPano/${id}`);
		//console.log("Update id: "+id);
		this.panoStore.id = id;
	}

	render() {
		const { showComp, mapStore } = this.state;

		return showComp ? (
			<StyledMap
				ref={(this.props as any).onMapMounted}
				google={(this.props as any).google}
				zoom={16}
				center={{ lat: mapStore.lat, lng: mapStore.lng }}
				initialCenter={{ lat: mapStore.lat, lng: mapStore.lng}}
				bounds={this.bounds}
				onReady={mapHandlerInit}
				streetViewControl={false}
				fullscreenControl={false}
				mapTypeControl={false}
				rotateControl={false}
			>
		{ this.addMarkers() }
			</StyledMap>
		) : null;
	}
}

const Minimap = GoogleApiWrapper({
	apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
})(withRouter(MapContainer));

export default props => (
	<Container>
		<Minimap {...props} />
	</Container>
);
