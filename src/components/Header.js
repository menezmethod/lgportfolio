import * as React from 'react';
import {styled} from '@mui/system';
import {orange} from '@mui/material/colors';

export default function Header() {
    const Header = styled('div')({padding: 20});
    const Logo = styled('div')({
        color: '#e97025',
        fontWeight: 1000,
        fontSize: 52,
        position: 'absolute',
        padding: 8
    });
    const MainMenu = styled('div')({textAlign: 'right', wordSpacing: 4, padding: 24});
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
                <ResumeButton href="assets/Resume-Luis-Gimenez.pdf">
                    [resume]
                </ResumeButton>
            </MainMenu>
        </Header>
    )
}
