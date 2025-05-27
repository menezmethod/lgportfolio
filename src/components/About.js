import {Container} from '@mui/material';
import {styled} from '@mui/system';
import React from 'react';
import MePic from '../assets/me.webp';

const Heading = styled('h1')({
    borderBottom: '1px dashed #000',
    marginBottom: '30px',
    paddingBottom: '10px'
});

const MainContent = styled('section')({
    padding: '20px 0'
});

const Content = styled('div')({
    padding: '0 20px',
    maxWidth: '1200px',
    margin: '0 auto'
});

const AboutMe = styled('div')({
    padding: '20px 0',
    textAlign: 'left',
    lineHeight: 1.7,
    fontSize: '1.1rem'
});

const MePict = styled('img')(({theme}) => ({
    margin: '0 0 20px 20px',
    float: 'right',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '300px',
    height: 'auto',
    [theme.breakpoints.down('md')]: {
        float: 'none',
        margin: '0 auto 30px auto',
        display: 'block',
        maxWidth: '250px'
    }
}));

const SkillList = styled('ul')({
    paddingLeft: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
    marginTop: '20px',
    '@media (max-width: 768px)': {
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '6px'
    }
});

const SkillLi = styled('li')({
    listStyleType: 'square',
    marginBottom: '8px',
    fontSize: '0.95rem'
});

export default function About() {
    return (
        <Container id="about" maxWidth="lg">
            <Heading>[0]aboutMe</Heading>
            <MainContent>
                <Content>
                    <MePict src={MePic} alt="Luis Gimenez, Software Developer"/>
                    <AboutMe>
                        I'm a results-driven Software Engineer II at The Home Depot, where I architect and maintain 
                        mission-critical payment processing infrastructures handling millions in daily transactions. 
                        My role focuses on both modernizing legacy payment systems and building new payment solutions 
                        using primarily Go and Java on Google Cloud Platform.
                        <br/><br/>
                        <strong>Professional Work @ Home Depot:</strong>
                        <br/>
                        • Leading payment system modernization initiatives using Go and Java
                        <br/>
                        • Architecting scalable solutions on Google Cloud Platform (GCP Professional Architect certified)
                        <br/>
                        • Maintaining and enhancing legacy payment processing systems
                        <br/>
                        • Working with enterprise-scale transaction volumes and compliance requirements
                        <br/>
                        • Currently working on GCP Professional Architect certification renewal
                        <br/><br/>
                        <strong>Personal Innovation Projects:</strong>
                        <br/>
                        In my personal time, I explore cutting-edge technologies and build innovative solutions. 
                        My latest project, <strong>Churnistic</strong>, demonstrates my passion for TypeScript, AI/ML 
                        integration, and modern web technologies. I also experiment with systems programming in Rust 
                        and explore emerging tech trends to stay ahead of the curve.
                        <br/><br/>
                        <strong>Core Technologies & Expertise:</strong>
                        <SkillList>
                            <SkillLi>Go (Production)</SkillLi>
                            <SkillLi>Java (Enterprise)</SkillLi>
                            <SkillLi>Google Cloud Platform</SkillLi>
                            <SkillLi>Payment Systems</SkillLi>
                            <SkillLi>TypeScript/JavaScript</SkillLi>
                            <SkillLi>React/Node.js</SkillLi>
                            <SkillLi>Rust (Personal)</SkillLi>
                            <SkillLi>Python (Personal)</SkillLi>
                            <SkillLi>Microservices</SkillLi>
                            <SkillLi>Docker/Kubernetes</SkillLi>
                            <SkillLi>CI/CD Pipelines</SkillLi>
                            <SkillLi>Spring Boot</SkillLi>
                            <SkillLi>System Architecture</SkillLi>
                            <SkillLi>Legacy Modernization</SkillLi>
                        </SkillList>
                    </AboutMe>
                </Content>
            </MainContent>
        </Container>
    );
}
