# AI Investment Research Agent

This document outlines the architecture and implementation plan for the take-home assignment: an AI Investment Research Agent. 

The agent acts as a "smart retail investor doing weekend homework" and provides a sanity-check investment verdict (Invest/Pass spectrum) based on publicly available qualitative data and basic scraped financials.

## Key Design Decisions & Trade-offs (For the README)
1. **Graceful Degradation:** One agent handles both public and private companies. If unlisted, it skips financial ratios rather than breaking or requiring a separate tool.
2. **One Tool, Three Queries:** Instead of juggling 3 different APIs (News, Finance, Search), we use **Tavily** for everything, but strictly bucketed into 3 queries (News, Financials, Controversies). Less surface area, fewer points of failure.
3. **Simulated Streaming:** To deliver a premium UX within a 7-day timeline, we simulate the "agent thinking" steps on the frontend using a timed sequence, rather than over-engineering Server-Sent Events (SSE) for a linear LangGraph pipeline.
4. **LLM Choice:** **Gemini 1.5 Flash** for its massive context window (to swallow 3 full search results without chunking) and reliable structured output (Zod), prioritizing stability over Groq's raw speed.
5. **In-Memory Caching:** A simple `Map` cache saves Tavily credits and avoids latency for repeated identical queries (like testing "Infosys" 10 times).
6. **Tailwind CSS:** Chosen for speed and familiarity, allowing us to build a premium, custom UI without wrestling with unfamiliar CSS architecture.

---

## Proposed Architecture: LangGraph Pipeline

The agent will follow a mostly linear DAG with one conditional branch and one early-exit gate:

1. **`identify_node`**: Uses Gemini directly (no tools) to identify the entity, determine if it's an operating company (reject crypto/funds), and guess if it's publicly listed (NSE/BSE). It only falls back to a Tavily search if the LLM has low confidence (e.g., obscure name).
2. **`search_node`**: Executes 3 parallel Tavily queries.
3. **`gate_node` (Insufficient Data Check)**: Verifies if the search returned enough meat. If it's garbage ("asdfghjkl") or a fake company ("Zomito"), it exits the graph early with an `INSUFFICIENT_DATA` verdict.
4. **`analyze_node` (Branching)**: 
   - *If Public:* Analyzes business quality, momentum, red flags, AND financial metrics.
   - *If Private:* Analyzes qualitative buckets only, explicitly skipping financials.
5. **`format_node`**: Enforces strict JSON output via Zod for the frontend.

---

## Proposed Changes

### 1. Server (Backend)

#### [NEW] `server/package.json`
- Dependencies: `express`, `cors`, `dotenv`, `@langchain/google-genai`, `@langchain/langgraph`, `@langchain/core`, `@tavily/core`, `zod`.

#### [NEW] `server/.env.example`
- Shows required keys (`GEMINI_API_KEY`, `TAVILY_API_KEY`) for easy setup documentation.

#### [NEW] `server/index.js`
- Express server setup.
- In-memory `Map` cache implementation for incoming queries.
- API route `POST /api/research` to trigger the graph.

#### [NEW] `server/agent/graph.js`
- The core LangGraph state definition (messages, gathered_data, company_status).
- Graph wiring (nodes and edges).

#### [NEW] `server/agent/nodes.js`
- `identifyCompany`: Checks entity type and listing status using Gemini (falling back to Tavily if needed).
- `executeSearch`: Calls Tavily 3 times.
- `checkDataSufficiency`: The early-exit gate.
- `generateAnalysis`: The heavy Gemini 1.5 Flash call with `.withStructuredOutput()`.

#### [NEW] `server/utils/schema.js`
- Zod schema for the final output (verdict, confidence, buckets, sources).

### 2. Client (Frontend)

#### [NEW] `client/package.json`
- Standard React + Vite setup.
- TailwindCSS setup.

#### [NEW] `client/.env.example`
- Shows required keys (e.g., `VITE_API_URL`).

#### [NEW] `client/src/App.jsx`
- Main layout. Handles the search input and the "Cold Start" timeout logic (swapping to "Waking up the server..." after 5 seconds).

#### [NEW] `client/src/components/ThinkingSteps.jsx`
- The simulated streaming component. Cycles through statuses ("Checking listing...", "Reading news...") while waiting for the backend.

#### [NEW] `client/src/components/ReportCard.jsx`
- The final polished output.
- Big colored badge (Strong Invest -> Strong Pass).
- Confidence progress bar.
- Cards for reasoning (Business, Momentum, Red Flags).
- Clickable Sources list.

#### [NEW] `client/src/index.css`
- Tailwind directives and base styles.

### 3. Documentation

#### [NEW] `README.md`
- As requested: Overview, Setup, Architecture, Key Decisions & Trade-offs, Example runs, and Future Improvements.

---

## Verification Plan

### Manual Testing Scenarios (The "Gold Standard" Suite)
1. **Infosys**: Clean public company (Should output full analysis + financials).
2. **Zepto**: Clean unlisted company (Should gracefully skip financials and explicitly state it).
3. **Paytm (One97)**: Real red flags (Should heavily populate the red flags bucket and impact the verdict).
4. **asdfghjkl**: Pure garbage (Should hit the early-exit gate and return Insufficient Data).
5. **Zomito**: Plausible fake (Should hit the early-exit gate and not hallucinate a real company).
