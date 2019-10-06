import React, { Component, useRef } from "react";
import ReactDOM from "react-dom";
import { Map, GoogleApiWrapper, Marker } from "google-maps-react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";

import api from "./api/index";

// I believe there is a bug of google-maps-react
// as it does not respect the custom style object you pass
// in. So we have to use important for now
// TODO:
// look for better map candidate
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
	console.log("zoom in")
	minimapElement.style.width = "250";
	minimapElement.style.height = "200";
}

function minimapZoomOut(e){
	e.preventDefault();
	minimapElement.style.width = "200";
	minimapElement.style.height = "100";
}

export interface Coordinate {
	id: string | number;
	lat: number;
	lng: number;
}
export interface MapContainerState {
	showComp: boolean;
	coords?: Coordinate[];
}

export interface MapContainerProps extends RouteComponentProps<{ lng?: string, lat?: string}> {}

class MapContainer extends Component<MapContainerProps, MapContainerState> {
	constructor(props) {
		super(props);
		this.state = {
			showComp: false
		};
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
		return (this.state as any).coords.map((coord, index) => {
			return (
				<Marker
					lid={coord.id}
					position={{
						lat: coord.lat,
						lng: coord.lng
					}}
					onClick={e => {
						this.showComponent(false);
						return this.gotoPano(e.lid);
					}}
					key={coord.id}
				/>
			);
		});
    }
    
	gotoPano(id) {
		// @ts-ignore
		this.props.history.push(`/viewPano/${id}`);
	}

	render() {
		const { showComp } = this.state;
		return showComp ? (
			<StyledMap
				ref={(this.props as any).onMapMounted}
				google={(this.props as any).google}
				zoom={16}
				//center={{ lat: this.props.match.params.lat, lng: this.props.match.params.lng }}
				initialCenter={{ lat: 42.4595, lng: -71.353 }}
				bounds={this.bounds}
				onReady={mapHandlerInit}
			>
				{this.addMarkers()}
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
