import { z } from "zod";

const InvestmentVerdictSchema = z.object({
  verdict: z.enum([
    "Strong Invest",
    "Lean Invest",
    "Neutral",
    "Lean Pass",
    "Strong Pass",
    "Insufficient Data"
  ]),
  confidence: z.number().min(0).max(100).describe("Confidence score from 0 to 100"),
  is_listed: z.boolean().describe("True if the company is publicly listed on a stock exchange"),
  business_quality: z.array(z.string()).describe("2-3 bullet points on moat, differentiation, and market position"),
  momentum: z.array(z.string()).describe("2-3 bullet points on recent trajectory, news tone, and growth signals"),
  red_flags: z.array(z.string()).describe("2-3 bullet points on lawsuits, regulatory trouble, or financial distress"),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string()
    })
  ).describe("Sources cited during the research process"),
  insufficient_data_reason: z.string().optional().describe("If verdict is 'Insufficient Data', provide the reason here"),
  resolved_name: z.string().optional().describe("The actual company name this analysis is about, if different from user input")
});

export { InvestmentVerdictSchema };
