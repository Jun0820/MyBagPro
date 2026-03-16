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
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const prompt = generateAiPrompt(profile);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // JSONを抽出し、クリーニングする堅牢なロジック
        let jsonStr = text.trim();
        
        // 正規表現で最初の { から最後の } までを取り出す
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        // AI特有の崩れ（末尾のカンマ、制御文字など）を最小限に補正
        jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1'); 

        const diagnosisData = JSON.parse(jsonStr);

        // 期待される構造が欠けている場合のフォールバック処理とメタデータの注入
        const finalizedResult = {
            category: profile.targetCategory,
            type: profile.targetCategory === TargetCategory.BALL ? "BALL" : "CLUB", 
            ...diagnosisData,
            aiPromptText: prompt // デバッグ用
        };

        return { result: finalizedResult, groundingMetadata: null };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
