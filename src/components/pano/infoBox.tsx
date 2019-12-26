import React from "react";
import styled from "styled-components";
import { withRouter, RouteComponentProps } from "react-router-dom";

const Container = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	background-color: rgba(34, 34, 34, 0.8);
	color: #ccc;
	padding: 8px;
	width: 220px;
	height: 90px;
`;

const BackContainer = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	flex: 0.2;
	margin-right: 6px;
	height: 100%;
	cursor: pointer;
`;

const InfoContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start;
	border-left: 1px solid #ccc;
	padding-left: 8px;
	flex: 1;
	height: 100%;
`;

const LocationContainer = styled.div`
	flex: 0.7;
	border-bottom: 1px solid #ccc;
	width: 100%;
`;

const DateContainer = styled.div`
	flex: 0.3;
	width: 100%;
`;

// var infoBoxElement;
// var mapHandlerInit = () => {
// 	infoBoxElement = (document.getElementsByClassName(
// 		"InfoBox"
// 	) as HTMLCollectionOf<HTMLElement>)[0];
// 	infoBoxElement.addEventListener("mouseover", e => infoBoxHovered(e), false);
// 	infoBoxElement.addEventListener("mouseout", e => infoBoxUnhovered(e), false);
// 	infoBoxElement.addEventListener("mousedown", e => goBack(e), false);
// };

// function infoBoxHovered(e) {
// 	e.preventDefault();
// 	infoBoxElement.style.opacity = "0.75";
// }

// function infoBoxUnhovered(e) {
// 	e.preventDefault();
// 	infoBoxElement.style.opacity = "0.5";
// }

// function goBack(e) {
// 	e.preventDefault();
// 	window.history.back();
// }

export interface InfoBoxProps extends RouteComponentProps {}

const InfoBox = ({ history, ...rest }: InfoBoxProps) => {
	return (
		<Container {...rest}>
			<BackContainer onClick={() => history.goBack()}>
				<span> ← </span>
			</BackContainer>

			<InfoContainer>
				<LocationContainer>Hello World</LocationContainer>
				<DateContainer>my friend</DateContainer>
			</InfoContainer>
		</Container>
	);
};

export default withRouter(InfoBox);
