import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
	HashRouter as Router,
	Route,
	Switch,
	NavLink,
	Redirect
} from "react-router-dom";

import { Container, Header, Content } from "./components/layout";
import GMap from "./maps";
import Pano from "./pano";
import "./style/App.css";

const routes = [
	{
		path: "/maps/boston",
		title: "Boston"
	},
	{
		path: "/maps/concord",
		title: "Concord"
	}
];

export class Interface extends Component {
	constructor(props){
        super(props)
        this.state = {
			renderPano: true
		};
        this.panoUnmount = this.panoUnmount.bind(this);
    }
    panoUnmount(){
        this.setState({renderPano: false});
    }

	render() {
		return (
			<Router>
				<Container>
					<Header>
						{routes.map(r => (
							<NavLink
								to={r.path}
								key={r.path}
								activeClassName="ir-nav-item__active"
								className="ir-nav-item"
							>
								{r.title}
							</NavLink>
						))}
					</Header>
					<Content>
						<Switch>
							<Route path="/maps/:region" render={(props) => <GMap {...props}/> } />
							<Route exact={true} path="/viewPano/:id" render={(props) => (this.state as any).renderPano ? <Pano {...props}/> : null } />
							<Route path="/viewPano" component={Pano} />
							<Redirect exact from="/" to="maps/concord" />
						</Switch>
					</Content>
				</Container>
			</Router>
		);
	}
};
