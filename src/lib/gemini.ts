import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UserProfile } from '../types/golf';
import { TargetCategory } from '../types/golf';
import { generateAiPrompt, generateBallAiPrompt } from './aiPromptGenerator';
import { validateBallDiagnosisPayload, validateClubDiagnosisPayload } from './diagnosisCandidates';

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

            const isBall = profile.targetCategory === TargetCategory.BALL;
            const prompt = isBall ? generateBallAiPrompt(profile) : generateAiPrompt(profile);

            const parseAndValidate = async (inputPrompt: string) => {
                const result = await model.generateContent(inputPrompt);
                const response = await result.response;
                const text = response.text();

                let jsonStr = text.trim();
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
                jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1');

                const diagnosisData = JSON.parse(jsonStr);

                return isBall
                    ? validateBallDiagnosisPayload(diagnosisData)
                    : validateClubDiagnosisPayload(profile, diagnosisData);
            };

            let diagnosisData;
            try {
                diagnosisData = await parseAndValidate(prompt);
            } catch (validationError: any) {
                console.warn(`Validation retry for model ${modelName}:`, validationError?.message || validationError);
                const retryPrompt = `${prompt}

### 【再出力指示】
前回の出力には、候補外の名前または正式名称ではない表記が含まれていました。
- 候補リストにある正式名称だけを使ってください
- brand / modelName / shafts / recommendedBall.name / alternatives[].name を候補リストと完全一致で出してください
- 候補外の名前を出すくらいなら、必ず候補リストの中から最も近いものを選んでください
- 出力はJSONのみ`;
                diagnosisData = await parseAndValidate(retryPrompt);
            }

            console.log(`Success with model: ${modelName}`);

            const finalizedResult = {
                category: profile.targetCategory,
                type: isBall ? "BALL" : "CLUB", 
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
