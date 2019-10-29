import React, {Component, useRef, useEffect} from 'react'
import ReactDOM from 'react-dom'
import {Map, GoogleApiWrapper, Marker, MarkerClusterer} from 'google-maps-react'
import {withRouter, RouteComponentProps} from 'react-router-dom'
import styled from 'styled-components'

import api from './api/index'

// I believe there is a bug of google-maps-react
// as it does not respect the custom style object you pass
// in. So we have to use important for now
// TODO:
// look for better map candidate
const StyledMap = styled(Map)`
  width: 100%;
  height: 100%;
  position: relative !important;
`

const Container = styled.div<{show: boolean}>`
  width: 100%;
  height: 100%;
  display: ${({show = false}) => (show ? 'block' : 'none')};

  & > div {
    width: 100%;
    height: 100%;
  }
`

const REGIONS = {
  boston: {
    lat: 42.36,
    lng: -71.053
  },
  concord: {
    lat: 42.45955,
    lng: -71.3525
  }
}

export interface Coordinate {
  id: string | number
  lat: number
  lng: number
}
export interface MapContainerState {
  coords?: Coordinate[]
}

export interface MapContainerProps extends RouteComponentProps<{region?: string}> {}

class MapContainer extends Component<MapContainerProps, MapContainerState> {
  constructor(props) {
    super(props)
    this.state = {
      coords: []
    }
  }

  componentDidMount() {
    var getAllPanoCoords = async () => {
      await api.getAllPanoIdAndCoord().then(result => {
        var coordArr = []
        let data = result.data.data
        for (var i = 0; i < data.length; i++) {
          coordArr.push({
            id: data[i].id,
            lat: data[i].coord.lat,
            lng: data[i].coord.lng
          })
        }
        this.setState({
          coords: coordArr
        })
      })
    }
    getAllPanoCoords()
  }

  bounds = new (this.props as any).google.maps.LatLngBounds()

  setBounds() {
    const {coords} = this.state
    if (!coords) return

    for (var i = 0; i < coords.length; i++) {
      let coord = coords[i]
      this.bounds.extend(
        new (this.props as any).google.maps.LatLng({
          lat: coord.lat,
          lng: coord.lng
        })
      )
    }
  }

  addMarkers() {
    const {coords} = this.state
    if (!coords) return

    this.setBounds()
    //let map = new Map(this.refs.map,);
    //(this.props as any).google.maps.fitBounds(this.bounds);
    return coords.map((coord, index) => {
      return (
        <Marker
          lid={coord.id}
          position={{
            lat: coord.lat,
            lng: coord.lng
          }}
          onClick={e => {
            return this.gotoPano(e.lid)
          }}
          key={coord.id}
        />
      )
    })
  }

  gotoPano(id) {
    // @ts-ignore
    this.props.history.push(`/viewPano/${id}`)
  }

  get region() {
    return this.props.match ? this.props.match.params.region : 'boston'
  }

  render() {
    return (
      <StyledMap
        ref={(this.props as any).onMapMounted}
        google={(this.props as any).google}
        zoom={18}
        center={REGIONS[this.region]}
        initialCenter={REGIONS[this.region]}
        bounds={this.bounds}
      >
        <MarkerClusterer
          averageCenter
          gridSize={60}
        >
         {this.addMarkers()}
        </MarkerClusterer>
        
      </StyledMap>
    )
  }
}

const EnhancedMap = GoogleApiWrapper({
  apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
})(MapContainer)

// google-maps-react is making an higher-order-component
// in a stupid way, as there is no way for us to change
// the container tag (always div), and the container does not
// accept className prop, which makes it hard for us to style
export default withRouter(props => {
  useEffect(() => {
    return () => {
      console.log('GMap...dying')
    }
  }, [])

  return (
    <Container show={!!props.match}>
      <EnhancedMap {...props} />
    </Container>
  )
})
