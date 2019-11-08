import React from "react";
import styled from "styled-components";

export const NAV_BAR_HEIGHT = 0;
export const NAV_BAR_PADDING = 2;

export const Container = styled.div`
	width: 100vw;
	height: 100vh;
	display: flex;
	flex-direction: column;
`;

export const Header = styled.div`
	position: fixed;
	z-index: 999;
	top: 10px;
	right: 10px;
	padding: 12px;
	height: 20px;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	background-color: #f8f8f8;
    box-shadow: 2px 2px gray;
	cursor: pointer;
	& .ir-nav-item {
		margin-right: 0.5rem;
		margin-left: 0.5rem;
		text-decoration: none;
		color: rgba(0, 0, 0, 0.5);
	}

	& .ir-nav-item__active {
		color: #000000;
	}
`;

export const Content = styled.div`
	flex: 1;
	padding: 2px;
	padding-top: ${NAV_BAR_HEIGHT + 2}px;
`;
