import * as React from 'react';
import {styled} from '@mui/system';
import {orange} from '@mui/material/colors';
import Resume from '../assets/Resume-Luis-Gimenez.pdf'

export default function Header() {
    const Header = styled('div')({padding: 20});
    const Logo = styled('div')({
        color: '#e97025',
        fontWeight: 1000,
        fontSize: 'calc(34px + 3vw)',
        position: 'absolute',
        padding: 8,
        ['@media (max-width:780px)']: {
            fontSize: 'calc(54px + 3vw)'

        }
    });
    const MainMenu = styled('div')({
        fontSize: 'calc(2px + 2vmin)',
        textAlign: 'right',
        wordSpacing: '1vh',
        padding: 24,
        marginTop: '2.5vh',
        ['@media (max-width:780px)']: { 
            fontSize: '2vmin)',
            marginBottom: '-10vh',
            paddingTop: '15vh'
        }
    });
    const ResumeButton = styled("a")(({theme}) => ({
        color: 'black',
        fontWeight: 1000,
        fontFamily: ['Source Code Pro'],
        backgroundColor: orange[500],
        '&:hover': {
            backgroundColor: orange[700]
        },
        padding: 8,
        borderRadius: 0,
        display: 'inline'
    }));

    return (
        <Header>
            <Logo>
                [LG]
            </Logo>
            <MainMenu>
                <a href="#about">[0]about_me</a>&nbsp;
                <a href="#mywork">[1]my_work</a>&nbsp;
                <a href="#contact">[2]contact</a>&nbsp;
                <ResumeButton href={Resume}>
                    [resume]
                </ResumeButton>
            </MainMenu>
        </Header>
    )
}
