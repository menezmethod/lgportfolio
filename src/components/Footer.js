import React from 'react';
import {styled} from '@mui/system';

const FooterLink = styled('a')({
    fontSize: 12,
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    color: 'inherit',
    '&:hover': {
        textDecoration: 'underline'
    }
});

export default function Footer() {
    return (
        <FooterLink href="http://github.com/menezmethod" target="_blank" rel="noopener noreferrer">
            Designed & Built by Luis Gimenez
        </FooterLink>
    );
}
