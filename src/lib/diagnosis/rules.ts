import type { GolfIdFormData } from '../golfId';

export interface GolfIdDiagnosisResult {
  diagnosisType: string;
  currentStatus: string;
  priorityIssue: string;
  nextAction: string;
  notRecommendedNow: string;
  practiceSuggestion: string;
  gearSuggestion: string;
}

const includesAny = (value: string, keywords: string[]) => keywords.some((keyword) => value.includes(keyword));

export const generateDiagnosisResult = (profile: GolfIdFormData): GolfIdDiagnosisResult => {
  const averageScore = Number(profile.average_score);
  const headSpeed = Number(profile.head_speed);
  const issue = `${profile.current_issue} ${profile.weak_club}`.toLowerCase();

  if ((Number.isFinite(averageScore) && averageScore >= 100) || includesAny(issue, ['ob', 'スライス', '右', '曲がる'])) {
    return {
      diagnosisType: 'OB削減優先タイプ',
      currentStatus: 'スコアを崩している主因は、大きなミスやペナルティの可能性があります。',
      priorityIssue: 'ティーショットの安定',
      nextAction: '次のラウンドではOB数、ペナルティ数、ティーショットの左右傾向を記録しましょう。',
      notRecommendedNow: '高額ドライバーをすぐ買うより、まずはミスの方向と頻度の把握が優先です。',
      practiceSuggestion: '7割スイングでフェアウェイキープを狙う練習から始めましょう。',
      gearSuggestion: '寛容性の高いドライバー、短めのクラブ選択、つかまりすぎないシャフトを検討しましょう。',
    };
  }

  if (includesAny(issue, ['5i', '5番', 'ロングアイアン', '上がらない', '180', '200'])) {
    return {
      diagnosisType: 'ロングゲーム再設計タイプ',
      currentStatus: '180〜200ヤード前後の距離階段が難しくなっている可能性があります。',
      priorityIssue: '長い番手の高さと安定性',
      nextAction: '5I、UT、7Wのキャリーと総距離を比べ、無理なく高さが出る番手を残しましょう。',
      notRecommendedNow: 'プロと同じロングアイアン構成をそのまま真似る必要はありません。',
      practiceSuggestion: 'UTや7Wで同じテンポのハーフショットを打ち、キャリーのばらつきを確認しましょう。',
      gearSuggestion: '5Iを抜いてUTや7Wに置き換える構成を検討しましょう。',
    };
  }

  if (includesAny(issue, ['パター', '3パット', 'ショートパット', '距離感'])) {
    return {
      diagnosisType: 'パッティング安定タイプ',
      currentStatus: 'スコア改善の余地はグリーン上の再現性にありそうです。',
      priorityIssue: '距離感とショートパットの安定',
      nextAction: '次のラウンドでは3パット数と1m以内の成功率を記録しましょう。',
      notRecommendedNow: '形状だけでパターを買い替えるより、まずはミスの傾向を見ましょう。',
      practiceSuggestion: '1m、3m、7mの距離を決めて、毎回同じテンポで打つ練習がおすすめです。',
      gearSuggestion: 'ストロークに合うヘッド形状と長さを確認しましょう。',
    };
  }

  if (Number.isFinite(headSpeed) && headSpeed < 40) {
    return {
      diagnosisType: 'やさしさ重視セッティングタイプ',
      currentStatus: 'クラブの重さやロフトが合えば、無理なく高さと距離を作れる可能性があります。',
      priorityIssue: '球の上がりやすさと重量フロー',
      nextAction: 'ドライバー、FW、UT、アイアンのシャフト重量が急に重くなっていないか確認しましょう。',
      notRecommendedNow: 'ハードなプロ仕様シャフトを基準に選ぶのは避けましょう。',
      practiceSuggestion: 'ミート率を優先し、振り切れる重さで同じリズムを作りましょう。',
      gearSuggestion: '軽量シャフト、ロフト多めのFW/UT、やさしいアイアンを候補にしましょう。',
    };
  }

  return {
    diagnosisType: 'クラブ見直しバランスタイプ',
    currentStatus: 'スコア、悩み、クラブ構成を一緒に見ることで、次に直すべきポイントが見えやすくなります。',
    priorityIssue: '距離階段とミス傾向の整理',
    nextAction: '各番手のキャリー、総距離、主なミスを入力して、クラブ間のつながりを確認しましょう。',
    notRecommendedNow: '話題のクラブを単体で買うより、14本全体の役割から考えるのがおすすめです。',
    practiceSuggestion: '得意クラブを基準に、前後の番手との距離差を練習場で確認しましょう。',
    gearSuggestion: '不足している距離帯があれば、UT、FW、ウェッジ構成を見直しましょう。',
  };
};
