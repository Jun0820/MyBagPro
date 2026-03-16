import { type ClubSetting, type TargetCategory } from '../types/golf';
import pako from 'pako';

interface SharedBagData {
    n: string; // name
    i?: string; // instagram
    x?: string; // x
    h: number; // headspeed
    b: string; // ball
    c: Array<{
        cat: string;
        br: string;
        mo: string;
        l: string;
        sh: string;
        fl: string; // flex
        nu: string; // number
        di: string;
    }>;
}

export const encodeBagData = (
    name: string,
    sns: { instagram?: string; x?: string },
    setting: ClubSetting,
    headSpeed: number
): string => {
    const data: SharedBagData = {
        n: name,
        i: sns.instagram,
        x: sns.x,
        h: headSpeed,
        b: setting.ball,
        c: setting.clubs.map(club => ({
            cat: club.category,
            br: club.brand,
            mo: club.model,
            l: club.loft,
            sh: club.shaft,
            fl: club.flex,
            nu: club.number,
            di: club.distance
        }))
    };

    try {
        const json = JSON.stringify(data);
        const compressed = pako.deflate(json);
        // Use base64url encoding
        const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        return base64;
    } catch (e) {
        console.error("Encoding error", e);
        return "";
    }
};

export const decodeBagData = (encoded: string): { 
    name: string, 
    sns: { instagram?: string, x?: string }, 
    setting: ClubSetting, 
    headSpeed: number 
} | null => {
    try {
        // base64url to base64
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        const decompressed = pako.inflate(bytes, { to: 'string' });
        const data: SharedBagData = JSON.parse(decompressed);

        return {
            name: data.n,
            sns: { instagram: data.i, x: data.x },
            setting: {
                ball: data.b,
                clubs: data.c.map((club, idx) => ({
                    id: `shared-${idx}`,
                    category: club.cat as TargetCategory,
                    brand: club.br,
                    model: club.mo,
                    loft: club.l,
                    shaft: club.sh,
                    flex: club.fl || '',
                    number: club.nu || '',
                    distance: club.di
                }))
            },
            headSpeed: data.h
        };
    } catch (e) {
        console.error("Decoding error", e);
        return null;
    }
};
