import React from "react";
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
	},
	{
		path: "/viewPano",
		title: "View Pano"
	}
];

export const Interface: React.FC = () => {
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
						<Route path="/maps/:region" component={GMap} />}/>
						<Route exact={true} path="/viewPano/:id" component={Pano} />
						<Route path="/viewPano" component={Pano} />
						<Redirect exact from="/" to="maps/concord" />
					</Switch>
				</Content>
			</Container>
		</Router>
	);
};
