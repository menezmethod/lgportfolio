import { Container } from '@mui/material'
import React from 'react'
import {styled} from '@mui/system';
import {orange} from '@mui/material/colors';


const Heading = styled('h1')({borderBottom: '1px dashed #000'});
const Content = styled('div')({padding: 20});
const ContactButton = styled("a")(({theme}) => ({
    color: 'black',
    fontWeight: 1000,
    fontFamily: ['Source Code Pro'],
    backgroundColor: orange[500],
    textDecoration:'none',
    '&:hover': {
        backgroundColor: orange[700]
    },
    padding: 12,
    borderRadius: 0,
    display: 'inline'
}));

export default function Contact() {
    return (
        <Container id="contact" maxWidth="md">
            <Heading id="contact">[2]contact</Heading>
            <Content>I'm currently looking for work as a full-stack developer. Please do not hesitate to contact me if you have any questions about additional credentials or the design of this website. Please contact me if you are a recruiter looking for a hardworking individual.</Content>
            <Content align="center"><ContactButton href="mailto:luisgimenezdev@gmail.com">get in touch</ContactButton><br /><br/></Content>
        </Container>
    )
}
