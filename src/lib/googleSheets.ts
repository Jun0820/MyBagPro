// Google Sheets Integration for Customer Data Collection
// Spreadsheet ID: 124C9OajqAAH8tAOkMEjAcOTVL_q49bgpIToixFRcKhQ

import { type UserProfile } from '../types/golf';

// Spreadsheet ID for reference (used in Apps Script, not directly in frontend)
// const SPREADSHEET_ID = '124C9OajqAAH8tAOkMEjAcOTVL_q49bgpIToixFRcKhQ';

// Google Apps Script Web App URL - ユーザーが自分でデプロイする必要があります
// この変数は環境変数で設定するか、デプロイ後に更新してください
const APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

export interface CustomerData {
    timestamp: string;
    name: string;
    email: string;
    age: string;
    gender: string;
    skillLevel: string;
    headSpeed: number;
    targetCategory: string;
    currentBrand: string;
    currentModel: string;
    diagnosisMode: string;
    hasMeasurementData: boolean;
    measurementData?: string;
    consentGiven: boolean;
}

/**
 * ユーザープロファイルを顧客データ形式に変換
 */
export const convertProfileToCustomerData = (
    profile: UserProfile,
    email: string,
    consentGiven: boolean
): CustomerData => {
    return {
        timestamp: new Date().toISOString(),
        name: profile.name || '未入力',
        email: email,
        age: profile.age || '未入力',
        gender: profile.gender || '未入力',
        skillLevel: profile.skillLevel || '未入力',
        headSpeed: profile.headSpeed,
        targetCategory: profile.targetCategory || '未選択',
        currentBrand: profile.currentBrand || '未入力',
        currentModel: profile.currentModel || '未入力',
        diagnosisMode: profile.diagnosisMode,
        hasMeasurementData: profile.hasMeasurementData,
        measurementData: profile.hasMeasurementData
            ? JSON.stringify(profile.measurementData)
            : undefined,
        consentGiven: consentGiven
    };
};

/**
 * Google Apps Script経由でスプレッドシートにデータを送信
 * 
 * 注意: この機能を使用するには、以下の手順が必要です:
 * 1. Google Apps Scriptでウェブアプリを作成
 * 2. 以下のコードをApps Scriptにデプロイ
 * 3. デプロイしたURLを環境変数 VITE_GOOGLE_APPS_SCRIPT_URL に設定
 */
export const sendToGoogleSheets = async (data: CustomerData): Promise<boolean> => {
    if (!APPS_SCRIPT_URL) {
        console.warn('Google Apps Script URL is not configured. Skipping data submission.');
        // 開発時はローカルストレージに保存
        saveToLocalStorage(data);
        return true;
    }

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // CORS制約を回避
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        // no-corsモードではレスポンスが読めないので、エラーがなければ成功とみなす
        console.log('Data sent to Google Sheets successfully');
        return true;
    } catch (error) {
        console.error('Failed to send data to Google Sheets:', error);
        // フォールバック: ローカルストレージに保存
        saveToLocalStorage(data);
        return false;
    }
};

/**
 * ローカルストレージにバックアップ保存
 */
const saveToLocalStorage = (data: CustomerData) => {
    const key = 'mybagpro_customer_data_backup';
    const existing = localStorage.getItem(key);
    const dataArray = existing ? JSON.parse(existing) : [];
    dataArray.push(data);
    localStorage.setItem(key, JSON.stringify(dataArray));
    console.log('Data saved to localStorage as backup');
};

/**
 * Google Apps Script用のコード（参考用）
 * このコードをGoogle Apps Scriptにコピーしてデプロイしてください
 */
export const GOOGLE_APPS_SCRIPT_CODE = `
// Google Apps Script Code for My Bag Pro
// このコードをGoogle Apps Scriptにコピーしてウェブアプリとしてデプロイしてください

const SPREADSHEET_ID = '124C9OajqAAH8tAOkMEjAcOTVL_q49bgpIToixFRcKhQ';
const SHEET_NAME = 'CustomerData';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // シートがなければ作成
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // ヘッダー行を追加
      sheet.appendRow([
        'タイムスタンプ',
        '名前',
        'メールアドレス',
        '年齢',
        '性別',
        'スキルレベル',
        'ヘッドスピード',
        '診断カテゴリ',
        '現在のブランド',
        '現在のモデル',
        '診断モード',
        '計測データあり',
        '計測データ詳細',
        '同意'
      ]);
    }
    
    // データ行を追加
    sheet.appendRow([
      data.timestamp,
      data.name,
      data.email,
      data.age,
      data.gender,
      data.skillLevel,
      data.headSpeed,
      data.targetCategory,
      data.currentBrand,
      data.currentModel,
      data.diagnosisMode,
      data.hasMeasurementData ? 'はい' : 'いいえ',
      data.measurementData || '',
      data.consentGiven ? '同意済み' : '未同意'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('My Bag Pro - Data Collection API');
}
`;
