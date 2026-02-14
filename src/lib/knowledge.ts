export const KNOWLEDGE_BASE = `
# Professional Profile
Luis Gimenez is a Software Engineer II at The Home Depot. He is an expert in enterprise architecture, payment systems, and distributed systems.

## Core Competencies
- **Languages**: Go (expert), Java (proficient), TypeScript/JavaScript, Rust, Python.
- **Cloud Architecture**: Certified GCP Professional Cloud Architect. Experience with GKE, Cloud Run, Pub/Sub, BigQuery, Cloud Spanner.
- **Backend Engineering**: Microservices, Event-Driven Architecture, gRPC, OAuth2, RESTful APIs.
- **Frontend**: React, Next.js, Tailwind CSS, Shadcn/UI.

## Experience

### Software Engineer II - The Home Depot (Current)
- Architecting and maintaining high-throughput payment processing systems.
- Designing distributed systems capable of handling millions of transactions daily across thousands of locations.
- Optimizing cloud infrastructure for reliability and cost-efficiency.

### Previous Roles & Projects
- **Churnistic**: AI-powered SaaS for predicting customer churn using TensorFlow.js and Firebase. (Source: github.com/menezmethod/churnistic)
- **Trading Journal**: A real-time trading analytics platform featuring WebSocket integrations and gRPC backend services. built with Go and React.
- **Rythmae**: High-performance audio engine written in Rust for real-time DSP.

## Education & Certifications
- **Google Cloud Professional Cloud Architect**: Validated expertise in designing secure, scalable, and reliable cloud solutions.

## Contact
- Email: luisgimenezdev@gmail.com
- GitHub: github.com/menezmethod
- LinkedIn: linkedin.com/in/gimenezdev
- Location: Parrish, Florida (Open to Remote)

## Personal Notes & Philosophy
- Luis believes in "Serverless First" architecture but knows when to break the glass for Kubernetes.
- Deep focus on performance optimization and "Defense in Depth" security practices.
- Passionate about open-source contribution and knowledge sharing.

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
