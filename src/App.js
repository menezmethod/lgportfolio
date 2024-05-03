import React from 'react';
import './App.css';
import Container from '@mui/material/Container';
import {styled, useTheme} from '@mui/material/styles';
import {orange} from '@mui/material/colors';
import EmailIcon from './assets/email-1.svg';
import GitIcon from './assets/github-1.svg';
import InstaIcon from './assets/instagram-1.svg';
import LinkedInIcon from './assets/linkedin-3.svg';
import TwitterIcon from './assets/twitter-1.svg';

const Heading3 = styled("h3")(() => ({
    color: orange[500]
}));

const ExploreButton = styled("a")(({theme}) => ({
    fontFamily: 'Source Code Pro',
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

const SocialMediaIcon = styled("img")({
    width: 30, // Assuming a fixed width for all icons
    height: 30, // Assuming a fixed height for all icons
});

const socialLinks = [
    {url: "mailto:luisgimenezdev@gmail.com", icon: EmailIcon, alt: "Email"},
    {url: "https://github.com/menezmethod", icon: GitIcon, alt: "GitHub"},
    {url: "https://twitter.com/menezmethod", icon: TwitterIcon, alt: "Twitter"},
    {url: "https://www.instagram.com/menezmethod/", icon: InstaIcon, alt: "Instagram"},
    {url: "https://www.linkedin.com/in/gimenezdev/", icon: LinkedInIcon, alt: "LinkedIn"}
];

function App() {
    useTheme();
    return (
        <div className="App">
            <header className="header">
                <Container maxWidth="md">
                    Hi, my name is
                    <h2 className="name_head">Luis Gimenez.</h2>
                    <Heading3>I build <u>digital experiences</u>.</Heading3>
                    <span className="head_desc">I'm a software developer located in Orlando who focuses in creating (and occasionally designing) amazing applications for the web.</span><br/>
                    <ExploreButton href="#mywork">explore my work</ExploreButton>
                </Container>
            </header>
            <div className="social_media">
                <ul className="small_list">
                    {socialLinks.map(link => (
                        <li key={link.alt}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                <SocialMediaIcon src={link.icon} alt={link.alt}/>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App;
