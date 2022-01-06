import {Container} from '@mui/material';
import {styled} from '@mui/system';
import React from 'react'
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

const Heading = styled('h1')({borderBottom: '1px dashed #000'});
const MainContent = styled('div')({padding: 20});
const Content = styled('div')({padding: 5});
// const MyWorkContent = styled('div')({padding: '1vh', paddingTop: '2vh', inlineSize: '68vh'});
// const PortfolioList = styled('PortfolioList')({marginTop: -10});
// const PortfolioLi = styled('PortfolioLi')({listStyleType: 'square', flex: '1 0 25%'});
const MyWorkTypo = styled(Typography)({fontFamily:'Source Code Pro'});

const Accordion = styled((props) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    fontFamily:'Source Code Pro',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
      borderBottom: '1px dashed #ccc',
    },
    '&:before': {
      display: 'none',
    },
  }));
  
  const AccordionSummary = styled((props) => (
    <MuiAccordionSummary
      expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
      {...props}
    />
  ))(({ theme }) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, .05)'
        : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1),
    },
  }));
  
  const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
  }));

export default function MyWork() {
    const [expanded, setExpanded] = React.useState('panel1');
  
    const handleChange = (panel) => (event, newExpanded) => {
      setExpanded(newExpanded ? panel : false);
    }
    return (
        <Container id="mywork">
            <Heading>[1]myWork</Heading>
            <MainContent>
                <Content>
                <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary aria-controls="panel1d-content" >
          <MyWorkTypo>Issue Tracking System using Spring Boot / Security and React / TypeScript. </MyWorkTypo>
        </AccordionSummary>
        <AccordionDetails>
          <MyWorkTypo>
            An issue tracking system using Spring Boot / Security for the back-end and React with TypeScript for the front end.<br /><br/>
            <div align="center"><a href="https://github.com/menezmethod/kiwibug_frontend" target="new">[View On GitHub]</a></div>
          </MyWorkTypo>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary aria-controls="panel2d-content" >
          <MyWorkTypo>Inventory System created developed using Java (Spring Boot) and React</MyWorkTypo>
        </AccordionSummary>
        <AccordionDetails>
          <MyWorkTypo>
            Inventory management system designed to replace spreadsheets. Works with Spring Boot for the back-end and React for the front-end. <br /><br/>
            <div align="center"><a href="https://github.com/menezmethod/inventoryreact" target="new">[View On GitHub]</a></div>
          </MyWorkTypo>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
        <AccordionSummary aria-controls="panel3d-content" id="panel3d-header">
          <MyWorkTypo>Multi time-zone Scheduling Application developed using Java and JavaFX</MyWorkTypo>
        </AccordionSummary>
        <AccordionDetails>
          <MyWorkTypo>
            A multi time-zone scheduling system developed using Java and JavaFX framework. Designed to work for multiple locations. <br /><br />
            <div align="center"><a href="https://github.com/menezmethod/JSScheduleLG_java" target="new">[View On GitHub]</a></div>
          </MyWorkTypo>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
        <AccordionSummary aria-controls="panel4d-content" id="panel4d-header">
          <MyWorkTypo>Mobile Semester Scheduling application developed using Java &amp; Android Studio</MyWorkTypo>
        </AccordionSummary>
        <AccordionDetails>
          <MyWorkTypo>
            Mobile application developed using Java and Android Studio. Students are able to schedule their classes for future semesters. <br/><br/>
            <div align="center"><a href="https://github.com/menezmethod/WGUSchedulerMobile" target="new">[View On GitHub]</a></div>
          </MyWorkTypo>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
        <AccordionSummary aria-controls="panel5d-content" id="panel5d-header">
          <MyWorkTypo>Student Roster developed using C++</MyWorkTypo>
        </AccordionSummary>
        <AccordionDetails>
          <MyWorkTypo>
A simple student roster coded with C++ <br /><br />
<div align="center"><a href="https://github.com/menezmethod/StudentRosterLG_CPP" target="new">[View On GitHub]</a></div>
          </MyWorkTypo>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel6'} onChange={handleChange('panel6')}>
        <AccordionSummary aria-controls="panel6d-content" id="panel6d-header">
          <MyWorkTypo>Gimenez.Dev Portfolio Website</MyWorkTypo>
        </AccordionSummary>
        <AccordionDetails>
          <MyWorkTypo>
This portfolio page created using React. <br /><br />
<div align="center"><a href="https://github.com/menezmethod/lgportfolio" target="new">[View On GitHub]</a></div>
          </MyWorkTypo>
        </AccordionDetails>
      </Accordion>
</Content>
            </MainContent>
        </Container>
    )
}