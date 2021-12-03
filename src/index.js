import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Header from './components/Header';
import About from './components/About';
import MyWork from './components/MyWork';
import Contact from './components/Contact';
import Footer from './components/Footer';
import {Container} from '@mui/material';
import MetaTags from 'react-meta-tags';

ReactDOM.render (
    <Container>
        <MetaTags>
            <title>Luis Gimenez - Software Developer</title>
            <meta name="description" content="Portfolio website for Luis Gimenez, developer based out of Denver, CO."/>
            <meta property="og:title" content="Luis Gimenez - Software Developer"/>
            <meta property="og:image" content="./assets/smthumb.png"/>
        </MetaTags>
        <div><Header/></div>
        <div><App/></div>
        <div><About/></div>
        <div><MyWork/></div>
        <div><Contact/></div>
        <div><Footer/></div>
    </Container>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
