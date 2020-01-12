import React, { Component, useEffect, createRef } from "react";
import {
	Map,
	GoogleApiWrapper,
	IProvidedProps,
	GoogleAPI
} from "google-maps-react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
import MarkerClusterer, {
	MarkerClustererOptions
} from "@google/markerclustererplus";

import api from "@/api/index";
import { REGIONS } from "./constants";
import { parseNeighborhoodIntoRegion } from "./utils";

const StyledMap = styled(Map)`
	width: 100%;
	height: 100%;
	position: relative !important;
`;

const Container = styled.div<{ show: boolean }>`
	width: 100%;
	height: 100%;
	display: ${({ show = false }) => (show ? "block" : "none")};

	& > div {
		width: 100%;
		height: 100%;
	}
`;

export interface MapContainerState {
	coords?: Coordinate[];
}

export type MapContainerProps = RouteComponentProps<{
	region?: keyof typeof REGIONS;
}> &
	IProvidedProps & { zoom?: number };

export class MapContainer extends Component<
	MapContainerProps,
	MapContainerState
> {
	mapWrapper: React.RefObject<
		Map & { map: google.maps.MapOptions }
	> = createRef();
	showGSV = false;
	markerClusterer?: MarkerClusterer;

	static defaultProps = {
		zoom: 11
	};

	constructor(props: MapContainerProps) {
		super(props);
		this.state = {
			coords: []
		};
	}

	async componentDidMount() {
		const result = await api.getAllPanoIdAndCoord();
		const coords = [];
		const data = result.data.data;
		for (var i = 0; i < data.length; i++) {
			coords.push({
				id: data[i].id,
				lat: data[i].coord.lat,
				lng: data[i].coord.lng,
				region: parseNeighborhoodIntoRegion(data[i].neighborhood)
			});
		}
		this.setState({ coords });
	}

	componentDidUpdate(prevProps: MapContainerProps) {
		if (!this.mapWrapper.current) {
			return;
		}

		const prevloc = prevProps.location.pathname.split("/")[1];
		const currAction = this.props.history.action;

		//-----very specific logic here, please dont not change the order of the following instructions
		//-----the following logic handles the show/hide of google street view under different use cases and circumstances
		if (currAction === "PUSH" && prevloc === "viewPano") {
			//in the case when user is in ir pano view and wants to click on region-bar
			this.showGSV = false;
		}

		if (!this.showGSV) {
			//tells google to render/show google street view or not
			this.mapWrapper.current.map.streetView!.setVisible(false);
		}

		if (prevloc === "viewPano") {
			//in the case when user exits/backs from ir pano view
			this.showGSV = false;
		}
	}

	gotoPano(id: string, region: string) {
		if (!this.mapWrapper.current) {
			return;
		}
		if (this.mapWrapper.current.map.streetView!.visible) {
			this.showGSV = true;
		}
		this.props.history.push(`/maps/${region}`);
		this.props.history.push(`/viewPano/${id}`);
	}

	goBack() {
		console.log("go back");
		this.props.history.goBack();
	}

	get region() {
		return this.props.match ? this.props.match.params.region : "boston";
	}

	// put in utils
	addClusters = ({ map, google }: { map: any; google: GoogleAPI }) => {
		if (!map || !google) {
			return;
		}

		const { coords } = this.state;
		const markers = coords!.map(coord => {
			const marker: google.maps.Marker & {
				[key: string]: any;
			} = new google.maps.Marker({
				position: { lat: coord.lat, lng: coord.lng },
				map
			});

			marker.title = coord.id + "&" + coord.region;
			marker.customID = coord.id;
			marker.customRegion = coord.region;

			google.maps.event.addListener(marker, "click", () => {
				this.gotoPano(marker.customID, marker.customRegion);
			});

			return marker;
		});
		const options: MarkerClustererOptions = {
			styles: [
				{
					width: 53,
					height: 52,
					url: require("@/assets/mc.png"),
					textColor: "white"
				}
			],
			gridSize: 20,
			minimumClusterSize: 6
		};

		this.markerClusterer = new MarkerClusterer(map, markers, options);
	};

	render() {
		const { zoom, google } = this.props;

		if (this.mapWrapper.current && !this.markerClusterer) {
			this.addClusters({ map: this.mapWrapper.current.map, google });
		}

		return (
			<StyledMap
				ref={this.mapWrapper}
				google={google}
				zoom={zoom}
				center={this.region ? REGIONS[this.region] : REGIONS.center}
				initialCenter={REGIONS.center}
			/>
		);
	}
}

const EnhancedMap = GoogleApiWrapper({
	apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
})(MapContainer);

// google-maps-react is making an higher-order-component
// in a stupid way, as there is no way for us to change
// the container tag (always div), and the container does not
// accept className prop, which makes it hard for us to style
export default withRouter(props => {
	useEffect(() => {
		return () => {
			console.log("GMap...dying");
		};
	}, []);

	return (
		<Container show={!!props.match}>
			<EnhancedMap {...props} />
		</Container>
	);
});
