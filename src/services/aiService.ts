import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzePost(postData: any) {
  const prompt = `
    Analyze the following social media post and provide strategic insights.
    
    Post Data:
    ${JSON.stringify(postData, null, 2)}
    
    Return a JSON object with the following structure:
    {
      "key_insight": "string",
      "visual_hook": "string",
      "undeniable_proof": "string",
      "theme": "string",
      "hook_type": "string",
      "hook_score": number (1-10),
      "content_format": "string",
      "primary_emotion": "string",
      "problem_stated": "string",
      "solution_presented": "string",
      "call_to_action": "string",
      "brand_wedge": "string",
      "target_demographic": "string",
      "tone": "string",
      "estimated_retention": number,
      "ad_fatigue_signal": boolean,
      "trend_score": number (1-10),
      "strengths": ["string"],
      "improvement_opportunities": ["string"],
      "lessons_to_learn": ["string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  if (!response.text) {
    throw new Error('No response from Gemini');
  }

  return JSON.parse(response.text);
}

export async function analyzeComments(postData: any, comments: any[]) {
  const prompt = `
    Analyze the following social media post and its comments.
    
    Post Data:
    ${JSON.stringify(postData, null, 2)}
    
    Comments:
    ${JSON.stringify(comments.slice(0, 50), null, 2)} // Limit to 50 comments for context
    
    Return a JSON object with the following structure:
    {
      "comments_summary": "string",
      "comments_sentiment": "positive" | "negative" | "mixed" | "neutral",
      "comments_sentiment_breakdown": { "positive": number, "negative": number, "neutral": number },
      "comments_questions": ["string"],
      "comments_pain_points": ["string"],
      "comments_trend": ["string"],
      "audience_language": ["string"],
      "trust_signals": ["string"],
      "top_takes": ["string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  if (!response.text) {
    throw new Error('No response from Gemini');
  }

  return JSON.parse(response.text);
}

export async function generateScripts(postData: any, analysisData: any) {
  const prompt = `
    Based on the following viral social media post and its analysis, generate 3 new creative script concepts that evolve the original idea.
    
    Post Data:
    ${JSON.stringify(postData, null, 2)}
    
    Analysis:
    ${JSON.stringify(analysisData, null, 2)}
    
    Return a JSON array containing 3 objects, each with the following structure:
    {
      "concept_name": "string",
      "inspiration_source": "string",
      "hook_visual": "string",
      "hook_voiceover": "string",
      "body_script": "string",
      "body_visual_notes": "string",
      "proof_element": "string",
      "cta_text": "string",
      "cta_visual": "string",
      "hook_variant_a": "string",
      "hook_variant_b": "string",
      "hook_variant_c": "string",
      "why_it_works": "string",
      "target_emotion": "string",
      "estimated_format": "string",
      "recommended_platform": "string",
      "recommended_length": "string"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  if (!response.text) {
    throw new Error('No response from Gemini');
  }

  return JSON.parse(response.text);
}
