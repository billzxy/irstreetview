import React, {Component, useRef} from 'react'
import ReactDOM from 'react-dom'
import {HashRouter as Router, Route, Switch, NavLink, Redirect} from 'react-router-dom'

import {Container, Header, Content} from './components/layout'
import GMap, {MapContainer} from './maps'
import Pano from './pano'
import './style/App.css'

const routes = [
  {
    path: '/maps/boston',
    title: 'Boston'
  },
  {
    path: '/maps/concord',
    title: 'Concord'
  }
]

export class Interface extends Component {
  constructor(props) {
    super(props)
    this.state = {
      renderPano: true
    }
    this.panoUnmount = this.panoUnmount.bind(this)
    //this.mapElem = React.createRef<MapContainer>()
  }

  gmapComponent;
  panoComponent;

  panoUnmount() {
    console.log(this);
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
            <Route path="/maps/:region">
              <GMap />
              <Route
                path="/viewPano/:id"
                component={props => ((this.state as any).renderPano ? <Pano {...props} goBack={() => this.panoUnmount()} /> : null)}
              />
            </Route>
            <Redirect exact from="/" to="/maps/concord" />
            <Redirect exact from="/maps" to="/maps/concord" />
          </Content>
        </Container>
      </Router>
    )
  }
}
