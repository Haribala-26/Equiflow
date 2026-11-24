# Gemini API Integration Specification

## 1. Responsibilities

1. **Unstructured Field Report Parsing**: Extracting structured resource requirements (type, quantity, unit, urgency) from raw text.
2. **Missing Information & Contradiction Detection**: Flagging vague requests, unverified claims, or discrepancies.
3. **Plain-Language Explainability**: Summarizing why an area received a specific score and explaining allocation trade-offs.

## 2. Server-Side Security & Guardrails

- `GEMINI_API_KEY` is loaded exclusively in server environment variables and never sent to the client.
- **Strict Invariant**: Gemini outputs are treated as **suggestions only**. Gemini is strictly prohibited from modifying inventory or executing final allocations.
- All Gemini responses are validated against a strict Zod schema before display.

## 3. Resilience & Graceful Fallback

If the Gemini API key is missing, rate-limited, or fails:
- The backend activates `DeterministicAiFallback`.
- Keyword heuristic extractors identify resource mentions (e.g., "water", "food", "medical").
- The UI displays an amber notification: `"AI Advisor: Offline Mode — Heuristic extraction active"`.
- Priority calculations and resource allocations remain 100% operational.
