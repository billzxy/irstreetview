import React from 'react';
import styled from 'styled-components';

export const NAV_BAR_HEIGHT = 64;
export const NAV_BAR_PADDING = 12;

export const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
`

export const Header = styled.div`
    position: fixed;
    z-index: 999;
    top: 0;
    padding: ${NAV_BAR_PADDING}px;
    height: calc(${NAV_BAR_HEIGHT}px - ${NAV_BAR_PADDING}px * 2);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    background-color: #f8f8f8;
    width: 100%;

    & .ir-nav-item {
        margin-right: 1rem;
        text-decoration: none;
        color: rgba(0, 0, 0, 0.6)
    }

    & .ir-nav-item__active {
        color: #EA6C2F
    }
`

export const Content = styled.div`
    flex: 1;
    padding-top: ${NAV_BAR_HEIGHT}px;
`
