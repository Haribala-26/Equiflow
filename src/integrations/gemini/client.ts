import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiAssessmentOutput, AiAssessmentOutputSchema } from "./schema";

/**
 * Deterministic rule-based fallback when Gemini API is offline or unconfigured.
 */
export function runDeterministicAiFallback(
  reportText: string,
  reason = "Gemini API key not configured or offline"
): AiAssessmentOutput {
  const text = reportText.toLowerCase();

  const suggestedNeeds: AiAssessmentOutput["suggestedNeeds"] = [];
  const missingInfo: string[] = [];

  // Keyword-based heuristic extraction
  if (text.includes("water") || text.includes("drinking") || text.includes("thirsty")) {
    suggestedNeeds.push({
      resourceType: "water",
      quantity: text.includes("severe") ? 5000 : 2000,
      unit: "litres",
      confidence: "medium",
      evidence: "Keywords detected: drinking water shortages mentioned",
    });
  }

  if (text.includes("food") || text.includes("hunger") || text.includes("starv") || text.includes("meal")) {
    suggestedNeeds.push({
      resourceType: "food",
      quantity: 1000,
      unit: "packs",
      confidence: "medium",
      evidence: "Keywords detected: food/ration requests found in report",
    });
  }

  if (text.includes("medic") || text.includes("injur") || text.includes("fever") || text.includes("wound") || text.includes("first aid")) {
    suggestedNeeds.push({
      resourceType: "medical",
      quantity: 200,
      unit: "kits",
      confidence: "high",
      evidence: "Keywords detected: medical triage or injury reported",
    });
  }

  if (text.includes("shelter") || text.includes("submerg") || text.includes("roof") || text.includes("house") || text.includes("collapse")) {
    suggestedNeeds.push({
      resourceType: "shelter",
      quantity: 150,
      unit: "kits",
      confidence: "medium",
      evidence: "Keywords detected: structural damage or shelter loss reported",
    });
  }

  if (text.includes("hygiene") || text.includes("soap") || text.includes("sanit") || text.includes("sewage")) {
    suggestedNeeds.push({
      resourceType: "hygiene",
      quantity: 300,
      unit: "kits",
      confidence: "medium",
      evidence: "Keywords detected: sanitation or hygiene kit needs mentioned",
    });
  }

  // Derive suggested severity & urgency heuristics
  let severity = 60;
  let urgency = 60;

  if (text.includes("critical") || text.includes("immediate") || text.includes("drowning") || text.includes("trapped")) {
    severity = 90;
    urgency = 95;
  } else if (text.includes("severe") || text.includes("overflow") || text.includes("heavy")) {
    severity = 80;
    urgency = 80;
  } else if (text.includes("minor") || text.includes("receding") || text.includes("stable")) {
    severity = 40;
    urgency = 35;
  }

  if (!text.match(/\d+/)) {
    missingInfo.push("No specific numbers or household quantities provided in field report.");
  }
  if (!text.includes("street") && !text.includes("ward") && !text.includes("nagar") && !text.includes("road")) {
    missingInfo.push("Exact street or ward location landmarks are missing.");
  }

  return {
    summary: `Heuristic assessment: ${reportText.slice(0, 150)}...`,
    suggestedNeeds,
    missingInformation: missingInfo,
    contradictions: [],
    suggestedSeverity: severity,
    suggestedUrgency: urgency,
    explanation: `Deterministic Fallback active (${reason}). Needs estimated using keyword pattern recognition. Human coordinator review required.`,
    isFallback: true,
    fallbackReason: reason,
  };
}

/**
 * Assesses an emergency field report using Google Gemini API with fallback protection.
 */
export async function assessEmergencyReport(reportText: string): Promise<AiAssessmentOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return runDeterministicAiFallback(reportText, "GEMINI_API_KEY not configured in environment");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const systemPrompt = `You are EQUIFLOW's Responsible AI Emergency Logistics Assistant.
Analyze this disaster field report for Chennai emergency coordinators.
Extract resource needs, estimate severity/urgency (0-100), identify missing information and contradictions.
You MUST return ONLY valid JSON matching this schema:
{
  "summary": "Concise 1-2 sentence overview",
  "suggestedNeeds": [
    {
      "resourceType": "food" | "water" | "medical" | "shelter" | "hygiene",
      "quantity": number,
      "unit": "packs" | "litres" | "kits",
      "confidence": "high" | "medium" | "low",
      "evidence": "Quoted phrase from text"
    }
  ],
  "missingInformation": ["List of missing operational data points"],
  "contradictions": ["List of any conflicting statements in the text"],
  "suggestedSeverity": number (0-100),
  "suggestedUrgency": number (0-100),
  "explanation": "Rationale for human review"
}`;

    const prompt = `${systemPrompt}\n\nFIELD REPORT TO ASSESS:\n"""${reportText}"""`;

    // 10 second timeout guard
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out after 10s")), 10000)
    );

    const apiPromise = model.generateContent(prompt);
    const result = await Promise.race([apiPromise, timeoutPromise]);
    const responseText = result.response.text();

    const parsed = JSON.parse(responseText);
    const validated = AiAssessmentOutputSchema.parse({
      ...parsed,
      isFallback: false,
    });

    return validated;
  } catch (error: any) {
    console.warn("Gemini API Assessment error, falling back to deterministic heuristic:", error?.message || error);
    return runDeterministicAiFallback(reportText, error?.message || "Gemini API execution failed");
  }
}
