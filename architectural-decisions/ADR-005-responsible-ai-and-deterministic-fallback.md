# ADR-005: Responsible AI with Deterministic Heuristic Fallback

## Status
**Accepted**

## Context
Field reports during disasters are submitted as unstructured text, SMS, or voice transcripts. While LLMs (Google Gemini) excel at extracting entities, relying on external cloud APIs creates a critical vulnerability: network blackouts during cyclones or floods could render the platform inoperable. Furthermore, autonomous AI dispatch introduces liability.

## Decision
1. **Responsible AI Extraction**: Gemini 2.5 Flash parses unstructured narrative reports into structured needs, severity, and urgency.
2. **Deterministic Heuristic Fallback**: If the API key is missing, network is down, or the model times out, the system automatically switches to an internal regex and keyword-based extractor with zero user downtime.
3. **Mandatory Human-in-the-Loop**: Extracted items are staged as *suggestions*. An Emergency Coordinator must review, edit, or reject suggestions. AI cannot autonomously dispatch trucks.

## Consequences
- **Positive**: Complete fault tolerance during communications blackouts.
- **Positive**: High safety and institutional trust through mandatory human sign-off.
