import * as React from 'react';
import {styled} from '@mui/system';
import {orange} from '@mui/material/colors';
import Resume from '../assets/Resume-Luis-Gimenez.pdf'

export default function Header() {
    const Header = styled('div')({padding: 20});
    const Logo = styled('div')({
        textDecoration: 'none',
        paddingBottom: '5vh',
        color: orange[500],
        fontWeight: 1000,
        fontSize: 'calc(30px + 2vw)',
        position: 'absolute',
        padding: 8,
        '@media (max-width:780px)': {
            fontSize: 'calc(32px + 3vw)',
            marginLeft: '-4px',
            '@media (max-width:500px)': {
                fontSize: 'calc(20px + 3vw)',
                marginLeft: '-4px',
                paddingTop: '18px'

            }
        }
    });
    const LogoPrint = styled('a')({textDecoration: 'none', color: orange[500]});

    const MainMenu = styled('div')({
        fontSize: 'calc(2px + 1vmin)',
        textAlign: 'right',
        wordSpacing: '1vh',
        padding: 24,
        marginTop: '12px',
        marginBottom: '-4vh',
        '@media (max-width:780px)': {
            wordSpacing: '1vh',
            fontSize: '1vmin)',
            marginBottom: '-6vh',
            marginRight: '-18px',
            '@media (max-width:500px)': {
                wordSpacing: '0',
                fontSize: '1vmin)',
                marginBottom: '-2vh',
                marginRight: '-18px'
            }
        }
    });
    const ResumeButton = styled("a")(() => ({
        color: 'black',
        fontWeight: 1000,
        fontFamily: ['Source Code Pro'],
        backgroundColor: orange[500],
        '&:hover': {
            backgroundColor: orange[700]
        },
        padding: 8,
        borderRadius: 0,
        boxShadow: '1px 2px',
        display: 'inline'
    }));

    return (
        <Header>
            <Logo>
                <LogoPrint href="https://gimenez.dev/">[LG]</LogoPrint>
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
