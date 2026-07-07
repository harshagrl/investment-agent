# AI Investment Research Agent

An AI-powered investment research agent built for the "smart retail investor." Given a company name, the agent orchestrates targeted web searches, synthesizes qualitative and fundamental data, and delivers a structured investment verdict (Strong Invest → Strong Pass) along with its reasoning and citations.

The agent goes beyond basic analysis with two transparency features: it explicitly discloses when it has interpreted an ambiguous or misspelled company name (e.g., "Zomito" → "Zomato Limited"), and explicitly flags when a company is unlisted and financial ratios are unavailable — so the user always knows what assumptions drove the analysis.

**🔗 Live Demo:** [https://ai-investment-agent-ten.vercel.app/](https://ai-investment-agent-ten.vercel.app/)

## How to Run Locally

### 1. Prerequisites
- Node.js (v18+)
- A [Gemini API Key](https://aistudio.google.com/)
- A [Tavily API Key](https://tavily.com/)

> **Note:** Gemini's free tier is capped at 20 requests/day per model — for repeated testing or demoing to reviewers, consider enabling billing on the Google Cloud project tied to your API key to avoid hitting this limit.

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

The backend is built with **Express** and **LangGraph.js**. The agent's reasoning loop is structured as a directed acyclic graph (DAG):

- **`identify_node`**: Uses Gemini to categorize the user's query — determines if it's a real operating company (excluding crypto, funds, ETFs), checks listing status, and critically, resolves ambiguous or misspelled names to their real company. The resolved name is captured as `resolved_name` and surfaced in the UI as a disclosure banner (e.g., "Interpreting 'zomito' as Zomato Limited"). If identification confidence is low, the node falls back to a quick Tavily search to verify listing status before proceeding.

- **`search_node`**: Leverages `@tavily/core` to run 3 parallel searches. Instead of one vague query, it specifically hunts for recent news, financial metrics, and regulatory red flags — producing clean, separated data buckets for the analysis step.

- **`gate_node`**: A data sufficiency check. If the total content across all search results falls below a character threshold (500 chars), the graph exits early with an "Insufficient Data" status rather than spending LLM tokens on thin data. This catches both garbage input (e.g., "asdfghjkl") and obscure entities that Tavily can't find meaningful coverage for.

- **`analyze_node`**: The heavy lifter. It feeds the gathered search data to Gemini 2.5 Flash with a structured system prompt. If the company is unlisted, the prompt explicitly tells the LLM to skip financial ratio analysis and focus on qualitative signals. After the LLM returns its structured verdict, the node force-injects `is_listed` and `resolved_name` directly from the identification step's state — rather than trusting the LLM to restate them — ensuring the UI can reliably show the "Unlisted company" and "Interpreting X as Y" banners without depending on LLM consistency.

- **Zod Schema**: Ensures the final output strictly adheres to the UI's requirements (Verdict, Confidence, Business Quality, Momentum, Red Flags, Sources).

---

## Key Decisions & Trade-offs

1. **Graceful Degradation vs. Hardcoded Paths**
   - The agent accepts any company (public or private). If the company is unlisted (e.g., Zepto), it automatically adapts its analysis to skip financial ratios rather than throwing an error. This single-path adaptability is much easier to maintain than two separate pipelines.

2. **One Tool, Three Queries**
   - We consciously chose to use **Tavily for everything** rather than integrating separate News and Finance APIs. By structuring our Tavily calls into 3 specific intents (news, financials, controversies), we got clean data buckets while keeping the failure surface area small.

3. **In-Memory Caching**
   - A simple `Map` is used on the backend to cache results by normalized company name. This protects Tavily API quotas when demoing or testing the same company repeatedly. A production system would use Redis.

4. **Simulated UI Streaming**
   - True Server-Sent Events (SSE) from LangGraph to React is complex to wire up reliably in a short sprint. Instead, the frontend simulates the "agent thinking" steps sequentially on a timer. The UX remains premium, but the engineering footprint is drastically smaller.

5. **LLM Choice: Gemini 2.5 Flash over 1.5 Flash**
   - We chose **Gemini 2.5 Flash** over both Groq and Gemini 1.5 Flash. Beyond Gemini's massive context window (which prevents truncation of long Tavily results), the deciding factor was structured output reliability: the LangChain library's own model profile data marks 1.5 Flash's `structuredOutput` capability as explicitly `false`, while 2.5 Flash's is `true`. For a project built entirely around strict Zod schema output, 1.5 Flash was not a safe choice.

6. **Transparent Assumption Disclosure**
   - Rather than silently correcting typos/ambiguous names or silently omitting financial data for unlisted companies, the agent surfaces both decisions directly in the UI. If "Zomito" gets resolved to "Zomato Limited," a banner says so. If a company is unlisted, a banner explains that financial ratios are unavailable and the analysis is qualitative-only. The user always knows what assumption the agent made and why the analysis looks the way it does.

7. **Confidence Reflects Data Quality, Not Just Verdict Strength**
   - In real testing, Infosys (public, data-rich) scored 85% confidence, while Zepto (unlisted, thinner signals) scored 70% despite an equally decisive verdict. This demonstrates the confidence score tracks data completeness independent of how strong the verdict itself is — a company can get a "Strong Pass" at 70% confidence because the agent is less certain of its data, not less certain of its conclusion.

---

## Example Runs (Real Test Outputs)

These are actual outputs from testing, not hypothetical scenarios.

### 1. Infosys — Lean Pass, 85% Confidence
A mature public company with rich data coverage. The agent surfaced a nuanced picture:
- **Business Quality:** Identified as a leading IT services company with a strong global client base, but flagged that IT services face increasing commoditization pressure and AI-driven disruption to traditional outsourcing models.
- **Red Flags:** Surfaced the class-action securities lawsuit alleging misleading financial statements, a prior whistleblower complaint regarding unethical practices, and the SEBI penalty for delayed insider trading disclosures.
- **Verdict rationale:** The combination of active litigation, regulatory action, and sector headwinds outweighed the stable revenue base — resulting in a Lean Pass rather than Neutral.

### 2. Zepto — Strong Pass, 70% Confidence
Correctly identified as an **unlisted company** — the UI showed the "Unlisted company — analysis based on qualitative signals only, financial ratios unavailable" banner. The agent adapted to evaluate entirely on qualitative signals:
- Acknowledged the impressive 129% YoY revenue growth and rapid expansion, but flagged ₹3,367 crore in net losses and the intense competitive pressure from Blinkit (Zomato) and Instamart (Swiggy).
- The lower 70% confidence (vs. Infosys's 85%) reflects the thinner data available for a private company — not a weaker conviction in the verdict itself.

### 3. Paytm — Lean Invest, 72% Confidence
This was the most surprising result. We expected the agent to surface heavy historical red flags (the RBI payment bank shutdown), but the agent's live research found a **genuine business recovery story**:
- The agent found that Paytm had achieved EBITDA and PAT profitability, with 20–28% YoY revenue growth across recent quarters.
- The only active red flag surfaced was a moderate ongoing SEBI matter — far less severe than the historical RBI action.
- This demonstrates the agent reasons from **current data** rather than outdated reputation — the verdict reflects where Paytm is today, not where it was 18 months ago.

### 4. "asdfghjkl" — Insufficient Data
Correctly rejected at the identification stage. The `identify_node` determined this was not a real operating company, and the pipeline exited before any Tavily search calls were made — saving API quota on obvious garbage input.

### 5. "Zomito" — Resolved to Zomato, Accurate Analysis
The `identify_node` correctly resolved the misspelled "Zomito" to **Zomato Limited**. The UI displayed the disclosure banner: *"Interpreting 'zomito' as Zomato Limited."* The subsequent analysis was accurate and current — including details about Deepinder Goyal's January 2026 CEO transition at Blinkit. This proves the agent researches from live data rather than pattern-matching on plausible-sounding names.

---

## What I'd Improve (Future Work)

- **Persistent Caching:** Upgrade the in-memory `Map` to Redis to maintain the cache across server restarts and horizontally scale the backend.
- **Fallback Search Providers:** Add a fallback (like Exa or direct Google Custom Search) in case the Tavily API goes down or hits rate limits.
- **Real-Time Streaming:** Replace the simulated frontend steps with genuine Server-Sent Events (SSE) directly tapping into LangGraph's state updates for pixel-perfect progress tracking.
- **Deeper Financial Integration:** For public companies only, integrate a specialized API (like Yahoo Finance) to pull exact real-time numbers, supplementing the qualitative search data.
- **Rate Limit Resilience:** The free tier's 20-requests/day cap was hit during heavy testing. A production version would add request queuing, a paid API tier, or graceful multi-key rotation to handle sustained usage without silent failures.
