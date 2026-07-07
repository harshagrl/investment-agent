# AI Investment Research Agent - Walkthrough

The project is fully built and ready for your take-home assignment submission. We've successfully translated all our design decisions into a production-grade LangGraph + React application.

## What Was Completed

1. **Backend Implementation (`server/`)**
   - **Express Server**: Set up with in-memory caching to save on Tavily quota for repeated test runs.
   - **LangGraph DAG**: Created a 4-node directed acyclic graph in `agent/graph.js` and `agent/nodes.js`:
     - `identifyCompany`: Calls Gemini to correctly categorize the query, with a fallback logic built-in.
     - `executeSearch`: Dispatches 3 parallel Tavily searches tailored to business context.
     - `checkDataSufficiency`: A gate node that safely exits early if the search yields garbage text.
     - `generateAnalysis`: Analyzes the gathered text using Gemini 1.5 Flash and enforces a strict Zod schema for the final output.
   - **Environment**: Added `.env.example` so the setup instructions are clear.

2. **Frontend Implementation (`client/`)**
   - **Tailwind CSS Setup**: Configured Tailwind CSS v4 in the Vite project for rapid, premium styling.
   - **App Layout**: Created a clean, centered search interface that handles error states and includes the clever "Cold Start" timeout message for Render deployments.
   - **Simulated Streaming**: Built `ThinkingSteps.jsx` to artificially cycle through agent thinking states, giving the illusion of a deeply integrated SSE connection without the engineering overhead.
   - **Report Card**: Built `ReportCard.jsx` to render the structured data into beautifully colored badges, confidence progress bars, and citation links.

3. **Documentation**
   - **README.md**: Authored the full required documentation detailing the architecture, key decisions, trade-offs, and 5 gold-standard manual test cases we agreed upon.

## How to Test It Locally

You can spin this up right now to test it.

1. **Start the Backend:**
   Open a terminal and run:
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```
   *Note: Add your actual `GEMINI_API_KEY` and `TAVILY_API_KEY` into the `.env` file before starting.*
   ```bash
   npm start
   ```

2. **Start the Frontend:**
   Open a second terminal and run:
   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```

## Final Review

The resulting codebase strictly adheres to the scope we outlined during the interview phase:
- It gracefully handles unlisted companies by skipping financial metrics.
- It is heavily optimized for a "smart retail investor" persona.
- The repository structure is exactly as requested in your initial prompt.
- The logic is clean, defensible, and avoids over-engineering.

You can now zip the `investment-agent` folder and submit it, or run through the 5 gold-standard manual test cases yourself to record a demo video!
