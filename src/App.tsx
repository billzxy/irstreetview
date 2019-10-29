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
    this.mapElem = React.createRef<MapContainer>()
  }

  mapElem: React.RefObject<MapContainer>

  // TODO: Remove when you understand how ref works
  componentDidMount() {
    setTimeout(() => {
      console.log(this.mapElem.current)
      // Note that the methods of MapContainer class is stored in its prototype
      // So you need to check the __proto__ to see methods when you console log it
      // OR
      // You can log the target method directly such as this.mapElem.current.addMarkers
    }, 1000)
  }
  // End of removal

  panoUnmount() {
    this.setState({renderPano: false})
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
              {/* 
                Here we do not name the prop as ref, because if we put ref here, then the reference 
                is not the MapContainer class. Since GMap here is a wrapped component returned by
                withRouter. So we use a custom name (whatever you want) to store the ref function,
                and then we pass the ref function to our target component in maps.tsx
              */}
              <GMap mapRef={this.mapElem} />
              <Route
                path="/viewPano/:id"
                component={props => ((this.state as any).renderPano ? <Pano {...props} /> : null)}
              />
            </Route>
            <Redirect exact from="/" to="/maps/concord" />
          </Content>
        </Container>
      </Router>
    )
  }
}
