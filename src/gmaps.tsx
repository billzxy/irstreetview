import React, { Component, useRef, useEffect } from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { compose, withProps } from "recompose"
import { withScriptjs, withGoogleMap, GoogleMap, Marker} from "react-google-maps"
import { observable, reaction } from "mobx";
import styled from 'styled-components'
import api from './api/index'

const { MarkerClusterer } = require("react-google-maps/lib/components/addons/MarkerClusterer");

const StyledMap = styled(Map)`
  width: 100%;
  height: 100%;
  position: relative !important;
`

const Container = styled.div<{ show: boolean }>`
  width: 100%;
  height: 100%;
  display: ${({ show = false }) => (show ? 'block' : 'none')};

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
  },
  center: {
    lat: 42.4,
    lng: -71.2
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

export interface MapContainerProps extends RouteComponentProps<{ region?: string, goBack?}> { }

export class MapContainer extends Component<MapContainerProps, MapContainerState> {
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
    const { coords } = this.state
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
    const { coords } = this.state
    if (!coords) return

    this.setBounds()
    //let map = new Map(this.refs.map,);
    //(this.props as any).google.maps.fitBounds(this.bounds);
    return coords.map((coord, index) => {
      return (
        <Marker
          label={coord.id}
          position={{
            lat: coord.lat,
            lng: coord.lng
          }}
          onClick={e => {
            return this.gotoPano(e.label)
          }}
        />
      )
    })
  }

  gotoPano(id) {
    // @ts-ignore
    this.props.history.push(`/viewPano/${id}`)
    //console.log(this.props);
  }

  goBack() {
    // @ts-ignore
    this.props.history.goBack();
    console.log("go back");
  }

  get region() {
    return this.props.match ? this.props.match.params.region : 'boston'
  }

  render() {
    return (
      <StyledMap
        google={(this.props as any).google}
        zoom={18}
        center={REGIONS[this.region]}
        initialCenter={REGIONS[this.region]}
        bounds={this.bounds}
      >
        <MarkerClusterer
          averageCenter
          enableRetinaIcons
          gridSize={60}
        >
          {this.addMarkers()}
        </MarkerClusterer>
      </StyledMap>
    )
  }
}

/*
const EnhancedMap = GoogleApiWrapper({
  apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
  /* 
    Since we want to have a reference of MapContainer, so we need to pass the ref here.
  
})(props => <MapContainer {...props} ref={props.mapRef} />)
*/

class GMapComponent extends React.PureComponent<MapContainerProps, MapContainerState> {
  state = {
    coords: []
  }
  constructor(props) {
    super(props)
  }

  MyMapComponent = compose(
    withProps({
      googleMapURL: "https://maps.googleapis.com/maps/api/js?key=" + `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}` + "&v=3.exp&libraries=geometry,drawing,places",
      loadingElement: <div style={{ height: `100%` }} />,
      containerElement: <div style={{ height: `100%` }} />,
      mapElement: <div style={{ height: `100%` }} />,
    }),
    withScriptjs,
    withGoogleMap
  )((props) =>
    <GoogleMap
      //center={REGIONS[this.region]}
      defaultZoom={11}
      defaultCenter={REGIONS.center}
    >
       <MarkerClusterer
          averageCenter
          enableRetinaIcons
          gridSize={20}
          minimumClusterSize={6}
        >
          {this.addMarkers()}
        </MarkerClusterer>
    </GoogleMap>
  )

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

  addMarkers() {
    const { coords } = this.state
    if (!coords) return

    //this.setBounds()
    //let map = new Map(this.refs.map,);
    //(this.props as any).google.maps.fitBounds(this.bounds);
    return coords.map((coord, index) => {
      return (
        <Marker
          key={coord.id}
          position={{
            lat: coord.lat,
            lng: coord.lng
          }}
          onClick={() => {
            this.gotoPano(coord.id)
          }}
        />
      )
    })
  }

  get region() {
    console.log("get region:", this.props.match);
    //@ts-ignore
    return this.props.match ? this.props.match.params.region : 'boston'
  }


  gotoPano(id) {
    // @ts-ignore
    this.props.history.push(`/viewPano/${id}`);
  }

  render() {
    return (
      <this.MyMapComponent />
    )
  }
}

export class GMapStore {
  @observable region:string;

}

export default withRouter(props => {
  useEffect(() => {
    return () => {
      console.log('GMap...dying')
    }
  }, [])

  return (
    <Container show={!!props.match}>
      <GMapComponent {...props} />
    </Container>
  )
})