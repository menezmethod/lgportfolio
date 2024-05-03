import {Container} from '@mui/material';
import {styled} from '@mui/system';
import React from 'react';
import MePic from '../assets/me.webp';

const Heading = styled('h1')({borderBottom: '1px dashed #000'});
const MainContent = styled('section')({padding: 2});
const Content = styled('div')({padding: 2});
const AboutMe = styled('div')({padding: '.5vh', paddingTop: '2vh'});
const MePict = styled('img')(({theme}) => ({
    margin: 12,
    float: 'right',
    borderRadius: 0,
    padding: 6,
    paddingBottom: 50,
    width: '100%',
    maxWidth: 300,
    [theme.breakpoints.down('md')]: {
        paddingBottom: 50,
        padding: '45px'
    }
}));
const SkillList = styled('ul')({
    paddingLeft: '40px',
    flexDirection: 'column',
    flexWrap: 'wrap',
    display: 'flex',
    height: '70px'
});
const SkillLi = styled('li')({listStyleType: 'square', flex: '1 0 25%'});

export default function About() {
    return (
        <Container id="about">
            <Heading>[0]aboutMe</Heading>
            <MainContent>
                <Content>
                    <MePict src={MePic} alt="Luis Gimenez, Software Developer"/>
                    <AboutMe>
                        Greetings! My name is Luis, and I am passionate about digital content creation. I began my
                        journey in web programming at the <a
                        href="https://web.archive.org/web/20010124075000/expage.com/dragonballn" target="_blank"
                        rel="noopener noreferrer">age of ten</a> when I developed my first website. Since then, I have
                        expanded my expertise beyond HTML and CSS to include a range of cutting-edge technologies.
                        Currently, my professional focus lies in crafting accessible and inclusive digital solutions
                        that cater to a diverse range of clients. <br/> <br/>
                        Below is a list of some of the advanced technologies I
                        have recently engaged with:
                        <SkillList>
                            <SkillLi>Go</SkillLi>
                            <SkillLi>Python</SkillLi>
                            <SkillLi>Java</SkillLi>
                            <SkillLi>Node.js</SkillLi>
                            <SkillLi>TypeScript</SkillLi>
                            <SkillLi>React</SkillLi>
                            <SkillLi>Google Cloud</SkillLi>
                            <SkillLi>GitHub Actions</SkillLi>
                            <SkillLi>Docker / K8S</SkillLi>
                        </SkillList>
                    </AboutMe>
                </Content>
            </MainContent>
        </Container>
    );
}
