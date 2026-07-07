import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { InvestmentVerdictSchema } from "../utils/schema.js";
import { z } from "zod";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  apiKey: process.env.GEMINI_API_KEY,
});

// Zod schema for identifying the company
const IdentificationSchema = z.object({
  isOperatingCompany: z.boolean().describe("True if this is a real operating company (not a crypto token, mutual fund, ETF, or gibberish)"),
  isListed: z.boolean().describe("True if the company is publicly listed (e.g. NSE, BSE, NASDAQ)"),
  confidence: z.enum(["high", "low"]).describe("High if you are certain about the company details, low if it's obscure or ambiguous"),
  normalizedName: z.string().describe("The standard operating name of the entity"),
  reasoning: z.string()
});

export const identifyCompany = async (state) => {
  console.log(`[Node] identifyCompany for: ${state.companyName}`);

  const prompt = `
    You are a financial researcher. A user has asked you to analyze: "${state.companyName}".
    Determine if this is a real operating company (e.g., Reliance, Infosys, Zepto).
    Exclude mutual funds, ETFs, index funds, and crypto tokens.
    Determine if it is publicly traded (e.g., listed on NSE, BSE, etc.).
    If the name is ambiguous, make your best guess for the most prominent company with this name.
  `;

  const structuredLlm = llm.withStructuredOutput(IdentificationSchema);
  let identity = await structuredLlm.invoke(prompt);

  // If confidence is low, we could fall back to a quick search, but for simplicity we will rely on Gemini's vast knowledge.
  // We'll simulate a fallback here by doing a quick search if it's low confidence and we really need to know if it's listed.
  if (identity.confidence === "low" && identity.isOperatingCompany) {
    console.log(`[Node] Low confidence identification. Falling back to Tavily for listing status...`);
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    try {
      const searchRes = await tvly.search(`${identity.normalizedName} stock ticker publicly traded NSE BSE`, { searchDepth: "basic", maxResults: 2 });
      const searchContent = searchRes.results.map(r => r.content).join(" ");
      const fallbackPrompt = `Based on this search result: "${searchContent}", is the company ${identity.normalizedName} publicly listed? Reply with just JSON: {"isListed": true/false}`;
      const fallbackRes = await llm.invoke(fallbackPrompt);
      const isListedMatch = fallbackRes.content.match(/"isListed":\s*(true|false)/i);
      if (isListedMatch) {
        identity.isListed = isListedMatch[1] === "true";
        identity.confidence = "high";
      }
    } catch (e) {
      console.warn("Fallback search failed, proceeding with LLM guess.", e);
    }
  }

  return {
    isOperatingCompany: identity.isOperatingCompany,
    isListed: identity.isListed,
    normalizedName: identity.normalizedName,
    identityReasoning: identity.reasoning,
    status: identity.isOperatingCompany ? "identified" : "invalid_entity"
  };
};

export const executeSearch = async (state) => {
  console.log(`[Node] executeSearch for: ${state.normalizedName}`);
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const company = state.normalizedName;

  try {
    const [newsRes, financialsRes, controversyRes] = await Promise.all([
      tvly.search(`${company} recent business news 2026`, { maxResults: 3 }),
      tvly.search(`${company} financial results revenue profit margin`, { maxResults: 3 }),
      tvly.search(`${company} controversy lawsuit regulatory SEBI SEC red flags`, { maxResults: 3 })
    ]);

    const gatheredData = {
      news: newsRes.results,
      financials: financialsRes.results,
      controversies: controversyRes.results
    };

    return { gatheredData, status: "searched" };
  } catch (error) {
    console.error("Tavily search failed:", error);
    return { status: "search_failed" };
  }
};

export const checkDataSufficiency = async (state) => {
  console.log(`[Node] checkDataSufficiency`);
  // If the total characters across all search results is too low, we probably don't have enough data
  const allResults = [
    ...state.gatheredData.news,
    ...state.gatheredData.financials,
    ...state.gatheredData.controversies
  ];

  const totalContentLength = allResults.reduce((acc, curr) => acc + curr.content.length, 0);

  if (totalContentLength < 500) {
    return { status: "insufficient_data" };
  }

  return { status: "data_sufficient" };
};

export const generateAnalysis = async (state) => {
  console.log(`[Node] generateAnalysis`);

  const { isListed, normalizedName, identityReasoning, gatheredData } = state;

  const formatResults = (results) => results.map(r => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n");

  const systemPrompt = `
    You are an expert investment researcher following a "smart retail investor" persona.
    You are analyzing: ${normalizedName}.
    
    Entity Context: ${identityReasoning}
    Publicly Listed: ${isListed ? "Yes" : "No, it is a private company. Skip financial ratio analysis and focus on qualitative signals."}
    
    You have the following search data:
    --- RECENT NEWS ---
    ${formatResults(gatheredData.news)}
    
    --- FINANCIAL INDICATORS ---
    ${formatResults(gatheredData.financials)}
    
    --- RED FLAGS & CONTROVERSIES ---
    ${formatResults(gatheredData.controversies)}
    
    Evaluate the company based on:
    1. Business Quality (moat, market position)
    2. Momentum (trajectory, news tone)
    3. Red Flags (lawsuits, distress)
    
    Output a structured JSON response matching the schema.
    If the data is completely irrelevant or you truly cannot form an opinion, choose "Insufficient Data" and provide a reason.
  `;

  const structuredLlm = llm.withStructuredOutput(InvestmentVerdictSchema);

  try {
    const verdict = await structuredLlm.invoke(systemPrompt);
    verdict.is_listed = isListed;
    verdict.resolved_name = normalizedName;

    // Auto-populate sources from gathered data
    const allSources = [
      ...gatheredData.news,
      ...gatheredData.financials,
      ...gatheredData.controversies
    ].map(r => ({ title: r.title, url: r.url }));

    // Deduplicate sources by URL
    const uniqueSources = Array.from(new Map(allSources.map(item => [item.url, item])).values());
    verdict.sources = uniqueSources.slice(0, 5); // Limit to top 5 sources

    return { finalVerdict: verdict, status: "complete" };
  } catch (error) {
    console.error("LLM Analysis failed:", error);
    return { status: "analysis_failed" };
  }
};
