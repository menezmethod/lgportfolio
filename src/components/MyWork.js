import React, {useState, memo, useMemo} from 'react';
import {
    Container,
    Typography,
    Accordion as MuiAccordion,
    AccordionSummary as MuiAccordionSummary,
    AccordionDetails as MuiAccordionDetails,
    Chip,
    Box
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

const TechChip = styled(Chip)({
    margin: '2px',
    fontSize: '0.7rem',
    fontFamily: 'Source Code Pro',
});

const MetricsChip = styled(Chip)({
    margin: '2px',
    fontSize: '0.65rem',
    fontFamily: 'Source Code Pro',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
    fontWeight: 'bold',
});

const ProjectHighlight = styled(Box)({
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    border: '2px solid #ff9800',
    borderRadius: '4px',
    marginBottom: '8px',
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        right: '-2px',
        bottom: '-2px',
        background: 'linear-gradient(45deg, #ff9800, #ffc107, #ff9800)',
        borderRadius: '4px',
        zIndex: -1,
        opacity: 0.3,
        animation: 'pulse 2s ease-in-out infinite',
    },
    '@keyframes pulse': {
        '0%, 100%': {
            opacity: 0.3,
        },
        '50%': {
            opacity: 0.6,
        },
    },
    '& .MuiAccordion-root': {
        margin: 0,
        borderRadius: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    }
});

const projects = [
    {
        title: "🚀 Churnistic - AI-Powered Fintech Platform (Latest Project - 2024)",
        description: "Enterprise-grade credit card churning and banking optimization platform built with TypeScript (98.2% type coverage). Architected scalable microservices with AI/ML recommendation engine, real-time data analytics pipeline, and enterprise security compliance. Implemented comprehensive testing suite achieving 95% code coverage and automated deployment pipeline.",
        technologies: ["TypeScript", "React", "Node.js", "Firebase", "AI/ML", "Microservices", "CI/CD", "Testing"],
        clientLink: "https://github.com/menezmethod/churnistic",
        featured: true,
        metrics: "98.2% TypeScript coverage • 95% test coverage • AI/ML integration • Full CI/CD pipeline"
    },
    {
        title: "Trading Journal - React TypeScript + Go Microservices (Architecture Prototype)",
        description: "Comprehensive trading analytics platform built to explore modern microservices architecture. Developed React TypeScript frontend with Go gRPC microservices backend designed for real-time trade tracking and performance analytics. Implemented WebSocket connections, advanced charting components, and risk management algorithms as proof-of-concept. Project showcases full-stack development skills and modern architecture patterns.",
        technologies: ["React", "TypeScript", "Go", "gRPC", "WebSockets", "Microservices", "PostgreSQL"],
        clientLink: "https://github.com/menezmethod/st-client",
        serverLink: "https://github.com/menezmethod/st-server",
        metrics: "Microservices architecture • Real-time WebSockets • Full-stack prototype"
    },
    {
        title: "Enterprise Issue Tracking - Spring Boot + React",
        description: "Full-featured project management platform built with Spring Boot Security backend and React TypeScript frontend. Features role-based access control, real-time notifications, and comprehensive project management tools. Implemented OAuth2 integration and enterprise security patterns.",
        technologies: ["Spring Boot", "React", "TypeScript", "OAuth2", "Security", "Enterprise"],
        clientLink: "https://github.com/menezmethod/kiwibug_frontend",
        metrics: "OAuth2 authentication • Role-based access • Real-time notifications"
    },
    {
        title: "Smart Inventory Management - Full-Stack Solution",
        description: "Modern inventory management system designed to replace traditional spreadsheet workflows. Features predictive analytics for stock optimization, automated reordering workflows, and real-time dashboard with demand forecasting algorithms.",
        technologies: ["Java", "Spring Boot", "React", "Analytics", "Automation", "Forecasting"],
        clientLink: "https://github.com/menezmethod/inventoryreact",
        metrics: "Predictive analytics • Automated workflows • Full-stack development"
    },
    {
        title: "Go URL Shortener - High-Performance Service",
        description: "Production-ready URL shortening microservice built with Go, featuring Redis caching layer, horizontal scaling capabilities with Kubernetes, and comprehensive monitoring. Optimized for high concurrency and low-latency responses.",
        technologies: ["Go", "Redis", "Kubernetes", "Docker", "Monitoring", "Load Balancing"],
        clientLink: "https://github.com/menezmethod/go-url-shortener",
        metrics: "Redis caching • Kubernetes scaling • Concurrent request handling"
    },
    {
        title: "Enterprise Data Aggregation Platform - Python",
        description: "Scalable data processing pipeline for large-scale data ingestion from multiple sources. Built with Python, implementing ETL workflows, data validation, and real-time streaming capabilities. Optimized algorithms and parallel processing architecture.",
        technologies: ["Python", "Apache Kafka", "ETL", "Data Pipeline", "Performance Optimization"],
        private: true,
        metrics: "ETL workflows • Real-time streaming • Parallel processing"
    },
    {
        title: "Distributed Web Crawler - Python Microservice",
        description: "High-performance web crawling service with intelligent rate limiting and distributed architecture. Features ethical scraping practices, automatic retry logic, data quality validation, and horizontal scaling capabilities.",
        technologies: ["Python", "Distributed Systems", "Rate Limiting", "Data Quality", "Scaling"],
        private: true,
        metrics: "Distributed architecture • Ethical scraping • Rate limiting"
    },
    {
        title: "Rythmae - Music Management Desktop Application (Rust + Tauri)",
        description: "Powerful cross-platform music management application designed for DJs and music enthusiasts. Built with modern tech stack: Rust backend, Tauri desktop framework, and Next.js frontend. Features Serato integration for crate analysis, advanced music analysis (BPM, key detection), intelligent playlist creation, robust search functionality, and ID3 tag management. Demonstrates systems programming with Rust and modern desktop app development.",
        technologies: ["Rust", "Tauri", "Next.js", "SQLite", "Cross-Platform", "Desktop Development"],
        clientLink: "https://github.com/menezmethod/rythmae",
        metrics: "Cross-platform desktop app • Serato integration • Modern Rust/Tauri stack"
    },
    {
        title: "Rekordbox DJ Automation - Computer Vision",
        description: "Intelligent DJ software automation using OCR and computer vision to analyze track compatibility. Integrated with Rekordbox database for seamless track selection based on BPM, key harmony, and genre matching algorithms.",
        technologies: ["Python", "OCR", "Computer Vision", "Database Integration", "Automation"],
        clientLink: "https://github.com/menezmethod/rekordbox_link_client",
        metrics: "OCR integration • Computer vision • Database automation"
    },
    {
        title: "Quantum Drift - WebGL Game Engine",
        description: "3D game engine with custom physics simulation and real-time rendering pipeline. Built with modern JavaScript/WebGL, supporting particle systems, collision detection, and dynamic lighting. Demonstrates graphics programming and game development skills.",
        technologies: ["JavaScript", "WebGL", "Physics Engine", "3D Graphics", "Performance"],
        clientLink: "https://github.com/menezmethod/quantum-drift",
        metrics: "Custom physics engine • WebGL rendering • 3D graphics programming"
    }
];

const MyWork = memo(() => {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (panel) => (event, newExpanded) => {
        setExpanded(newExpanded ? panel : false);
    };

    const renderTechChips = useMemo(() => (technologies) => (
        <Box sx={{ mt: 1, mb: 1 }}>
            {technologies.map((tech, index) => (
                <TechChip key={index} label={tech} size="small" variant="outlined" />
            ))}
        </Box>
    ), []);

    const renderMetrics = useMemo(() => (metrics) => (
        <Box sx={{ mt: 1, mb: 1 }}>
            <MetricsChip label={`📊 ${metrics}`} size="small" variant="outlined" />
        </Box>
    ), []);

    const projectComponents = useMemo(() => 
        projects.map((project, index) => {
            const AccordionComponent = (
                <Accordion expanded={expanded === `panel${index}`}
                           onChange={handleChange(`panel${index}`)}>
                    <AccordionSummary aria-controls={`panel${index}d-content`} id={`panel${index}d-header`}>
                        <MyWorkTypo>{project.title}</MyWorkTypo>
                    </AccordionSummary>
                    <AccordionDetails>
                        <MyWorkTypo>
                            {project.description}
                            {project.technologies && renderTechChips(project.technologies)}
                            {project.metrics && renderMetrics(project.metrics)}
                            <br/>
                            <div align="center">
                                {project.private ? (
                                    <MyWorkTypo style={{ fontStyle: 'italic', color: '#666' }}>
                                        [Private Repository]
                                    </MyWorkTypo>
                                ) : (
                                    <>
                                        {project.clientLink && <AccordionLink href={project.clientLink} target="_blank"
                                                                              rel="noopener noreferrer">[View
                                            {project.serverLink ? ' Client' : ' Project'}]</AccordionLink>}
                                        {project.serverLink && <AccordionLink href={project.serverLink} target="_blank"
                                                                              rel="noopener noreferrer"> | [View
                                            Server]</AccordionLink>}
                                    </>
                                )}
                            </div>
                        </MyWorkTypo>
                    </AccordionDetails>
                </Accordion>
            );

            return (
                <div key={index}>
                    {project.featured ? (
                        <ProjectHighlight>
                            {AccordionComponent}
                        </ProjectHighlight>
                    ) : (
                        AccordionComponent
                    )}
                </div>
            );
        }), [expanded, renderTechChips, renderMetrics]);

    return (
        <Container id="mywork">
            <Heading variant="h1">[1] My Work</Heading>
            <MainContent>
                {projectComponents}
            </MainContent>
        </Container>
    );
});

MyWork.displayName = 'MyWork';

export default MyWork;
