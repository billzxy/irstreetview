import React, { Component, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import 'bootstrap/dist/css/bootstrap.min.css';
import { observable, reaction } from "mobx";
import { observer } from "mobx-react";
import PanoPageStore from "./pageStore"
import { Button, ButtonGroup } from 'reactstrap';


@observer
export default class PanoTypeController extends Component<{panoPageStore},{}>{

    constructor(props){
        super(props);
    }

    currPanoType = 0;
    
    changePanoTypeInStore = (type) =>{
        if(this.props.panoPageStore.typeLock)
            return ;
        this.props.panoPageStore.panoType = type;
        this.currPanoType = type;
    }

    mxOnClick = (e) => {
        e.preventDefault();
        this.changePanoTypeInStore(0);
    }

    irOnClick = (e) => {
        this.changePanoTypeInStore(1);
        e.preventDefault();
    }

    panoTypeSelectorElement = () => {
        return (
            <div className="typeSelector">
                <ButtonGroup className="buttons" size="lg">
                    <Button onClick={this.mxOnClick}>Mixed</Button>
                    <Button onClick={this.irOnClick}>Infrared</Button>
                </ButtonGroup>
            </div>
        );
    }

    render() {
        return (
            <> 
                <this.panoTypeSelectorElement /> 
            </>
        )
    }
}