import React from 'react';

interface LegalPageProps {
    onClose: () => void;
    type: 'privacy' | 'terms';
}

export const LegalPage: React.FC<LegalPageProps> = ({ onClose, type }) => {
    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                <div className="bg-trust-navy text-white p-6">
                    <h2 className="text-2xl font-bold">
                        {type === 'privacy' ? 'プライバシーポリシー' : '利用規約'}
                    </h2>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh] text-sm text-slate-700 leading-relaxed">
                    {type === 'privacy' ? <PrivacyPolicyContent /> : <TermsContent />}
                </div>
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-trust-navy text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

const PrivacyPolicyContent = () => (
    <div className="space-y-6">
        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">1. はじめに</h3>
            <p>
                My Bag Pro（以下「本サービス」）は、個人情報の保護に関する法律（個人情報保護法）を遵守し、
                お客様の個人情報を適切に取り扱います。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">2. 収集する情報</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>お名前、メールアドレス（アカウント登録時）</li>
                <li>年齢、性別、身長（診断の精度向上のため）</li>
                <li>ゴルフに関する情報（使用クラブ、スイングデータ等）</li>
                <li>診断履歴</li>
            </ul>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">3. 利用目的</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>ゴルフ用品の診断・推奨サービスの提供</li>
                <li>サービスの改善・新機能の開発</li>
                <li>お問い合わせへの対応</li>
                <li>統計データの作成（個人を特定しない形式）</li>
            </ul>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">4. 第三者提供</h3>
            <p>
                お客様の同意なく、個人情報を第三者に提供することはありません。
                ただし、法令に基づく場合を除きます。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">5. 安全管理措置</h3>
            <p>
                個人情報への不正アクセス、紛失、破壊、改ざん、漏洩を防ぐため、
                適切な技術的・組織的安全管理措置を講じます。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">6. 開示・訂正・削除</h3>
            <p>
                お客様は、ご自身の個人情報の開示、訂正、削除を請求する権利を有します。
                ご希望の場合は、お問い合わせフォームよりご連絡ください。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">7. Cookieの使用</h3>
            <p>
                本サービスでは、ユーザー体験向上のためにCookieを使用する場合があります。
                ブラウザの設定により、Cookieを無効にすることが可能です。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">8. お問い合わせ</h3>
            <p>
                個人情報の取り扱いに関するお問い合わせは、サービス内のお問い合わせフォームよりご連絡ください。
            </p>
        </section>

        <p className="text-xs text-slate-400 mt-6">最終更新日: 2026年2月2日</p>
    </div>
);

const TermsContent = () => (
    <div className="space-y-6">
        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">第1条（適用）</h3>
            <p>
                本規約は、My Bag Pro（以下「本サービス」）の利用に関する条件を定めるものです。
                ユーザーは、本規約に同意の上、本サービスをご利用ください。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">第2条（サービス内容）</h3>
            <p>
                本サービスは、AIを活用したゴルフ用品の診断・推奨サービスを提供します。
                診断結果は参考情報であり、購入の最終決定はユーザー自身の判断で行ってください。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">第3条（利用料金）</h3>
            <p>
                本サービスの基本機能は無料でご利用いただけます。
                将来的に有料機能を提供する場合は、事前にお知らせいたします。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">第4条（禁止事項）</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>他のユーザーまたは第三者の権利を侵害する行為</li>
                <li>虚偽の情報を登録する行為</li>
                <li>本サービスを商業目的で使用する行為（許可なく）</li>
            </ul>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">第5条（免責事項）</h3>
            <p>
                本サービスが提供する診断結果はAIによる参考情報であり、
                その正確性・完全性を保証するものではありません。
                診断結果に基づく購入・使用については、ユーザー自身の責任で行ってください。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">第6条（サービスの変更・中止）</h3>
            <p>
                当社は、事前の通知なく本サービスの内容を変更、または提供を中止することがあります。
                これによりユーザーに損害が生じた場合でも、当社は責任を負いません。
            </p>
        </section>

        <section>
            <h3 className="font-bold text-lg text-trust-navy mb-2">第7条（準拠法・管轄）</h3>
            <p>
                本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
        </section>

        <p className="text-xs text-slate-400 mt-6">最終更新日: 2026年2月2日</p>
    </div>
);

export default LegalPage;
