import React from 'react'
import {Marker} from 'google-maps-react'

export interface PegmanProps {
  id: string
  lat: number
  lng: number
  pmanOffsetY: number
  google?: any
  map?: any
  mapCenter?: any
}

export const Pegman = ({id, lat, lng, pmanOffsetY, google, map, mapCenter}: PegmanProps) => {
  var origin = new google.maps.Point(8, 9)
  if (pmanOffsetY) {
    origin = new google.maps.Point(8, pmanOffsetY)
  }
  var pegIcon = {
    url: require(`../../assets/rotating.png`),
    size: new google.maps.Size(44, 49),
    origin: origin,
    anchor: new google.maps.Point(22, 34),
    custom: true
  }

  return (
    <Marker
      // @ts-ignore
      lid={id} // @ts-ignore
      position={{lat: lat, lng: lng}}
      icon={pegIcon}
      key={id}
      google={google}
      map={map}
      mapCenter={mapCenter}
      zIndex={100}
    />
  )
}
