import React, {Component, useEffect, useRef} from 'react'
import {observable, reaction, IReactionDisposer} from 'mobx'
import {observer} from 'mobx-react'
import PanoPageStore from './pageStore'

export interface CompassProps {
  panoPageStore: PanoPageStore
  //   onResetCamera: () => void
  //   cameraY: number
}

interface CompassState {
  rotation: number
}

/**
 * Right now we cannot accept cameraY as a props from pano because RenderPano is not a pure component
 * and changing cameraY in pano as a state will cause expensive rerendering
 */

// const compassBaseImg = require('@/assets/viewPano/compassBase.svg')
// const diamondImg = require('@/assets/viewPano/compassDiamond.svg')

// export const Compass = ({onResetCamera, cameraY}: CompassProps) => {
//   const calcCompassRotation = (cameraY: number) => {
//     var deg = Math.ceil((-cameraY * 180) / Math.PI)
//     if (deg < 0) {
//       deg = 360 + deg
//     }
//     return deg
//   }

//   console.log(cameraY)

//   const onClickDiamond = (e: React.MouseEvent) => {
//     e.preventDefault()
//     onResetCamera()
//   }

//   return (
//     <div>
//       <div id="compassBase">
//         <img src={compassBaseImg} alt="Compass" />
//       </div>
//       <div
//         id="compassDiamond"
//         style={{transform: `rotate(${calcCompassRotation(cameraY)}deg)`}}
//         onClick={onClickDiamond}
//       >
//         <img src={diamondImg} alt="Compass" />
//       </div>
//     </div>
//   )
// }

@observer
export default class Compass extends Component<CompassProps, CompassState> {
  constructor(props: CompassProps) {
    super(props)
    this.state = {
      rotation: 0
    }
  }

  compassRotationReactionDisposer?: IReactionDisposer
  cBaseSrc = require('../../assets/viewPano/compassBase.svg')
  cDiamondSrc = require('../../assets/viewPano/compassDiamond.svg')

  componentDidMount() {
    this.setCompassRotationReaction()
  }

  compassOnClick = (e: React.MouseEvent) => {
    e.preventDefault()
    this.props.panoPageStore.reset = true
  }

  setCompassRotationReaction() {
    this.compassRotationReactionDisposer = reaction(
      () => this.props.panoPageStore.cameraY,
      (cameraY, reaction) => {
        this.RotateCompass(cameraY)
      }
    )
  }

  RotateCompass = (cameraY: number) => {
    var deg = Math.ceil((-cameraY * 180) / Math.PI)
    if (deg < 0) {
      deg = 360 + deg
    }
    // document.getElementById("compassDiamond").style.transform = `rotate(${deg}deg)`;
    this.setState({
      rotation: deg
    })
  }

  render() {
    const {rotation} = this.state
    return (
      <div>
        <div id="compassBase">
          <img src={this.cBaseSrc} alt="Compass" />
        </div>
        <div
          id="compassDiamond"
          style={{transform: `rotate(${rotation}deg)`}}
          onClick={this.compassOnClick}
        >
          <img src={this.cDiamondSrc} alt="Compass" />
        </div>
      </div>
    )
  }
}
