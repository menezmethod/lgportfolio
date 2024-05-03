import {Container} from '@mui/material';
import React from 'react';
import {styled} from '@mui/system';
import {orange} from '@mui/material/colors';

const Heading = styled('h1')({
    borderBottom: '1px dashed #000',
});

const Content = styled('div')(({theme, align}) => ({
    padding: theme.spacing(2.5),
    textAlign: align,
}));

const ContactButton = styled('a')(({theme}) => ({
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'Source Code Pro, sans-serif',
    backgroundColor: orange[500],
    textDecoration: 'none',
    boxShadow: '2px 4px',
    padding: theme.spacing(1.5),
    borderRadius: 0,
    display: 'inline-block',
    '&:hover': {
        backgroundColor: orange[700]
    },
}));

export default function Contact() {
    return (
        <Container id="contact" maxWidth="md">
            <Heading>[2]contact</Heading>
            <Content>
                I am currently employed and enjoy my role; however, I remain open to discussing innovative projects and
                potential opportunities. Should you have any questions regarding my qualifications or need insights into
                my professional portfolio, please feel free to reach out. I am always eager to connect with industry
                professionals and explore collaborative possibilities. </Content>
            <Content align="center">
                <ContactButton href="mailto:luisgimenezdev@gmail.com">Get in Touch</ContactButton><br/><br/>
            </Content>
        </Container>
    );
}
