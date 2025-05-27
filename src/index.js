import React from 'react';
import { createRoot } from 'react-dom/client';
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

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <MainContainer/>
    </React.StrictMode>
);
