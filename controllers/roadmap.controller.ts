import type { Request, Response } from "express";
import { geminiRequest, extractGeminiText } from "../utils/gemini.ts";

const ROADMAP_SYSTEM_PROMPT = `You are a senior placement preparation expert at BeyondBasic. Your job is to generate a highly personalized, actionable placement preparation roadmap in valid JSON format only. Do not include any text, explanation, or markdown outside the JSON object.

The JSON must strictly follow this schema:
{
  "title": "string — a personalized, motivating roadmap title",
  "summary": "string — 2–3 sentence overview of the strategy",
  "totalDuration": "string — e.g. '8 weeks'",
  "weeklyHoursRequired": number,
  "phases": [
    {
      "phaseNumber": number,
      "phaseName": "string — e.g. 'Foundation', 'Core DSA', 'Interview Prep'",
      "duration": "string — e.g. 'Week 1–2'",
      "focusAreas": ["string"],
      "dailyPlan": [
        {
          "day": "string — e.g. 'Day 1–2' or 'Day 3'",
          "topic": "string",
          "tasks": ["string — specific, actionable task"],
          "estimatedHours": number
        }
      ],
      "milestone": "string — what the learner should be able to do at phase end"
    }
  ],
  "companySpecificTopics": ["string — must-know topic for the target company type"],
  "mockTestSchedule": ["string — when to take mock tests and what to focus on"],
  "keyTips": ["string — actionable, specific tips for the target role and company"]
}

Rules:
- Create exactly 3 phases for timelines under 2 months, and 4 phases for 2 months or more
- Each phase must have 4–6 daily plan entries
- Company-specific topics must be realistic and accurate (e.g. LLD, OOPs, DSA for product companies)
- Tips must be specific, not generic
- Return ONLY the JSON object. No markdown fences, no explanation.`;

export const generateRoadmap = async (req: Request, res: Response) => {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return res.status(503).json({ message: "GEMINI_API_KEY is not configured" });
    }

    const { companyType, timeline, skillLevel = "Beginner" } = req.body as {
      companyType: string;
      timeline: string;
      skillLevel?: string;
    };

    if (!companyType || !timeline) {
      return res.status(400).json({ message: "companyType and timeline are required" });
    }

    const userPrompt = `Generate a placement preparation roadmap for a student with these details:
- Target companies: ${companyType}
- Time until placement: ${timeline}
- Current skill level: ${skillLevel}

Make the roadmap realistic, specific, and actionable. Cover DSA, aptitude, core CS subjects, and company-specific preparation. For product companies include LLD/HLD. For service companies focus more on aptitude and communication.`;

    const payload = {
      system_instruction: { parts: [{ text: ROADMAP_SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    };

    const { status, body } = await geminiRequest(apiKey, "gemini-2.5-flash", payload);
    const data = JSON.parse(body);

    if (status !== 200 || data.error) {
      throw new Error(data.error?.message || `Gemini API returned status ${status}`);
    }

    const rawText = extractGeminiText(data);
    if (!rawText) throw new Error("Gemini returned empty content");

    let roadmap;
    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      roadmap = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse roadmap from AI response");
    }

    res.json({ roadmap });
  } catch (err: any) {
    console.error("Roadmap generation error:", err.message);
    res.status(500).json({ message: err.message || "Roadmap generation failed" });
  }
};
