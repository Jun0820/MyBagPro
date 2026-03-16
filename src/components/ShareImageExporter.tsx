import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { Share, Check, Loader2 } from 'lucide-react';

interface ShareImageExporterProps {
    targetId: string;
    fileName?: string;
    buttonText?: string;
    className?: string;
}

export const ShareImageExporter: React.FC<ShareImageExporterProps> = ({
    targetId,
    fileName = 'my-bag-pro-export.png',
    buttonText = 'SNS用画像を生成',
    className = ''
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleExport = async () => {
        const element = document.getElementById(targetId);
        if (!element) {
            console.error('Target element not found:', targetId);
            return;
        }

        setIsGenerating(true);
        try {
            // Wait a bit for any animations to settle
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2, // Better quality
                backgroundColor: null,
                logging: false,
                onclone: (clonedDoc) => {
                    // You can modify the cloned element here for the export
                    const clonedElement = clonedDoc.getElementById(targetId);
                    if (clonedElement) {
                        clonedElement.style.padding = '20px';
                        clonedElement.style.borderRadius = '0';
                    }
                }
            });

            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();

            setIsDone(true);
            setTimeout(() => setIsDone(false), 3000);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isGenerating}
            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95
                ${isGenerating 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : isDone 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                }
                ${className}
            `}
        >
            {isGenerating ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    生成中...
                </>
            ) : isDone ? (
                <>
                    <Check size={18} />
                    保存しました
                </>
            ) : (
                <>
                    <Share size={18} />
                    {buttonText}
                </>
            )}
        </button>
    );
};
