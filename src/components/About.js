import {Container, Paper} from '@mui/material';
import {styled} from '@mui/system';
import React from 'react'
import MePic from '../assets/me.png'

const Heading = styled('h1')({borderBottom: '1px dashed #000'});
const MainContent = styled('div')({padding: 20});
const Content = styled('div')({padding: 5});
const AboutMe = styled('div')({padding: '1vh', paddingTop: '2vh', inlineSize: '68vh'});
const ProfilePic = styled(Paper)({
    margin: 0,
    float: 'right',
    clear: 'left',
    borderRadius: 0,
    padding: 6
});
const SkillList = styled('ul')({
    paddingLeft: '6vh',
    flexDirection: 'column',
    flexWrap: 'wrap',
    display: 'flex',
    height: '6vh'
});
const SkillLi = styled('li')({listStyleType: 'square', flex: '1 0 25%'});

export default function About() {
    return (
        <Container id="about">
            <Heading>[0]aboutMe</Heading>
            <MainContent>
                <Content>
                    <ProfilePic><img src={MePic}
                            alt="Luis Gimenez, Software Developer"/></ProfilePic>
                    <AboutMe>
                        Hi there! My name is Luis, and I enjoy creating content for the internet. My interest in web programming began when I was&nbsp;
                        <a href="https://web.archive.org/web/20010124075000/expage.com/dragonballn" targer="new">10 years old</a>
                        &nbsp;and created my first website. Fast forward to the present, and I've had the opportunity to learn new skills beyond HTML and CSS, and I'm now working with cutting-edge technologies. My main focus these days is on developing accessible, inclusive solutions and digital experiences for a diverse clientele. Here are a few technologies with which I've recently worked:
                        <br/>
                        <SkillList>
                            <SkillLi>Java</SkillLi>
                            <SkillLi>C++</SkillLi>
                            <SkillLi>C#</SkillLi>
                            <SkillLi>JavaScript</SkillLi>
                            <SkillLi>React</SkillLi>
                            <SkillLi>Node.js</SkillLi>
                            <SkillLi>Python</SkillLi>
                            <SkillLi>Angular</SkillLi>
                            <SkillLi>.NET</SkillLi>
                        </SkillList>
                    </AboutMe>
                </Content>
            </MainContent>
        </Container>
    )
}
