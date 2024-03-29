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


const Heading3 = styled("h3")(() => ({
    color: orange[500]
}));
const ExploreButton = styled("a")(({theme}) => ({
    fontFamily: ['Source Code Pro'],
    fontSize: 18,
    color: theme.palette.getContrastText(orange[500]),
    backgroundColor: orange[500],
    borderRadius: 0,
    padding: 12,
    textDecoration: 'none',
    boxShadow: '2px 4px',
    '&:hover': {
        backgroundColor: orange[700]
    }
}));

function App() {

    return (

        <div className="App">
            <header className="header">
                <Container maxWidth="md">
                    Hi, my name is
                    <h2 className="name_head">Luis Gimenez.</h2>
                    <Heading3>I build&nbsp;
                        <u>digital experiences</u>.</Heading3>
                    <span className="head_desc">I'm a software developer located in Orlando who focuses in creating (and occasionally designing) amazing applications for the web.</span><br/>
                    <br/>
                    <ExploreButton href="#mywork">explore my work</ExploreButton>
                </Container>
            </header>
            <div className="social_media">
                <ul className="small_list">
                    <li className="rotate_first_icons">
                        {"{"}</li>
                    <li>
                        <a href="mailto:luisgimenezdev@gmail.com"><img className="small_icons"
                                                                       src={EmailIcon}
                                                                       alt="Email"/></a>
                    </li>
                    <li>
                        <a href="https://github.com/menezmethod" target="new"><img class="small_icons"
                                                                                   src={GitIcon}
                                                                                   alt="GitHub"/></a>
                    </li>
                    <li>
                        <a href="https://twitter.com/menezmethod" target="new"><img class="small_icons"
                                                                                    src={TwitterIcon}
                                                                                    alt="Twitter"/></a>
                    </li>
                    <li>
                        <a href="https://www.instagram.com/menezmethod/" target="new"><img class="small_icons"
                                                                                           src={InstaIcon}
                                                                                           alt="Instagram"/></a>
                    </li>
                    <li>
                        <a href="https://www.linkedin.com/in/gimenezdev/" target="new"><img class="small_icons"
                                                                                            src={LinkedInIcon}
                                                                                            alt="LinkedIn"/></a>
                    </li>
                    <li className="rotate_second_icons">
                        {"}"}</li>
                </ul>
            </div>
        </div>

    );
}

export default App;
