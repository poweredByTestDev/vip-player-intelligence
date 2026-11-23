
# VIP Player Intelligence

**AI-Powered VIP Conversation Analysis & Management Platform**

VIP Player Intelligence is a functional MVP designed to help online casino VIP teams analyze player communications, monitor service quality, identify risks, and manage follow-up actions.

The application demonstrates how AI can support VIP managers and team leaders in their daily workflows.

**Project type:** MVP / Technical Assignment  
**Technology:** Next.js, React, JavaScript, Tailwind CSS, OpenAI API, Zod  
**Data:** Fictional demonstration dataset

---

## 1. Project Overview

VIP managers communicate with valuable players through Telegram, WhatsApp, and email.

Their responsibilities include assisting with deposits and withdrawals, resolving player issues, providing support, and maintaining positive relationships.

Managing hundreds of conversations makes it difficult for team leaders to consistently evaluate communication quality and identify issues.

VIP Player Intelligence addresses this challenge by using AI to analyze conversations and generate structured, actionable insights.

The MVP focuses on three areas:

1. Conversation quality analysis.
2. Risk detection and monitoring.
3. Task management and follow-up control.

## 2. Demo Dataset

The project uses fictional data:

- 40 player conversations.
- 50 player profiles.
- 5 VIP managers.

The application does not connect to real casino accounts or messaging platforms.

## 3. Main Features

### Team Lead Dashboard

The dashboard provides an overview of VIP team performance.

Features include:

- Team performance overview.
- Conversation monitoring.
- Manager performance indicators.
- Conversation search and filtering.
- Individual AI conversation analysis.
- Bulk analysis of selected conversations.
- Quality Score visualization.
- Risk monitoring.
- Task Monitoring dashboard.

### AI Conversation Analysis

The application uses the OpenAI API to analyze player-manager conversations.

Each analysis produces structured JSON containing:

- **Topic:** Main subject of the conversation.
- **Sentiment:** Player sentiment.
- **Resolution Status:** Whether the issue was resolved.
- **Quality Score:** Demonstration service quality score.
- **Risk Level:** Potential risk classification.
- **Summary:** Brief conversation overview.
- **Findings:** Evidence-based observations.
- **Next Actions:** Recommended follow-up activities.

Findings include references to the original messages.

Response-time intervals are calculated with JavaScript using message timestamps.

### Quality Score

The MVP uses an illustrative scoring methodology.

| Criterion | Maximum Score |
|---|---:|
| Resolution | 30 |
| Communication | 20 |
| Response Time | 15 |
| Personalization | 10 |
| Promises | 10 |
| Safety | 15 |
| **Total** | **100** |

Criteria marked as not applicable or having insufficient information are excluded from the calculation.

The final score is normalized based on applicable criteria.

**Important:** This scoring methodology is a demonstration model.

The technical assignment did not define official KPI weights, SLA requirements, or scoring rules.

A production implementation would require alignment with the company's evaluation standards.

### Risk Detection

The system identifies potential service and Responsible Gaming risks.

Examples include:

- Self-exclusion requests.
- Requests to block gambling accounts.
- Gambling-related financial harm.
- Attempts to retain players requesting self-exclusion.
- Unresolved player complaints.

The system combines AI analysis with supplementary JavaScript-based checks for certain critical scenarios.

When a critical manager violation is identified, Quality Score is capped at 20/100.

Risk detection is not exhaustive and requires human review.

### VIP Manager Workspace

A dedicated interface for VIP managers.

Features include:

- Demo manager selection.
- Assigned player queue.
- Player conversation history.
- AI-generated insights.
- Recommended follow-up actions.
- Task management.

Internal manager Quality Scores are not displayed in the manager workspace.

Manager selection is for demonstration purposes and is not real authentication.

### Task Management

AI recommendations can be converted into tasks.

Supported task statuses:

- To Do
- In Progress
- Done

Managers can update task statuses and add comments.

Team leaders can monitor tasks through the Task Monitoring dashboard.

Critical tasks require additional attention.

A task marked Done does not independently verify the completion of actions in external systems.

## 4. Demo Scenarios

Three conversations are particularly useful for testing the application.

### D001 — Deposit Issue

A player reports repeated deposit failures.

The VIP manager offers a bonus instead of providing relevant technical assistance.

The system identifies unresolved service issues and generates recommendations.

### D007 — Withdrawal Delay

A player reports a delayed withdrawal.

The VIP manager assists with documentation and payment processing.

This scenario demonstrates an example of effective customer service.

### D010 — Self-Exclusion Request

A player reports losing their salary and requests account blocking.

The VIP manager attempts to retain the player by offering cashback.

This scenario demonstrates critical Responsible Gaming risk detection.

## 5. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and API routes |
| React | User interface |
| JavaScript | Application and business logic |
| Tailwind CSS | Styling |
| OpenAI API | AI conversation analysis |
| Zod | Structured AI response validation |
| JSON / CSV | Demo data and local storage |

## 6. Installation

### Requirements

- Node.js
- npm
- OpenAI API key
- Internet access for AI requests

### Step 1. Download the project

Clone the repository or download it as a ZIP archive.

Extract the project and open its root directory in a terminal.

### Step 2. Install dependencies

```bash
npm install
```

### Step 3. Configure environment variables

Create a `.env.local` file in the project root.

Add:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

You can use `.env.example` as a reference.

Never commit your real API key.

### Step 4. Start the development server

```bash
npm run dev
```

Open:

http://localhost:3000

### Step 5. Production build

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## 7. Main Application Routes

| Route | Description |
|---|---|
| `/` | Application homepage |
| `/team-lead` | Team Lead Dashboard |
| `/team-lead/D001` | Example conversation analysis |
| `/team-lead/D010` | Critical risk example |
| `/vip-manager` | VIP Manager Workspace |

## 8. Project Structure

```text
vip-player-intelligence/
├── data/
│   ├── analyses/
│   ├── dialogs.json
│   └── players.csv
├── public/
├── scripts/
│   └── qa-check.mjs
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── team-lead/
│   │   └── vip-manager/
│   ├── components/
│   └── lib/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── README_RU.md
```

AI analysis results are stored in `data/analyses/`.

Task states are stored locally in `data/tasks/` when generated.

## 9. Quality Assurance

The project includes a QA script for structural verification.

Run:

```bash
node scripts/qa-check.mjs
```

The script checks the integrity of saved analysis data and associated tasks.

Validation includes:

- JSON structure.
- Quality Score ranges.
- Scoring calculations.
- Evidence references.
- Recommendation structure.
- Saved task consistency.

Structural QA does not guarantee the semantic accuracy of AI-generated conclusions.

The MVP was additionally reviewed using representative conversation scenarios.

## 10. Security and Limitations

This application is intended for demonstration purposes.

Current limitations include:

- No production authentication.
- No role-based access control.
- No production database.
- No live Telegram or WhatsApp integration.
- No live CRM integration.
- No automatic account restrictions.
- Local JSON-based persistence.
- Human review required for AI findings and critical risks.

The project uses fictional data.

Do not process real player information without implementing appropriate privacy, security, access control, and data retention measures.

## 11. Future Improvements

Potential improvements include:

- Configurable Quality Score methodology.
- Company-specific KPI and SLA integration.
- CRM and messaging platform connections.
- Automatic conversation ingestion.
- Database-backed storage.
- Role-based authentication.
- Automated task assignment.
- Expanded multilingual risk detection.
- Human approval workflows for critical cases.
- Historical performance reporting.

## 12. Conclusion

VIP Player Intelligence demonstrates an end-to-end AI-assisted workflow:

**Conversation → AI Analysis → Findings → Recommendations → Tasks → Monitoring**

The project is designed as a functional MVP rather than a production-ready system.

Its purpose is to demonstrate how AI-powered analysis can be integrated into VIP operations and adapted to company-specific business requirements.
