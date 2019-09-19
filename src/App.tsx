import React from 'react';
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Route, Switch, NavLink } from "react-router-dom";

import { Container, Header, Content } from './components/layout'
import GMap from './maps'
import Pano from './pano'
import './style/App.css';

const routes = [
  {
    path: '/maps',
    title: 'Pano Maps'
  },
  {
    path: '/viewPano/20190724151553',
    title: 'View Pano'
  },
]

export const Interface: React.FC = () => {
  return (
    <Router>
      <Container>
        <Header>
          {
            routes.map(r => <NavLink to={r.path} key={r.path} activeClassName='ir-nav-item__active' className="ir-nav-item">{r.title}</NavLink>)
          }
        </Header>
        <Content>
          <Switch>
            <Route path="/maps" component={GMap} />
            <Route path="/viewPano/:id" component={Pano} />
          </Switch>
        </Content>
      </Container>
    </Router>
  )
}


