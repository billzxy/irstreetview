import React, {Component, useRef, useEffect} from 'react'
import ReactDOM from 'react-dom'
import {Map, GoogleApiWrapper, Marker} from 'google-maps-react'
import {withRouter, RouteComponentProps} from 'react-router-dom'
import styled from 'styled-components'
import api from './api/index'

const MarkerClusterer = require('node-js-marker-clusterer');

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

export interface MapContainerProps extends RouteComponentProps<{region?: string}> {}

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

  addMarkers(map, google) {
    const {coords} = this.state
    if (!coords) return

    return coords.map((coord, index) => {
      const marker = new google.maps.Marker({
        position: { lat: coord.lat, lng: coord.lng },
        map: map,
        title: coord.id
      })
      
      google.maps.event.addListener(marker, 'click', () => {
        this.gotoPano(marker.title);
      });

      return marker;
    })
  }

  gotoPano(id) {
    // @ts-ignore
    this.props.history.push(`/viewPano/${id}`)
    //console.log(this.props);
  }

  goBack(){
    // @ts-ignore
    this.props.history.goBack();
    console.log("go back");
  }

  get region() {
    return this.props.match ? this.props.match.params.region : 'boston'
  }

  Clusterer = ({map, google}) => {
    if(!map)
      return (null)
    //console.log(map);
    const mc = new MarkerClusterer(map, this.addMarkers(map, google), {
      styles: [{
        width: 53,
        height: 52,
        url: require('./assets/mc.png'),
        textColor: 'white',
      }],
      gridSize: 20,
      minimumClusterSize: 6
    });
    return (null);
  }

  render() {

    return (
      
      <StyledMap
        ref={(this.props as any).onMapMounted}
        google={(this.props as any).google}
        zoom={11}
        center={REGIONS[this.region]}
        initialCenter={REGIONS.center}
        bounds={this.bounds}
      >
        <this.Clusterer />
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
