import React from 'react';
import { TargetCategory } from '../types/golf';

interface RadarChartProps {
    data: { axis1: number; axis2: number; axis3: number; axis4: number; axis5: number };
    category: TargetCategory | string | null;
    color?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, category, color = "#0f172a" }) => {
    // Configuration
    const size = 200;
    const center = size / 2;
    const radius = 55; // Increased radius for larger chart
    const angles = [-90, -18, 54, 126, 198]; // Top starts at -90deg

    // Determine Labels and Max Value based on Category
    let labels = ["飛距離", "寛容性", "操作性", "打感", "安定性"];
    let maxValue = 10;

    if (category === TargetCategory.PUTTER || category === 'PUTTER') {
        labels = ["距離感", "直進性", "転がり", "アライメント", "打感"]; // Swapped Alignment & Feel
        maxValue = 100;
    } else if (category === TargetCategory.BALL) {
        labels = ["ボール初速", "弾道", "スピン量", "飛距離", "操作性"];
        maxValue = 10;
    }

    // Scale function: Input 0-maxValue -> Output 0-radius
    const scale = (val: number) => (val / maxValue) * radius;

    // Data Points Calculation
    const values = [data.axis1, data.axis2, data.axis3, data.axis4, data.axis5];
    const points = values.map((val, i) => {
        // Safe guard: Cap value at maxValue
        const safeVal = Math.min(val, maxValue);
        const r = scale(safeVal);
        const rad = angles[i] * Math.PI / 180;
        return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
    }).join(" ");

    // Axis End Points (for grid lines and labels)
    const axisPoints = angles.map(a => {
        const rad = a * Math.PI / 180;
        return {
            x: center + radius * Math.cos(rad),
            y: center + radius * Math.sin(rad),
            angle: a
        };
    });

    return (
        <div className="w-full h-full relative flex items-center justify-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
                {/* Background Circles (Grid) */}
                {[0.25, 0.5, 0.75, 1].map((p, i) => (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={radius * p}
                        fill="none"
                        stroke="#94a3b8"
                        strokeOpacity="0.3"
                        strokeWidth="1"
                        strokeDasharray={i < 3 ? "4 2" : "none"}
                    />
                ))}

                {/* Axis Lines */}
                {axisPoints.map((pt, i) => (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={pt.x}
                        y2={pt.y}
                        stroke="#94a3b8"
                        strokeOpacity="0.5"
                        strokeWidth="1"
                    />
                ))}

                {/* Data Polygon */}
                <polygon
                    points={points}
                    fill={color}
                    fillOpacity="0.2"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />

                {/* Data Points (Dots) */}
                {values.map((val, i) => {
                    const safeVal = Math.min(val, maxValue);
                    const r = scale(safeVal);
                    const rad = angles[i] * Math.PI / 180;
                    const x = center + r * Math.cos(rad);
                    const y = center + r * Math.sin(rad);
                    return (
                        <circle key={i} cx={x} cy={y} r="3" fill={color} stroke="white" strokeWidth="1.5" />
                    );
                })}

                {/* Labels */}
                {axisPoints.map((pt, i) => {
                    // Smart Label Positioning based on angle
                    // Top (-90)
                    const isTop = i === 0;
                    // Right Side
                    const isRight = pt.x > center;
                    // Left Side
                    const isLeft = pt.x < center;
                    // Bottom
                    const isBottom = pt.y > center;

                    let textAnchor: "middle" | "start" | "end" = "middle";
                    let dy = "0.35em"; // Vertical Alignment Center by default

                    if (isTop) {
                        textAnchor = "middle";
                        dy = "-0.5em"; // Move Up
                    } else if (isRight) {
                        textAnchor = "start";
                        // Specific tweak for diagonal positions
                        dy = isBottom ? "0.8em" : "0.35em";
                    } else if (isLeft) {
                        textAnchor = "end";
                        dy = isBottom ? "0.8em" : "0.35em";
                    }

                    // Padding from the point
                    const labelPadding = 12; // Reduced padding slightly as chart is bigger
                    const labelRad = angles[i] * Math.PI / 180;
                    const labelX = center + (radius + labelPadding) * Math.cos(labelRad);
                    const labelY = center + (radius + labelPadding) * Math.sin(labelRad);

                    // Specific font size adjustment for "Alignment"
                    const isAlignment = labels[i] === "アライメント";
                    const fontSize = isAlignment ? "9" : "11";

                    return (
                        <g key={i}>
                            <text
                                x={labelX}
                                y={labelY}
                                dy={dy}
                                fontSize={fontSize}
                                fontWeight="bold"
                                textAnchor={textAnchor}
                                className="fill-slate-600"
                                style={{ textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}
                            >
                                {labels[i]}
                            </text>
                            <text
                                x={labelX}
                                y={labelY}
                                dy={isTop ? "0.8em" : parseFloat(dy) + 1.2 + "em"} // Value below label
                                fontSize="10"
                                fontWeight="normal"
                                textAnchor={textAnchor}
                                className="fill-slate-400"
                            >
                                {values[i]}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
