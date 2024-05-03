import React, {useState} from 'react';
import {
    Container,
    Typography,
    Accordion as MuiAccordion,
    AccordionSummary as MuiAccordionSummary,
    AccordionDetails as MuiAccordionDetails
} from '@mui/material';
import {styled} from '@mui/system';

const Heading = styled(Typography)({
    borderBottom: '1px dashed #000',
    fontSize: '1.5rem',
    fontFamily: 'Source Code Pro, sans-serif',
    fontWeight: 'bold'
});

const MainContent = styled('div')({
    padding: 20,
});

const MyWorkTypo = styled(Typography)({
    fontFamily: 'Source Code Pro',
});

const Accordion = styled(MuiAccordion)(({theme}) => ({
    fontFamily: 'Source Code Pro',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
        borderBottom: '1px dashed #ccc',
    },
    '&:before': {
        display: 'none',
    },
}));

const AccordionSummary = styled(MuiAccordionSummary)(({theme}) => ({
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

const AccordionDetails = styled(MuiAccordionDetails)(({theme}) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

const AccordionLink = styled('a')({
    textDecoration: 'none',
    '&:hover': {
        textDecoration: 'underline',
    },
    target: "_blank",
    rel: "noopener noreferrer"
});

const projects = [
    {
        title: "Rekordbox Control Client using Python",
        description: "The Rekordbox Link Client is a Python script that automates the selection of similar tracks in Rekordbox using OCR to read track information. It interacts directly with the Rekordbox database to find tracks based on BPM, key, and genre compatibility. The script enhances DJ performances by ensuring seamless track transitions.",
        clientLink: "https://github.com/menezmethod/rekordbox_link_client"
    },
    {
        title: "Trading Journal using React TypeScript and various gRPC microservices written in Go",
        description: "A Trading Journal written in React (TypeScript) for the front-end & Go for the back-end microservices.",
        clientLink: "https://github.com/menezmethod/st-client",
        serverLink: "https://github.com/menezmethod/st-server"
    },
    {
        title: "Issue Tracking System using Spring Boot / Security and React / TypeScript",
        description: "An issue tracking system using Spring Boot / Security for the back-end and React with TypeScript for the front end.",
        clientLink: "https://github.com/menezmethod/kiwibug_frontend"
    },
    {
        title: "Inventory System created developed using Java (Spring Boot) and React",
        description: "Inventory management system designed to replace spreadsheets. Works with Spring Boot for the back-end and React for the front-end.",
        clientLink: "https://github.com/menezmethod/inventoryreact"
    },
    {
        title: "Multi time-zone Scheduling Application developed using Java and JavaFX",
        description: "A multi time-zone scheduling system developed using Java and JavaFX framework. Designed to work for multiple locations.",
        clientLink: "https://github.com/menezmethod/JSScheduleLG_java"
    },
    {
        title: "Mobile Semester Scheduling application developed using Java & Android Studio",
        description: "Mobile application developed using Java and Android Studio. Students are able to schedule their classes for future semesters.",
        clientLink: "https://github.com/menezmethod/WGUSchedulerMobile"
    },
    {
        title: "Student Roster developed using C++",
        description: "A simple student roster coded with C++. Efficient and practical for academic use.",
        clientLink: "https://github.com/menezmethod/StudentRosterLG_CPP"
    },
    {
        title: "Gimenez.Dev Portfolio Website",
        description: "This portfolio page created using React. Showcases projects and skills in a modern and interactive design.",
        clientLink: "https://github.com/menezmethod/lgportfolio"
    }
];

export default function MyWork() {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (panel) => (event, newExpanded) => {
        setExpanded(newExpanded ? panel : false);
    };

    return (
        <Container id="mywork">
            <Heading variant="h1">[1] My Work</Heading>
            <MainContent>
                {projects.map((project, index) => (
                    <Accordion key={index} expanded={expanded === `panel${index}`}
                               onChange={handleChange(`panel${index}`)}>
                        <AccordionSummary aria-controls={`panel${index}d-content`} id={`panel${index}d-header`}>
                            <MyWorkTypo>{project.title}</MyWorkTypo>
                        </AccordionSummary>
                        <AccordionDetails>
                            <MyWorkTypo>
                                {project.description}
                                <br/><br/>
                                <div align="center">
                                    {project.clientLink && <AccordionLink href={project.clientLink} target="_blank"
                                                                          rel="noopener noreferrer">[View
                                        Client]</AccordionLink>}
                                    {project.serverLink && <AccordionLink href={project.serverLink} target="_blank"
                                                                          rel="noopener noreferrer"> | [View
                                        Server]</AccordionLink>}
                                </div>
                            </MyWorkTypo>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </MainContent>
        </Container>
    );
}
