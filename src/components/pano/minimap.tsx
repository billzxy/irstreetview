import React, {Component, useEffect, useState} from 'react'
import {Map, GoogleApiWrapper, Marker} from 'google-maps-react'
import {withRouter, RouteComponentProps} from 'react-router-dom'
import styled from 'styled-components'
import {observable} from 'mobx'
import {observer} from 'mobx-react'
import PanoPageStore from './pageStore'
import {Pegman} from './pegman'

import api from '@/api'

const StyledMap = styled(Map)``

const Container = styled.div<{active: boolean}>`
  z-index: 1;
  position: absolute;
  width: ${({active}) => (active ? '250px' : '200px')};
  height: ${({active}) => (active ? '200px' : '100px')};
  left: 20px;
  bottom: 20px;
  border: 1px solid black;
  border-radius: 0px;
  transition: width 0.2s, height 0.2s;
`

export interface Coordinate {
  id: string | number
  lat: number
  lng: number
}

export interface MapContainerState {
  showComp: boolean
  coords?: Coordinate[]
}

type center = {
  lng: string
  lat: string
  bearing: string
}

export interface MapContainerProps extends RouteComponentProps {
  panoPageStore?: PanoPageStore
  onPanoIdChange: (lid: number) => void
}

@observer
class MapContainer extends Component<MapContainerProps, MapContainerState> {
  pStore?: PanoPageStore

  constructor(props: MapContainerProps) {
    super(props)
    this.state = {
      showComp: false
    }
    this.pStore = this.props.panoPageStore
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
          coords: coordArr,
          showComp: true
        })
      })
    }
    getAllPanoCoords()
  }

  showComponent(i) {
    if (i !== true && i !== false) return
    this.setState({showComp: i})
  }

  bounds = new (this.props as any).google.maps.LatLngBounds()

  setBounds() {
    for (var i = 0; i < (this.state as any).coords.length; i++) {
      let coord = (this.state as any).coords[i]
      this.bounds.extend(
        new (this.props as any).google.maps.LatLng({
          lat: coord.lat,
          lng: coord.lng
        })
      )
    }
  }

  dotIcon = {
    url: require(`../../assets/pano_inside-2-medium.png`),
    size: new (this.props as any).google.maps.Size(11, 11),
    origin: new (this.props as any).google.maps.Point(0, 0),
    anchor: new (this.props as any).google.maps.Point(5.5, 5.5)
  }

  addMarkers() {
    this.setBounds()
    //let map = new Map(this.refs.map,);
    //(this.props as any).google.maps.fitBounds(this.bounds);
    var icon
    var z = 1
    return (this.state as any).coords.map((coord, index) => {
      if ((this.state as any).coords[index].id === this.pStore.id) {
      } else {
        icon = this.dotIcon
        z++
        return (
          // @ts-ignore
          <Marker
            // @ts-ignore
            lid={coord.id}
            position={{
              lat: coord.lat,
              lng: coord.lng
            }}
            onClick={e => {
              // @ts-ignore
              return this.props.onPanoIdChange(e.lid)
            }}
            icon={icon}
            key={coord.id}
            zIndex={z}
          />
        )
      }
    })
  }

  // gotoPano(id) {
  // 	// @ts-ignore
  // 	//this.props.history.push(`/viewPano/${id}`);
  // 	//console.log("Update id: "+id);
  // 	this.pStore.id = id;
  // }

  render() {
    const {showComp} = this.state

    return showComp && this.pStore ? (
      <>
        <StyledMap
          ref={(this.props as any).onMapMounted}
          google={(this.props as any).google}
          zoom={17}
          center={{lat: this.pStore.lat, lng: this.pStore.lng}}
          initialCenter={{lat: this.pStore.lat, lng: this.pStore.lng}}
          bounds={this.bounds}
          // onReady={mapHandlerInit}
          streetViewControl={false}
          fullscreenControl={false}
          mapTypeControl={false}
          rotateControl={false}
        >
          <Pegman
            id={this.pStore.id}
            lat={this.pStore.lat}
            lng={this.pStore.lng}
            pmanOffsetY={this.pStore.pmanOffsetY}
          />
          {this.addMarkers()}
        </StyledMap>
      </>
    ) : null
  }
}

const Minimap = GoogleApiWrapper({
  apiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
})(withRouter(MapContainer))

// class InfoBox extends Component {
// 	constructor(props) {
// 		super(props);
// 	}

// 	backBox() {
// 		return (
// 			<div>
// 				<span> ← </span>
// 			</div>
// 		);
// 	}

// 	textBox() {
// 		return <div></div>;
// 	}

// 	render() {
// 		return <this.backBox />;
// 	}
// }

export default (props: MapContainerProps) => {
  const [active, setActive] = useState(false)
  return (
    <>
      <Container
        active={active}
        onMouseOver={() => setActive(true)}
        onMouseOut={() => setActive(false)}
      >
        <Minimap {...props} />
      </Container>
    </>
  )
}
