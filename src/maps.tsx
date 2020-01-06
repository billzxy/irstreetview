import React, {Component, useEffect} from 'react'
import {Map, GoogleApiWrapper, IProvidedProps, GoogleAPI} from 'google-maps-react'
import {withRouter, RouteComponentProps} from 'react-router-dom'
import styled from 'styled-components'
// const MarkerClusterer = require('node-js-marker-clusterer')
import MarkerClusterer from '@google/markerclustererplus'

import api from '@/api/index'
// import console = require('console');

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

const parseNeighborhoodIntoRegion = (neighborhood: string[] | string): string | null => {
  if (Array.isArray(neighborhood)) {
    return parseNeighborhoodIntoRegion(neighborhood[0])
  }
  switch (neighborhood) {
    case 'quincy':
      return 'boston'
    case 'atlave':
      return 'boston'
    case 'caa':
      return 'concord'
    case 'cab':
      return 'concord'
    case 'cdt':
      return 'concord'
  }
  return null
}

export interface MapContainerState {
  coords?: Coordinate[]
}

export type MapContainerProps = RouteComponentProps<{region?: string}> & IProvidedProps

export class MapContainer extends Component<MapContainerProps, MapContainerState> {
  map //ref to map instance
  showGSV = false
  isClustererRendered = false
  markerClusterer?: MarkerClusterer

  constructor(props: MapContainerProps) {
    super(props)
    this.state = {
      coords: []
    }
  }

  async componentDidMount() {
    const result = await api.getAllPanoIdAndCoord()
    const coords = []
    const data = result.data.data
    for (var i = 0; i < data.length; i++) {
      coords.push({
        id: data[i].id,
        lat: data[i].coord.lat,
        lng: data[i].coord.lng,
        region: parseNeighborhoodIntoRegion(data[i].neighborhood)
      })
    }
    this.setState({coords})
  }

  componentDidUpdate(prevProps) {
    if (!this.map) {
      return
    }
    const prevloc = prevProps.location.pathname.split('/')[1]
    const currAction = this.props.history.action

    //-----very specific logic here, please dont not change the order of the following instructions
    //-----the following logic handles the show/hide of google street view under different use cases and circumstances
    if (currAction === 'PUSH' && prevloc === 'viewPano') {
      //in the case when user is in ir pano view and wants to click on region-bar
      this.showGSV = false
    }

    if (!this.showGSV) {
      //tells google to render/show google street view or not
      this.map.streetView.setVisible(false)
    }

    if (prevloc === 'viewPano') {
      //in the case when user exits/backs from ir pano view
      this.showGSV = false
    }
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

  //   addMarkers(map, google) {
  //     const {coords} = this.state
  //     if (!coords) return
  //     //console.log(map);
  //     return coords.map((coord, index) => {
  //       const marker = new google.maps.Marker({
  //         position: {lat: coord.lat, lng: coord.lng},
  //         map: map,
  //         title: coord.id + '&' + coord.region
  //       })

  //       google.maps.event.addListener(marker, 'click', () => {
  //         this.gotoPano(marker.title)
  //       })

  //       return marker
  //     })
  //   }

  gotoPano(title: string) {
    const arr = title.split('&')
    const id = arr[0]
    const region = arr[1]
    if (this.map.streetView.visible) {
      this.showGSV = true
    }
    this.props.history.push(`/maps/${region}`)
    this.props.history.push(`/viewPano/${id}`)
  }

  goBack() {
    // @ts-ignore
    this.props.history.goBack()
    console.log('go back')
  }

  get region() {
    return this.props.match ? this.props.match.params.region : 'boston'
  }

  addClusters = ({map, google}: {map: any; google: GoogleAPI}) => {
    // if (this.isClustererRendered) return null
    if (!map) return null
    // if (this.state.coords.length === 0) return null

    console.log(google)
    const {coords} = this.state
    this.markerClusterer = new MarkerClusterer(
      map,
      coords!.map((coord, index) => {
        const marker = new google.maps.Marker({
          position: {lat: coord.lat, lng: coord.lng},
          map: map,
          title: coord.id + '&' + coord.region
        })

        google.maps.event.addListener(marker, 'click', () => {
          this.gotoPano(marker.title)
        })

        return marker
      }),
      {
        styles: [
          {
            width: 53,
            height: 52,
            url: require('./assets/mc.png'),
            textColor: 'white'
          }
        ],
        gridSize: 20,
        minimumClusterSize: 6
      }
    )
    // this.map = map
    // this.markerClusterer = new MarkerClusterer(map, this.addMarkers(map, google), {
    //   styles: [
    //     {
    //       width: 53,
    //       height: 52,
    //       url: require('./assets/mc.png'),
    //       textColor: 'white'
    //     }
    //   ],
    //   gridSize: 20,
    //   minimumClusterSize: 6
    // })
    // this.isClustererRendered = true
    // return null
  }

  render() {
    const {zoom, google} = this.props

    return (
      <StyledMap
        ref={(this.props as any).onMapMounted}
        google={(this.props as any).google}
        zoom={zoom}
        center={REGIONS[this.region]}
        initialCenter={REGIONS.center}
        bounds={this.bounds}
      >
        {this.addClusters({google, map: this.map})}
        {/* <this.Clusterer /> */}
      </StyledMap>
    )
  }
}

MapContainer.defaultProps = {
  zoom: 11
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
