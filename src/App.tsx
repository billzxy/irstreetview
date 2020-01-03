import React, { Component, useRef } from "react";
import {
	HashRouter as Router,
	Route,
	Switch,
	NavLink,
	Redirect
} from "react-router-dom";
import { hot } from "react-hot-loader";

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

class Interface extends Component {
	constructor(props) {
		super(props);
		this.state = {
			renderPano: true
		};
	}

	gmapComponent;
	panoComponent;

	render() {
		return (
			<Router>
				<Container>
					{
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
					}
					<Content>
						<Route path="/maps/:region">
							<GMap />
							<Route
								path="/viewPano/:id"
								component={props =>
									(this.state as any).renderPano ? <Pano {...props} /> : null
								}
							/>
						</Route>
						<Redirect exact from="/" to="/maps/center" />
						<Redirect exact from="/maps" to="/maps/center" />
						<Redirect exact from="/maps/" to="/maps/center" />
					</Content>
				</Container>
			</Router>
		);
	}
}

export default hot(module)(Interface);
