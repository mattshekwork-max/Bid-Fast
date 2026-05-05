import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface LeadContext {
  name: string;
  company: string;
  message: string;
}

export interface UrgencyClassification {
  urgency_score: number;
  urgency_reason: string;
  intent: "quote" | "booking" | "info" | "complaint" | "other";
  action_needed: string;
  suggested_destination: string;
}

const DEFAULT_CLASSIFICATION: UrgencyClassification = {
  urgency_score: 5,
  urgency_reason: "Classification unavailable — using default",
  intent: "other",
  action_needed: "Manual review required",
  suggested_destination: "general_queue",
};

const SYSTEM_PROMPT = `You are an urgency classifier for a small service business CRM.
Analyze the lead's message and classify its urgency and intent.

You MUST respond with valid JSON only — no markdown, no explanation outside JSON.

JSON schema:
{
  "urgency_score": <integer 1-10>,
  "urgency_reason": "<brief reason for the score>",
  "intent": "<quote|booking|info|complaint|other>",
  "action_needed": "<what the business should do next>",
  "suggested_destination": "<who or what queue should handle this>"
}

Rules:
- urgency_score 1-3: Low — general inquiry, info request, no timeline pressure
- urgency_score 4-6: Medium — interested but not urgent, browsing
- urgency_score 7-8: High — needs quote soon, scheduling request, time-sensitive
- urgency_score 9-10: Critical — emergency, complaint, about to churn, hot lead ready to buy
- intent must be one of: quote, booking, info, complaint, other
- suggested_destination should be: owner|sales|support|general_queue|emergency
- Be concise. urgency_reason should be 1-2 sentences max.`;

export async function classifyUrgency(
  leadContext: LeadContext
): Promise<UrgencyClassification> {
  try {
    const userMessage = `Lead details:
Name: ${leadContext.name}
Company: ${leadContext.company}
Message: ${leadContext.message}

Classify this lead's urgency and intent. Respond with JSON only.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await groq.chat.completions.create(
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[Groq] Empty response content");
      return DEFAULT_CLASSIFICATION;
    }

    const parsed = JSON.parse(content);

    // Validate and clamp urgency_score
    const urgency_score = Math.max(1, Math.min(10, Math.round(Number(parsed.urgency_score) || 5)));
    const validIntents = ["quote", "booking", "info", "complaint", "other"] as const;
    const intent = validIntents.includes(parsed.intent) ? parsed.intent : "other";

    return {
      urgency_score,
      urgency_reason: String(parsed.urgency_reason || DEFAULT_CLASSIFICATION.urgency_reason),
      intent,
      action_needed: String(parsed.action_needed || DEFAULT_CLASSIFICATION.action_needed),
      suggested_destination: String(parsed.suggested_destination || DEFAULT_CLASSIFICATION.suggested_destination),
    };
  } catch (error) {
    console.error("[Groq] Classification failed:", error);
    return DEFAULT_CLASSIFICATION;
  }
}