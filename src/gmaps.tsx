import React, { useState, Component, useRef, useEffect } from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { compose, withProps, withState, withHandlers } from "recompose"
import { withScriptjs, withGoogleMap, GoogleMap, Marker,InfoWindow} from "react-google-maps"
import { observable, reaction } from "mobx";
import styled from 'styled-components'
import api from './api/index'
import { Header } from './components/layout'

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

export interface MapContainerProps extends RouteComponentProps<{ region?: string}> { }

const MapNavBar = (props) => {
  return (
    <Header className="navbar" onClick={ ()=>{ props.onClick({...REGIONS.boston}); }} >
      {props.children}
      <span>text</span>
    </Header>
  )
}

class GMapComponent extends React.PureComponent<MapContainerProps, MapContainerState> {
  state = {
    coords: []
  }
  constructor(props) {
    super(props)
  }

  nbref = React.createRef();
  ref = React.createRef();

  WMap = React.forwardRef((props, ref) => (
    <this.MyMapComponent ref={ref} >
      {props.children}
    </this.MyMapComponent>
  ));
  
  
  

  MyMapComponent = compose(
    withProps({
      googleMapURL: "https://maps.googleapis.com/maps/api/js?key=" + `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}` + "&v=3.exp&libraries=geometry,drawing,places",
      loadingElement: <div style={{ height: `100%` }} />,
      containerElement: <div style={{ height: `100%` }} />,
      mapElement: <div style={{ height: `100%` }} />,
    }),
    withState('zoom', 'onZoomChange', 11),
    withState('center', 'onCenterChange', 11),
    withHandlers((props,state) => {
      const refs = {
        map: undefined,
      }

      let z = REGIONS.center;

      return {
        onMapMounted: () => ref => {
          refs.map = ref
          this.ref = ref;
        },
        onZoomChanged: ({ onZoomChange }) => () => {
          //console.log(refs.map.getZoom());
          //onZoomChange(refs.map.getZoom())
          //props.setZoom(5);
          //console.log(props)
        },
        onCenterChanged: ({ onCenterChange }) => () => {
          //console.log(refs.map.getDiv());
          //onCenterChange(refs.map.getCenter())
          //refs.map.panTo({lat: 42.45955,
            //lng: -71.3525});
          
        }
      }
    }), withScriptjs,
    withGoogleMap
  )((props) => {
    const [center, setCenter] = useState(REGIONS.center);

    return (
    <GoogleMap
      //center={REGIONS[this.region]}
      defaultZoom={11}
      //defaultCenter={REGIONS.center}
      zoom={props.zoom}
      ref={props.onMapMounted}
      center={center}
      onZoomChanged={props.onZoomChanged}
      onCenterChanged={props.onCenterChanged}
    >
      <MapNavBar onClick={setCenter}/>
      <MarkerClusterer
        averageCenter

        gridSize={20}
        minimumClusterSize={6}
      >
        {this.addMarkers()}
      </MarkerClusterer>
    </GoogleMap>
    )
  }
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
    //
    //this.setBounds()
    //let map = new Map(this.refs.map,);
    //(this.props as any).google.maps.fitBounds(this.bounds);
    return coords.map((coord, index) => {
      console.log(coord);
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
    console.log(this.ref);
    return (
      <this.WMap />
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