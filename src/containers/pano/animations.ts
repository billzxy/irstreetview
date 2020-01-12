import React, { Component, useRef, PureComponent } from "react";
import * as THREE from "three";
import { Canvas, useThree, useRender } from "react-three-fiber";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
//import SVGLoader from "three-svg-loader";
import { disableBodyScroll } from "body-scroll-lock";
import { observable, reaction, Reaction, IReactionDisposer } from "mobx";
import { Vector3 } from "three";
const TWEEN = require("@tweenjs/tween.js");


import InfoBox from "@/components/pano/infoBox";
import Minimap from "@/components/pano/minimap";
import PanoPageStore from "@/components/pano/pageStore";
import { Location } from "@/components/pano/location";
import { Arrow, Cylinder } from "@/components/pano/shapes";
import Spinner from "@/components/spinner";
import Compass from "@/components/pano/compass";
import ZoomController from "@/components/pano/zoomer";
import PanoTypeController from "@/components/pano/panotype";

import "./styles.css";

import * as Consts from "./constants";
import {Members, Flags, Locks, ThreeObjs} from "./members"

export class Animations {
    members:Members;
	flags:Flags;
	locks:Locks;
	threeObjs:ThreeObjs;

    constructor(members: Members, flags: Flags, locks: Locks, threeObjs: ThreeObjs){
        this.members = members;
		this.flags = flags;
		this.locks = locks;
		this.threeObjs = threeObjs;
    }
}