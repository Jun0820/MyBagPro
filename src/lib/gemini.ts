import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UserProfile } from '../types/golf';
import { TargetCategory } from '../types/golf';
import { generateAiPrompt } from './aiPromptGenerator';

export interface DiagnosisResult {
    result: any;
    groundingMetadata: null;
}

export const generateFittingDiagnosis = async (profile: UserProfile, apiKey: string) => {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please check your environment variables.");
    }

    console.log("Generating Production AI Diagnosis using Gemini API...");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Attempt with multiple model identifiers to be exhaustive.
    // Models listed in preference order. 
    // "gemini-1.5-flash" is the current standard name.
    const modelNames = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"];
    let lastError: any = null;

    for (const modelName of modelNames) {
        try {
            console.log(`Current attempt model: ${modelName}`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const prompt = generateAiPrompt(profile);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`Success with model: ${modelName}`);
            
            // JSON extraction and cleanup
            let jsonStr = text.trim();
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
            jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1'); 

            const diagnosisData = JSON.parse(jsonStr);

            const finalizedResult = {
                category: profile.targetCategory,
                type: profile.targetCategory === TargetCategory.BALL ? "BALL" : "CLUB", 
                ...diagnosisData,
                aiPromptText: prompt 
            };

            return { result: finalizedResult, groundingMetadata: null };
        } catch (error: any) {
            console.warn(`Model ${modelName} failed:`, error?.message || error);
            lastError = error;
            // Fallthrough to next model
        }
    }

    console.error("Critical: All Gemini models failed.", lastError);
    throw lastError || new Error("AI analysis failed with all attempted models.");
};
