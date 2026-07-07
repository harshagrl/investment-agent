# AI Investment Research Agent Tasks

- `[x]` **Project Setup**
  - `[x]` Initialize `investment-agent` root directory
  - `[x]` Initialize `server` (Express, dotenv, cors, etc.)
  - `[x]` Initialize `client` (Vite, React, Tailwind)
  - `[x]` Create `.env.example` files for both

- `[ ]` **Backend (LangGraph & Express)**
  - `[x]` Set up Express server and basic route (`POST /api/research`)
  - `[x]` Implement in-memory Map cache
  - `[x]` Define Zod schemas for structured output (`utils/schema.js`)
  - `[x]` Implement LangGraph nodes (`agent/nodes.js`)
    - `[x]` `identify_node` (Gemini first, fallback Tavily)
    - `[x]` `search_node` (3 Tavily queries)
    - `[x]` `gate_node` (Data sufficiency check)
    - `[x]` `analyze_node` (Branching logic for listed vs unlisted)
  - `[x]` Wire LangGraph DAG (`agent/graph.js`)

- `[x]` **Frontend (React & Tailwind)**
  - `[x]` Configure Tailwind CSS
  - `[x]` Build Main App Layout (Search bar, Cold start warning)
  - `[x]` Build `ThinkingSteps` component (Simulated streaming)
  - `[x]` Build `ReportCard` component (Verdict, Confidence, Cards, Sources)
  - `[x]` Connect frontend to backend API

- `[x]` **Documentation**
  - `[x]` Write complete `README.md` per assignment requirements

- `[x]` **Verification**
  - `[x]` Test 5 gold-standard scenarios
