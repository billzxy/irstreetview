import React, { Component, useEffect, useRef } from "react";
import { observable, reaction, IReactionDisposer } from "mobx";
import { observer } from "mobx-react";
import PanoPageStore from "./pageStore";

const maxZoom = 2;

export interface ZoomControllerProps {
	panoPageStore: PanoPageStore;
}

export interface ZoomControllerState {
	zoomerInOpacity: number;
	zoomerOutOpacity: number;
	[key: string]: any;
}
@observer
export default class ZoomController extends Component<
	ZoomControllerProps,
	ZoomControllerState
> {
	state = {
		zoomerInOpacity: 0.2,
		zoomerOutOpacity: 0.2
	};

	zoomerReactionDisposer?: IReactionDisposer;
	zBase = require("@/assets/viewPano/zoomerBase.svg");
	zPlus = require("@/assets/viewPano/zoomerPlus.svg");
	zMinus = require("@/assets/viewPano/zoomerMinus.svg");
	currZoomLevel = 0;

	zoomerInOnClick = (e: React.MouseEvent) => {
		e.preventDefault();
		this.props.panoPageStore.zoomIn();
	};

	zoomerOutOnClick = (e: React.MouseEvent) => {
		e.preventDefault();
		this.props.panoPageStore.zoomOut();
	};

	opacityChangeFactory = (
		key: "zoomerInOpacity" | "zoomerOutOpacity",
		value: number
	) => (e: React.MouseEvent) => {
		e.preventDefault();
		this.setState({ [key]: value });
	};

	render() {
		const { zoomerInOpacity, zoomerOutOpacity } = this.state;

		return (
			<div>
				<div id="zoomerBase">
					<img src={this.zBase} alt="Zoom Controller" />
					<div
						onMouseUp={this.zoomerInOnClick}
						onMouseOut={this.opacityChangeFactory("zoomerInOpacity", 0.2)}
						onMouseOver={this.opacityChangeFactory("zoomerInOpacity", 0.5)}
						style={{ opacity: zoomerInOpacity }}
					>
						<img src={this.zPlus} alt="Zoom In" />
					</div>
					<div
						onMouseUp={this.zoomerOutOnClick}
						onMouseOut={this.opacityChangeFactory("zoomerOutOpacity", 0.2)}
						onMouseOver={this.opacityChangeFactory("zoomerOutOpacity", 0.5)}
						style={{ opacity: zoomerOutOpacity }}
					>
						<img src={this.zMinus} alt="Zoom Out" />
					</div>
				</div>
			</div>
		);
	}
}
