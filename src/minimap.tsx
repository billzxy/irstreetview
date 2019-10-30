import React, { Component } from "react";
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

var infoBoxElement;
var mapHandlerInit = () => {
	infoBoxElement = (document.getElementsByClassName('InfoBox') as HTMLCollectionOf<HTMLElement>)[0];
	infoBoxElement.addEventListener("mouseover", e => infoBoxHovered(e), false);
	infoBoxElement.addEventListener("mouseout", e => infoBoxUnhovered(e), false);
	infoBoxElement.addEventListener("mousedown", e => goBack(e), false);
}
function infoBoxHovered(e){
	e.preventDefault();
	infoBoxElement.style.opacity = "0.75";
}

function infoBoxUnhovered(e){
	e.preventDefault();
	infoBoxElement.style.opacity = "0.5";
}

function goBack(e) {
	e.preventDefault();
	window.history.back();
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
	//@observable bearing:number;
	@observable id:string;
	@observable pmanOffsetY:number;

	constructor(lat, lng, cameraY, id){
		this.lng = lng;
		this.lat = lat;
		//this.bearing = this.cameraYtoAbsRadian( cameraY );
		this.id = id;
		this.pmanOffsetY = this.setPegmanRotationOffsetYFromCameraY(cameraY);
	}

	updateValues(lat, lng, cameraY, id){
		this.lng = lng;
		this.lat = lat;
		//this.bearing = this.cameraYtoAbsRadian( cameraY );
		this.id = id;
		this.pmanOffsetY = this.setPegmanRotationOffsetYFromCameraY(cameraY);
	}

	updatePegmanOffset(cameraY){
		this.pmanOffsetY = this.setPegmanRotationOffsetYFromCameraY(cameraY);
	}

	setPegmanRotationOffsetYFromCameraY(cameraY){
		var deg = Math.ceil(-cameraY*180/Math.PI);
		if(deg<0){
			deg = 360+deg;
		}
		return 9+Math.floor(deg/22.5)*60;
	}
} 


@observer
class MapContainer extends Component<MapContainerProps, MapContainerState> {
	
	panoStore:PanoStore;
	mStore:MapStore;

	constructor(props) {
		super(props);
		this.state = {
			showComp: false,
			mapStore: (this.props as any).mapStore
		};
		this.mStore = (this.props as any).mapStore;
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

	dotIcon = {
		url: require(`./assets/pano_inside-2-medium.png`),
		size: new (this.props as any).google.maps.Size(11, 11),
		origin: new (this.props as any).google.maps.Point(0, 0),
		anchor: new (this.props as any).google.maps.Point(5.5, 5.5)
	};

	

	pman;

	addPegman() {
		var origin = new (this.props as any).google.maps.Point(8, 9);
		if(this.mStore.pmanOffsetY){
			origin = new (this.props as any).google.maps.Point(8, this.mStore.pmanOffsetY);
		}
		var pegIcon = {
			url: require(`./assets/rotating.png`),
			size: new (this.props as any).google.maps.Size(44, 49),
			origin: origin,
			anchor: new (this.props as any).google.maps.Point(22, 34)
		};
		this.pman = <Marker
			lid={this.mStore.id}
			position={{
				lat: this.mStore.lat,
				lng: this.mStore.lng
			}}
			icon={pegIcon}
			key={this.mStore.id}
		/>;
		return this.pman;
	}

	addMarkers() {
		this.setBounds();
		//let map = new Map(this.refs.map,);
		//(this.props as any).google.maps.fitBounds(this.bounds);
		var icon;
		var z = 0;
		return (this.state as any).coords.map((coord, index) => {
			if ((this.state as any).coords[index].id === this.mStore.id) {
				
			}else{
				icon = this.dotIcon;
				z++;
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
						icon={icon}
						key={coord.id}
						zIndex={z}
					/>
				);
			}
		})
	}

	renderCompass(){

	}
	

	gotoPano(id) {
		// @ts-ignore
		//this.props.history.push(`/viewPano/${id}`);
		//console.log("Update id: "+id);
		this.panoStore.id = id;
	}

	render() {
		const { showComp } = this.state;
		return showComp ? (
			<>
			<StyledMap
				ref={(this.props as any).onMapMounted}
				google={(this.props as any).google}
				zoom={17}
				center={{ lat: this.mStore.lat, lng: this.mStore.lng }}
				initialCenter={{ lat: this.mStore.lat, lng: this.mStore.lng }}
				bounds={this.bounds}
				onReady={mapHandlerInit}
				streetViewControl={false}
				fullscreenControl={false}
				mapTypeControl={false}
				rotateControl={false}
			>
				{this.addMarkers()}
				{this.addPegman()}
			</StyledMap>
			{this.renderCompass()}
			</>
		) : null;
	}
}

const Minimap = GoogleApiWrapper({
	apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
})(withRouter(MapContainer));


class InfoBox extends Component {
	constructor(props) {
		super(props);
	}

	backBox(){
		return(
			<div >
				<span> ← </span>
			</div>
		)
	}

	textBox(){
		return(
			<div>

			</div>
		)
	}

	render(){
		return(
			<this.backBox />
		)
	}


}

export default props => (
	<>
		<div className="Minimap">
			<Container>
				<Minimap {...props} />

			</Container>

		</div>
		<div className="InfoBox">
			<InfoBox />
		</div>
	</>
);
