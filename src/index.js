import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Header from './components/Header';
import About from './components/About';
import MyWork from './components/MyWork';
import Contact from './components/Contact';
import Footer from './components/Footer';
import {Container} from '@mui/material';


ReactDOM.render (
    <Container>
        <div><Header/></div>
        <div><App/></div>
        <div><About/></div>
        <div><MyWork/></div>
        <div><Contact/></div>
        <div><Footer/></div>
    </Container>,
    document.getElementById('root')
);
reportWebVitals();
