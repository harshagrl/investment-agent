# AI Investment Research Agent

An AI-powered investment research agent built for the "smart retail investor." Given a company name, the agent orchestrates targeted web searches, synthesizes qualitative and fundamental data, and delivers a structured investment verdict (Strong Invest to Strong Pass) along with its reasoning and citations.

## Overview

This project implements a LangGraph.js directed acyclic graph (DAG) to control an LLM's research process. Rather than relying on a single zero-shot prompt, the agent:
1. **Identifies** the entity to ensure it's a valid operating company (excluding crypto and funds).
2. **Researches** 3 distinct data streams in parallel (News, Financials, Controversies) using Tavily.
3. **Gates** the pipeline to ensure data sufficiency before spending expensive LLM tokens on analysis.
4. **Synthesizes** the gathered information into a structured JSON verdict using Gemini 1.5 Flash.

## How to Run Locally

### 1. Prerequisites
- Node.js (v18+)
- A [Gemini API Key](https://aistudio.google.com/)
- A [Tavily API Key](https://tavily.com/)

### 2. Setup the Backend (Server)
```bash
cd server
npm install
# Create a .env file based on the example
cp .env.example .env 
# Add your GEMINI_API_KEY and TAVILY_API_KEY to the .env file
npm start
```

### 3. Setup the Frontend (Client)
In a new terminal:
```bash
cd client
npm install
# Create a .env file (VITE_API_URL defaults to http://localhost:3001)
cp .env.example .env
npm run dev
```
Visit `http://localhost:5173` in your browser.

---

## How It Works (Architecture)

The backend is built with **Express** and **LangGraph.js**. The agent's reasoning loop is structured as a graph:
- **`identify_node`**: Uses Gemini directly to categorize the user's query. If the user typed "Reliance", it disambiguates it to "Reliance Industries Ltd" and checks if it's publicly listed.
- **`search_node`**: Leverages `@tavily/core` to run 3 parallel searches. Instead of one vague query, it specifically hunts for recent news, financial metrics, and regulatory red flags.
- **`gate_node`**: A data sufficiency check. If the search returns very little text (e.g., for a fake company like "Zomito"), the graph exits early with an "Insufficient Data" status.
- **`analyze_node`**: The heavy lifter. It feeds the gathered search data to Gemini 2.5 Flash. The node includes branching logic: if the company is unlisted, it explicitly tells the LLM to skip financial ratio analysis.
- **Zod Schema**: Ensures the final output strictly adheres to our UI's requirements (Verdict, Confidence, Business Quality, Momentum, Red Flags, Sources).

---

## Key Decisions & Trade-offs

1. **Graceful Degradation vs. Hardcoded Paths**
   - The agent accepts any company (public or private). If the company is unlisted (e.g., Zepto), it automatically adapts its analysis to skip financial ratios rather than throwing an error. This single-path adaptability is much easier to maintain than two separate pipelines.

2. **One Tool, Three Queries**
   - We consciously chose to use **Tavily for everything** rather than integrating separate News and Finance APIs. By structuring our Tavily calls into 3 specific intents, we got clean data buckets while keeping the failure surface area small. 

3. **In-Memory Caching**
   - A simple `Map` is used on the backend to cache results by normalized company name. This protects Tavily API quotas when demoing or testing the same company repeatedly. A production system would use Redis.

4. **Simulated UI Streaming**
   - True Server-Sent Events (SSE) from LangGraph to React is complex to wire up reliably in a 7-day sprint. Instead, the frontend simulates the "agent thinking" steps sequentially on a timer. The UX remains premium, but the engineering footprint is drastically smaller.

5. **LLM Choice**
   - We chose **Gemini 2.5 Flash** over Groq. While Groq is faster, Gemini's massive context window ensures we don't truncate long Tavily search results, and its structured output (Zod) adherence is exceptionally reliable. For a research agent, reliability > raw speed.

---

## Example Runs (Gold Standard Scenarios)

We manually validated the agent across 5 specific scenarios to ensure it handles edge cases:

1. **Clean Public Company ("Infosys")**
   - **Result:** Successfully analyzes business quality, momentum, and financial metrics. Outputs a clear verdict with sources.
2. **Clean Unlisted Company ("Zepto")**
   - **Result:** Identifies it as private, gracefully skips P/E or stock metrics, and evaluates it entirely on qualitative funding news and market momentum.
3. **Company with Red Flags ("Paytm")**
   - **Result:** Correctly surfaces recent regulatory actions by the RBI. The "Red Flags" bucket is heavily populated, dragging down the overall confidence and verdict score.
4. **Pure Garbage Input ("asdfghjkl")**
   - **Result:** Blocked by the `gate_node`. Immediately returns "Insufficient Data" rather than hallucinating a response.
5. **Plausible Fake ("Zomito")**
   - **Result:** Also blocked by the `gate_node`. Proves the agent relies on real search data, not just pattern-matching on the name.

---

## What I'd Improve (Future Work)

- **Persistent Caching:** Upgrade the in-memory `Map` to Redis to maintain the cache across server restarts and horizontally scale the backend.
- **Fallback Search Providers:** Add a fallback (like Exa or direct Google Custom Search) in case the Tavily API goes down or hits rate limits.
- **Real-Time Streaming:** Replace the simulated frontend steps with genuine Server-Sent Events (SSE) directly tapping into LangGraph's state updates for pixel-perfect progress tracking.
- **Deeper Financial Integration:** For public companies only, integrate a specialized API (like Yahoo Finance) to pull exact real-time numbers, supplementing the qualitative search data.
