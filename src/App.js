import React from 'react';
import './App.css';
import Container from '@mui/material/Container';
import {styled} from '@mui/material/styles';
import {orange} from '@mui/material/colors';
import EmailIcon from './assets/email-1.svg'
import GitIcon from './assets/github-1.svg'
import InstaIcon from './assets/instagram-1.svg'
import LinkedInIcon from './assets/linkedin-3.svg'
import TwitterIcon from './assets/twitter-1.svg'


const ExploreButton = styled("a")(({theme}) => ({
    fontFamily: ['Source Code Pro'],
    fontSize: 18,
    color: theme.palette.getContrastText(orange[500]),
    backgroundColor: orange[500],
    borderRadius: 0,
    padding: 12,
    textDecoration: 'none',
    '&:hover': {
        backgroundColor: orange[700]
    }
}));
function App() {

    return (

        <div className="App">
            <header className="App-header">
                <Container maxWidth="md">
                    Hi, my name is
                    <h2 className="App-namehead">Luis Gimenez.</h2>
                    <h3 className="App-namehead2">I build&nbsp;
                        <u>digital experiences</u>.</h3>
                    <span className="App-head_desc">I'm a software developer located in Denver who focuses in creating (and occasionally designing) amazing applications for the web. Currently, I'm searching for exciting work opportunities with a forward-thinking organization.</span><br/>
                    <br/>
                    <ExploreButton href="#mywork">explore my work</ExploreButton>
                </Container>
            </header>
            <div className="App-social_media">
                <ul className="sm_ls">
                    <li className="rotsm1">
                        {"{"}</li>
                    <li>
                        <a href="mailto:luisgimenezdev@gmail.com"><img className="sm_ic"
                                src={EmailIcon}
                                alt="Email"/></a>
                    </li>
                    <li>
                        <a href="https://github.com/menezmethod" target="new"><img class="sm_ic"
                                src={GitIcon}
                                alt="GitHub"/></a>
                    </li>
                    <li>
                        <a href="https://twitter.com/menezmethod" target="new"><img class="sm_ic"
                                src={TwitterIcon}
                                alt="Twitter"/></a>
                    </li>
                    <li>
                        <a href="https://www.instagram.com/menezmethod/" target="new"><img class="sm_ic"
                                src={InstaIcon}
                                alt="Instagram"/></a>
                    </li>
                    <li>
                        <a href="https://www.linkedin.com/in/gimenezdev/" target="new"><img class="sm_ic"
                                src={LinkedInIcon}
                                alt="LinkedIn"/></a>
                    </li>
                    <li className="rotsm2">
                        {"}"}</li>
                </ul>
            </div>
        </div>

    );
}

export default App;
