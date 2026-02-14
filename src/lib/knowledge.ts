export const KNOWLEDGE_BASE = `
# Professional Profile
Luis Gimenez is a Software Engineer II at The Home Depot in Atlanta, GA. He specializes in high-throughput payment systems, distributed architectures, and performance optimization.

## Core Competencies
- **Languages**: Go, Java, TypeScript, JavaScript, Python, C#, C++.
- **Databases**: CockroachDB, PostgreSQL, MongoDB.
- **Tools & Cloud**: Docker, Git, Google Cloud Platform (GCP Professional Architect), Spring Boot, React, Angular, GraphQL.
- **Testing & Monitoring**: Ginkgo, Gomega, JUnit, Cypress, Prometheus, Grafana, Jaeger.
- **Methodologies**: Agile/Scrum, SDLC, TDD, ITIL.

## Experience

### Software Engineer II - The Home Depot (April 2022 – Present)
- Engineer on the payment card tender system processing **5+ million daily transactions**.
- Integrated advanced monitoring tools (Prometheus/Grafana/Jaeger), achieving a **20% reduction in system latency**.
- Focuses on high-availability distributed systems and backend microservices.

### Web Developer - Menez Enterprises (Sept 2015 - April 2022)
- Built cross-device accessible web applications with load times **27% faster** than industry average.
- Improved operational efficiency by 25% through rigorous bug testing and documentation.
- Developed a custom client dashboard that reduced support tickets by **30%**.
- Collaborated with UI/UX teams to increase conversion rates by **20%**.

## Education
- **Bachelor of Science in Software Development** - Western Governors University (2020 - 2021)

## Certifications
- **GCP Professional Cloud Architect**
- **CompTIA Project+**
- **ITIL® Foundation Certificate in IT Service Management**
- **CIW User Interface Designer**

## Projects

### Stock Trading Journal (Real-Time Analytics)
- **Tech Stack**: Go (Backend Microservices), React (Frontend).
- **Description**: A scalable trading journal application featuring real-time data processing.
- **Links**: [Client](https://github.com/menezmethod/st-client), [Server](https://github.com/menezmethod/st-server)

### KiwiBug (Issue Tracking System)
- **Tech Stack**: Spring Boot (Java), React.
- **Description**: Full-stack issue tracking system with robust ticket management.
- **Links**: [Client](https://github.com/menezmethod/kiwibug_frontend), [Server](https://github.com/menezmethod/KiwiBugBack)

### Inventory Management System
- **Tech Stack**: Spring Boot, React.
- **Link**: [GitHub](https://github.com/menezmethod/inventorysystemreact)

### Multi-Timezone Scheduler
- **Tech Stack**: Java, JavaFX.
- **Link**: [GitHub](https://github.com/menezmethod/JSScheduleLG_java)

### Student Roster
- **Tech Stack**: C++.
- **Link**: [GitHub](https://github.com/menezmethod/StudentRosterLG_CPP)

### Mobile Semester Scheduler
- **Tech Stack**: Java, Android Studio.
- **Link**: [GitHub](https://github.com/menezmethod/WGUSchedulerMobile)

## Contact
- **Email**: luisgimenezdev@gmail.com
- **Phone**: 407-520-4100
- **Location**: Orlando, FL
- **GitHub**: github.com/menezmethod
- **LinkedIn**: linkedin.com/in/gimenezdev
- **Portfolio**: gimenez.dev

## Behavioral Interview Answers (STAR Method)
Use these examples when answering behavioral questions to demonstrate FAANG-level engineering maturity.

### 1. Challenge: Scaling under Pressure (The "Scalability" Question)
**Context:** At The Home Depot, our payment processing system needed to handle peak Black Friday traffic without latency degradation.
**Action:** I architected a distributed buffering system using Pub/Sub and Cloud Run. I implemented a pattern where transaction ingestion was decoupled from processing, allowing us to absorb massive spikes (100x normal load) without dropping requests.
**Result:** The system handled millions of transactions with zero downtime and <50ms latency at p99. This architecture is now the standard for our high-throughput services.

### 2. Challenge: Technical Disagreement (The "Conflict" Question)
**Context:** A senior engineer proposed a monolithic Java service for a new payment gateway, citing simplicity. I argued for a Go-based microservice architecture due to the need for high concurrency and lower cold-start times in a serverless environment.
**Action:** Instead of arguing theoretically, I built a rapid prototype benchmark. I demonstrated that the Go service handled 3x the concurrent requests with 1/10th the memory footprint and 500ms faster cold starts.
**Result:** The data won the argument. We adopted the Go microservice approach, saving the company estimated thousands in monthly cloud compute costs and improving customer checkout speed.

### 3. Challenge: Handling Failure (The "Post-Mortem" Question)
**Context:** A production deployment introduced a rigorous race condition that caused duplicate transaction logs in our auditing service.
**Action:** I immediately led the rollback to stabilize the system. Then, I didn't just fix the bug; I implemented a "uniqueness capability" check using Redis SetNX to prevent concurrent writes at the application layer, and added a database constraint as a final safety net.
**Result:** We eliminated duplicate logs entirely. I also instituted a new code review checklist item for concurrency safety, turning a failure into a permanent process improvement.

### 4. Challenge: Innovation & Initiative (The "Ownership" Question)
**Context:** I noticed our customer churn prediction models (Churnistic) were getting stale because retraining was a manual, error-prone process.
**Action:** proactively built an automated ML pipeline using TensorFlow.js and Firebase Functions. I set up triggers to re-train the model automatically when new dataset thresholds were reached.
**Result:** Model accuracy improved by 15% due to fresher data, and the team saved 5+ hours per week of manual data wrangling.
`;
