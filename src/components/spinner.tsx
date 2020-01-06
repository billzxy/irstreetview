import React from 'react'
import styled from 'styled-components'

export interface SpinnerProps {
  width?: number
  color?: string
}

const Rings = styled.div<SpinnerProps>`
  &,
  &:after {
    border-radius: 50%;
    width: ${({width}) => width}px;
    height: ${({width}) => width}px;
  }
  & {
    margin: 60px auto;
    font-size: 10px;
    position: relative;
    text-indent: -9999em;
    border-top: 1.1em solid rgba(0, 0, 0, 0.1);
    border-right: 1.1em solid rgba(0, 0, 0, 0.1);
    border-bottom: 1.1em solid rgba(0, 0, 0, 0.1);
    border-left: 1.1em solid ${({color}) => color};
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-animation: load8 1.1s infinite linear;
    animation: load8 1.1s infinite linear;
  }
  @-webkit-keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
`

Rings.defaultProps = {
  width: 48,
  color: '#ea6c2f'
}

export default Rings
