import { StateGraph, START, END } from "@langchain/langgraph";
import { identifyCompany, executeSearch, checkDataSufficiency, generateAnalysis } from "./nodes.js";

// Define the state schema for our graph
const agentState = {
  companyName: {
    value: (x, y) => y ?? x,
    default: () => ""
  },
  normalizedName: {
    value: (x, y) => y ?? x,
    default: () => ""
  },
  isOperatingCompany: {
    value: (x, y) => y ?? x,
    default: () => true
  },
  isListed: {
    value: (x, y) => y ?? x,
    default: () => false
  },
  identityReasoning: {
    value: (x, y) => y ?? x,
    default: () => ""
  },
  gatheredData: {
    value: (x, y) => y ?? x,
    default: () => ({ news: [], financials: [], controversies: [] })
  },
  status: {
    value: (x, y) => y ?? x,
    default: () => ""
  },
  finalVerdict: {
    value: (x, y) => y ?? x,
    default: () => null
  }
};

const routeAfterIdentify = (state) => {
  if (state.status === "invalid_entity") {
    return END;
  }
  return "search_node";
};

const routeAfterSearch = (state) => {
  if (state.status === "search_failed") {
    return END;
  }
  return "gate_node";
};

const routeAfterGate = (state) => {
  if (state.status === "insufficient_data") {
    return END;
  }
  return "analyze_node";
};

// Build the graph
const builder = new StateGraph({ channels: agentState })
  .addNode("identify_node", identifyCompany)
  .addNode("search_node", executeSearch)
  .addNode("gate_node", checkDataSufficiency)
  .addNode("analyze_node", generateAnalysis)
  
  .addEdge(START, "identify_node")
  .addConditionalEdges("identify_node", routeAfterIdentify)
  .addConditionalEdges("search_node", routeAfterSearch)
  .addConditionalEdges("gate_node", routeAfterGate)
  .addEdge("analyze_node", END);

const graph = builder.compile();

export const runResearchAgent = async (companyName) => {
  console.log(`[Graph] Invoking graph for: ${companyName}`);
  
  const initialState = { companyName };
  
  const finalState = await graph.invoke(initialState);
  
  // Format the output for the frontend
  if (finalState.status === "invalid_entity") {
    return {
      verdict: "Strong Pass",
      confidence: 100,
      business_quality: ["Not a valid operating company (e.g. Crypto, Mutual Fund, etc)."],
      momentum: [],
      red_flags: [],
      sources: [],
      insufficient_data_reason: finalState.identityReasoning || "Invalid entity type."
    };
  }

  if (finalState.status === "insufficient_data") {
    return {
      verdict: "Insufficient Data",
      confidence: 0,
      business_quality: [],
      momentum: [],
      red_flags: [],
      sources: [],
      insufficient_data_reason: "Search results returned too little actionable information."
    };
  }

  if (finalState.status === "search_failed" || finalState.status === "analysis_failed") {
    throw new Error("Pipeline failed during execution.");
  }

  return finalState.finalVerdict;
};
