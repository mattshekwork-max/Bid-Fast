import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface LeadContext {
  name: string;
  company: string;
  message: string;
}

export interface LeadSummary {
  summary: string;
  subject_line: string;
  suggested_reply: string;
}

const DEFAULT_SUMMARY: LeadSummary = {
  summary: "Summary unavailable — manual review required",
  subject_line: "New lead requires review",
  suggested_reply: "Thank you for reaching out! We'll review your message and get back to you shortly.",
};

const SYSTEM_PROMPT = `You are a CRM assistant for small service businesses.
Summarize the lead's message and draft a concise reply.

Rules:
- summary: 1-2 sentence summary of what the lead wants
- subject_line: short subject for the CRM card, max 60 chars
- suggested_reply: professional reply to send back, MUST be under 280 characters
- Be friendly but professional
- Tailor the reply to what the lead is asking about
- If it's a complaint, be empathetic and acknowledge the issue

Respond with valid JSON only:
{
  "summary": "<1-2 sentence summary>",
  "subject_line": "<short subject, max 60 chars>",
  "suggested_reply": "<under 280 chars>"
}`;

export async function summarizeLead(
  leadContext: LeadContext
): Promise<LeadSummary> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    });

    const userMessage = `Lead details:
Name: ${leadContext.name}
Company: ${leadContext.company}
Message: ${leadContext.message}

Summarize this lead and draft a reply. Respond with JSON only.`;

    const contents: Content[] = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "I understand. I will respond with valid JSON containing summary, subject_line, and suggested_reply." }] },
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const result = await Promise.race([
      model.generateContent({ contents }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out")), 15000)
      ),
    ]);

    const text = result.response.text();
    if (!text) {
      console.error("[Gemini] Empty response text");
      return DEFAULT_SUMMARY;
    }

    const parsed = JSON.parse(text);

    // Enforce 280 char limit on suggested_reply
    let suggested_reply = String(parsed.suggested_reply || DEFAULT_SUMMARY.suggested_reply);
    if (suggested_reply.length > 280) {
      suggested_reply = suggested_reply.substring(0, 277) + "...";
    }

    // Enforce 60 char limit on subject_line
    let subject_line = String(parsed.subject_line || DEFAULT_SUMMARY.subject_line);
    if (subject_line.length > 60) {
      subject_line = subject_line.substring(0, 57) + "...";
    }

    return {
      summary: String(parsed.summary || DEFAULT_SUMMARY.summary),
      subject_line,
      suggested_reply,
    };
  } catch (error) {
    console.error("[Gemini] Summarization failed:", error);
    return DEFAULT_SUMMARY;
  }
}