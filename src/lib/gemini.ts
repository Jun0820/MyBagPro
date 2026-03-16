import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UserProfile } from '../types/golf';
import { TargetCategory } from '../types/golf';
import { generateAiPrompt } from './aiPromptGenerator';

export interface DiagnosisResult {
    result: any;
    groundingMetadata: null;
    // final release candidate with robust retry
}

export const generateFittingDiagnosis = async (profile: UserProfile, apiKey: string) => {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please check your environment variables.");
    }

    console.log("Generating Production AI Diagnosis using Gemini API...");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Attempt with multiple model identifiers if one fails (handling 404 v1beta issues)
    const modelNames = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-1.5-flash-latest"];
    let lastError: any = null;

    for (const modelName of modelNames) {
        try {
            console.log(`Attempting with model: ${modelName}`);
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
            
            // JSON extraction logic
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
            console.warn(`Failed with model: ${modelName}. Error: ${error?.message || error}`);
            lastError = error;
            // Continue to next model
        }
    }

    // If all models failed
    console.error("All Gemini models failed to respond.", lastError);
    throw lastError || new Error("AI analysis failed with all attempted models.");
};
