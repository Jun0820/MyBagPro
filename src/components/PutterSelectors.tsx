import React from 'react';
import { SVGBox } from './SVGBox';
import { PutterHeadType, PutterNeckType } from '../types/golf';

interface PutterHeadSelectorProps {
    selected: PutterHeadType | null;
    onSelect: (value: PutterHeadType) => void;
}

export const PutterHeadSelector: React.FC<PutterHeadSelectorProps> = ({ selected, onSelect }) => {
    return (
        <div className="grid grid-cols-3 gap-3">
            <SVGBox active={selected === PutterHeadType.BLADE} label="ピン型" onClick={() => onSelect(PutterHeadType.BLADE)}>
                <svg viewBox="0 0 100 60" fill="currentColor" className="w-full h-full"><rect x="10" y="20" width="80" height="20" rx="2" /><rect x="15" y="10" width="5" height="15" /></svg>
            </SVGBox>
            <SVGBox active={selected === PutterHeadType.MALLET} label="マレット" onClick={() => onSelect(PutterHeadType.MALLET)}>
                <svg viewBox="0 0 100 60" fill="currentColor" className="w-full h-full"><path d="M 20 20 L 80 20 C 80 50 70 60 50 60 C 30 60 20 50 20 20" /></svg>
            </SVGBox>
            <SVGBox active={selected === PutterHeadType.NEO_MALLET} label="ネオマレット" onClick={() => onSelect(PutterHeadType.NEO_MALLET)}>
                <svg viewBox="0 0 100 60" fill="currentColor" className="w-full h-full"><path d="M 20 15 L 80 15 L 90 50 L 70 60 L 30 60 L 10 50 Z" /></svg>
            </SVGBox>
            {/* Adding more options or handling them if needed, but original used 3 main ones for visual. 
                Full logic might need mapping all enum values if desired, but sticking to original UI for now. */}
        </div>
    );
};

interface PutterNeckSelectorProps {
    selected: PutterNeckType | null;
    onSelect: (value: PutterNeckType) => void;
}

export const PutterNeckSelector: React.FC<PutterNeckSelectorProps> = ({ selected, onSelect }) => {
    return (
        <div className="grid grid-cols-3 gap-3">
            <SVGBox active={selected === PutterNeckType.CRANK} label="クランク" onClick={() => onSelect(PutterNeckType.CRANK)}>
                <svg viewBox="0 0 60 100" fill="none" stroke="currentColor" strokeWidth="6" className="w-full h-full"><path d="M 30 10 L 30 40 L 50 40 L 50 90" /></svg>
            </SVGBox>
            <SVGBox active={selected === PutterNeckType.BENT} label="ベント" onClick={() => onSelect(PutterNeckType.BENT)}>
                <svg viewBox="0 0 60 100" fill="none" stroke="currentColor" strokeWidth="6" className="w-full h-full"><path d="M 30 10 Q 50 30 40 60 L 45 90" /></svg>
            </SVGBox>
            <SVGBox active={selected === PutterNeckType.SHORT_SLANT} label="ショートスラント" onClick={() => onSelect(PutterNeckType.SHORT_SLANT)}>
                <svg viewBox="0 0 60 100" fill="none" stroke="currentColor" strokeWidth="6" className="w-full h-full"><path d="M 20 20 L 40 80" /></svg>
            </SVGBox>
        </div>
    );
};
