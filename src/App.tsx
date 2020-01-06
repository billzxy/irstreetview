import React, { Component } from "react";
import {
	HashRouter as Router,
	Route,
	RouteComponentProps,
	NavLink,
	Redirect
} from "react-router-dom";
import { hot } from "react-hot-loader";

import { Container, Header, Content } from "./components/layout";
import GMap from "@/containers/map";
import Pano from "./containers/pano";
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
	state = {
		renderPano: true
	};

	render() {
		const { renderPano } = this.state;
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
								component={(props: RouteComponentProps) =>
									renderPano ? <Pano {...props} /> : null
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
