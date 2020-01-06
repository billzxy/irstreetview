import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { observable, reaction } from "mobx";
import { observer } from "mobx-react";
import PanoPageStore from "./pageStore";
import { Button, ButtonGroup } from "reactstrap";

export interface PanoTypeControllerProps {
	panoPageStore: PanoPageStore;
}

@observer
export default class PanoTypeController extends Component<
	PanoTypeControllerProps
> {
	currPanoType = 0;

	changePanoTypeInStore = (type: number) => {
		if (this.props.panoPageStore.typeLock) return;
		this.props.panoPageStore.panoType = type;
		this.currPanoType = type;
	};

	mxOnClick = (e: React.MouseEvent) => {
		e.preventDefault();
		this.changePanoTypeInStore(0);
	};

	irOnClick = (e: React.MouseEvent) => {
		this.changePanoTypeInStore(1);
		e.preventDefault();
	};

	panoTypeSelectorElement = () => {
		return (
			<div className="typeSelector">
				<ButtonGroup className="buttons" size="lg">
					<Button onClick={this.mxOnClick}>Mixed</Button>
					<Button onClick={this.irOnClick}>Infrared</Button>
				</ButtonGroup>
			</div>
		);
	};

	render() {
		return <this.panoTypeSelectorElement />;
	}
}
