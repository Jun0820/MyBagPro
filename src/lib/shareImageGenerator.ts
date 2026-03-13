import { type Club, TargetCategory } from '../types/golf';

// ===== Utility Functions =====
const getCatShort = (cat: string) => {
    switch (cat) {
        case TargetCategory.DRIVER: return '1W';
        case TargetCategory.FAIRWAY: return 'FW';
        case TargetCategory.UTILITY: return 'UT';
        case TargetCategory.IRON: return 'IRON';
        case TargetCategory.WEDGE: return 'WDG';
        case TargetCategory.PUTTER: return 'PT';
        default: return '—';
    }
};

const parseShaft = (shaft: string) => {
    const parts = shaft.trim().split(' ');
    if (parts.length >= 3) {
        const flex = parts[parts.length - 1];
        const weight = parts[parts.length - 2];
        const model = parts.slice(0, parts.length - 2).join(' ');
        return { model, weight, flex };
    } else if (parts.length === 2) {
        return { model: parts[0], weight: '', flex: parts[1] };
    }
    return { model: shaft, weight: '', flex: '' };
};

const getCatColor = (cat: string) => {
    switch (cat) {
        case TargetCategory.DRIVER: return '#10b981';
        case TargetCategory.FAIRWAY: return '#059669';
        case TargetCategory.UTILITY: return '#14b8a6';
        case TargetCategory.IRON: return '#3b82f6';
        case TargetCategory.WEDGE: return '#6366f1';
        case TargetCategory.PUTTER: return '#64748b';
        default: return '#94a3b8';
    }
};

// ===== ② Rory-Style Bag Image (1080×1350) =====
export interface BagImageOptions {
    transparent?: boolean;
}

export const generateBagImage = async (
    clubs: Club[],
    _ball: string,
    _headSpeed: number,
    userName: string = 'GOLFER',
    bgImageDataUrl?: string,
    options: BagImageOptions = {}
): Promise<string> => {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // 1. Background Image or Default Gradient
    if (!options.transparent) {
        if (bgImageDataUrl) {
            try {
                const img = new Image();
                img.src = bgImageDataUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
                // Cover style
                const imgRatio = img.width / img.height;
                const canvasRatio = W / H;
                let drawW, drawH, drawX, drawY;
                if (imgRatio > canvasRatio) {
                    drawH = H;
                    drawW = H * imgRatio;
                    drawX = (W - drawW) / 2;
                    drawY = 0;
                } else {
                    drawW = W;
                    drawH = W / imgRatio;
                    drawX = 0;
                    drawY = (H - drawH) / 2;
                }
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } catch (e) {
                console.error("Failed to load bg image", e);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, 0, W, H);
            }
        } else {
            const grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(1, '#1e293b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }
    } else {
        // Transparent mode: Clear canvas explicitly (though it should be clear by default)
        ctx.clearRect(0, 0, W, H);
    }

    // 2. Left Overlay (Sidebar)
    // In transparent mode, we make it slightly more translucent but still visible enough to read text
    ctx.fillStyle = options.transparent ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(0, 0, 240, H);

    // 3. Logo (Top Left)
    ctx.beginPath();
    ctx.arc(120, 100, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('MBP', 120, 112);

    // 4. Headline (Top Right-ish area)
    if (!options.transparent) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 72px Inter, sans-serif';
    const displayName = userName.toUpperCase();
    ctx.fillText(`${displayName}'S DISTANCES`, 270, 100);

    // Sub-headline
    ctx.shadowBlur = 0;
    ctx.font = 'bold 24px Inter, sans-serif';
    const subText = 'STOCK YARDAGES (MY BAG PRO)';
    const subW = ctx.measureText(subText).width;
    ctx.fillStyle = '#000000';
    ctx.fillRect(270, 125, subW + 40, 45);
    ctx.fillStyle = '#ff0000';
    ctx.fillText(subText, 290, 155);

    // 5. Vertical List of Distances
    const listClubs = clubs.filter(c => c.distance).slice(0, 14);
    const itemHeight = 75;
    const startY = 250;

    listClubs.forEach((c, i) => {
        const y = startY + (i * itemHeight);
        
        // Red Bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(120, y - 45, 250, 70);

        // Black Circle (Club Label)
        ctx.beginPath();
        ctx.arc(120, y - 10, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const cat = getCatShort(c.category);
        ctx.fillText(cat, 120, y - 2);

        // Distance Text
        ctx.textAlign = 'left';
        ctx.font = 'bold 54px "Teko", sans-serif'; // Using generic bold if Teko not available
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.distance, 175, y + 8);

        // "YARDS" Label
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillStyle = options.transparent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)';
        const distW = ctx.measureText(c.distance).width;
        ctx.fillText('YARDS', 175 + distW + 110, y + 5);
    });

    // 6. Watermark
    ctx.textAlign = 'right';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = options.transparent ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)';
    ctx.fillText('mybagpro.jp', W - 60, H - 40);

    return canvas.toDataURL('image/png');
};

// ===== ③ Per-Club Telop Image (1920×200, Transparent BG) =====
export const generateClubTelop = (club: Club): string => {
    const W = 1920;
    const H = 200;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Semi-transparent dark background (lower third style)
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(15,23,42,0.0)');
    grad.addColorStop(0.3, 'rgba(15,23,42,0.85)');
    grad.addColorStop(1, 'rgba(15,23,42,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Left accent bar
    const color = getCatColor(club.category);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 6, H);

    // Category badge
    const catLabel = getCatShort(club.category);
    const loft = club.loft ? ` ${club.loft}` : '';
    const badgeText = `${catLabel}${loft}`;
    ctx.fillStyle = color;
    roundRect(ctx, 40, 60, Math.max(ctx.measureText(badgeText).width + 40, 100), 44, 8);
    ctx.fill();
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, 60, 90);

    // Head (brand + model)
    const headText = `${club.brand} ${club.model}`.trim();
    ctx.font = 'bold 36px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(headText, 180, 92);

    // Shaft info
    const s = parseShaft(club.shaft);
    const shaftLine = [s.model, s.weight, s.flex].filter(Boolean).join(' / ');
    ctx.font = '20px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(shaftLine, 180, 135);

    // Distance (right side)
    if (club.distance) {
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'right';
        ctx.fillText(club.distance, W - 80, 95);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('CARRY', W - 80, 130);
        ctx.textAlign = 'left';
    }

    // My Bag Pro watermark (small, bottom right)
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'right';
    ctx.fillText('mybagpro.jp', W - 40, H - 20);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
};

// ===== Helper: Round Rect =====
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}
