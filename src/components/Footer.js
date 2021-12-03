import React from 'react'
import {styled} from '@mui/system';

const FooterTxt = styled('div')({fontSize:12, textDecoration:'none', textAlign:'center'});

export default function Footer() {
    return (
        <FooterTxt id="footer">
         <a href="http://github.com/menezmethod" target="new">Designed &amp; Built by Luis Gimenez</a>   
        </FooterTxt>
    )
}
