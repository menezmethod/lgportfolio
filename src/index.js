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

function MainContainer() {
    return (
        <Container>
            <Header/>
            <main>
                <App/>
                <About/>
                <MyWork/>
                <Contact/>
            </main>
            <Footer/>
        </Container>
    );
}

ReactDOM.render(
    <React.StrictMode>
        <MainContainer/>
    </React.StrictMode>,
    document.getElementById('root')
);
