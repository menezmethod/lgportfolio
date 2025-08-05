import {Container, Box} from '@mui/material';
import React from 'react';
import {styled} from '@mui/system';
import {orange} from '@mui/material/colors';
import { trackContactInteraction } from '../utils/analytics';

const Heading = styled('h1')({
    borderBottom: '1px dashed #000',
    marginBottom: '30px',
    paddingBottom: '10px'
});

const Content = styled('div')(({theme, align}) => ({
    padding: '20px',
    textAlign: align,
    lineHeight: 1.7,
    fontSize: '1.1rem',
    maxWidth: '800px',
    margin: '0 auto'
}));

const ValueProp = styled(Box)({
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: '25px',
    margin: '0 auto 30px auto',
    borderLeft: '4px solid #ff9800',
    fontSize: '1.15rem',
    fontWeight: 'bold',
    maxWidth: '800px',
    borderRadius: '0 8px 8px 0'
});

const ContactButton = styled('a')(({theme}) => ({
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'Source Code Pro, sans-serif',
    backgroundColor: orange[500],
    textDecoration: 'none',
    boxShadow: '2px 4px',
    padding: '15px 30px',
    borderRadius: 0,
    display: 'inline-block',
    transition: 'all 0.3s ease',
    fontSize: '1.1rem',
    '&:hover': {
        backgroundColor: orange[700],
        transform: 'translateY(-2px)',
        boxShadow: '4px 6px'
    },
    '@media (max-width: 768px)': {
        padding: '12px 24px',
        fontSize: '1rem'
    }
}));

export default function Contact() {
    return (
        <Container id="contact" maxWidth="lg">
            <Heading>[2]contact</Heading>
            <ValueProp>
                💡 Ready to deliver immediate impact: Payment systems architecture • Go/Java enterprise development • 
                GCP cloud solutions • Legacy modernization • Personal innovation in emerging technologies
            </ValueProp>
            <Content>
                I'm a proven payment systems engineer who delivers critical infrastructure solutions at enterprise scale. 
                At The Home Depot, I architect and maintain payment processing systems handling millions in daily transactions 
                using Go, Java, and Google Cloud Platform. I bring both deep expertise in enterprise payment systems and 
                passion for exploring cutting-edge technologies in my personal projects.
                <br/><br/>
                <strong>What I bring to your team:</strong>
                <br/>
                • <strong>Payment Systems Expertise:</strong> Enterprise-scale transaction processing and compliance
                <br/>
                • <strong>Cloud Architecture:</strong> GCP Professional Architect certified with hands-on experience
                <br/>
                • <strong>Legacy Modernization:</strong> Experience transitioning from legacy to modern architectures
                <br/>
                • <strong>Innovation Mindset:</strong> Personal projects exploring TypeScript, Rust, AI/ML, and emerging tech
                <br/><br/>
                Currently excelling at The Home Depot building critical payment infrastructure, but always open to 
                discussing exceptional opportunities in fintech, payment systems, or innovative technology companies.
            </Content>
            <Content align="center">
                <ContactButton 
                    href="mailto:luisgimenezdev@gmail.com"
                    onClick={() => trackContactInteraction('email_click')}
                >
                    Let's Discuss Payment Systems & Innovation
                </ContactButton>
            </Content>
        </Container>
    );
}
