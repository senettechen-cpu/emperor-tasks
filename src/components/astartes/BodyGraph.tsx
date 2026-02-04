
import React from 'react';
import { Implant } from '../../data/astartesData';

interface BodyGraphProps {
    unlockedImplants: string[];
    onImplantClick?: (implantId: string) => void;
}


// Adjusted Coordinates for new detailed silhouette
const IMPLANT_COORDS: Record<string, { x: number, y: number }> = {
    // Head & Neck
    'catalepsean-node': { x: 50, y: 13 }, // Brain (Occipital)
    'sus-an-membrane': { x: 50, y: 11 }, // Top Brain
    'occulobe': { x: 50, y: 15 }, // Eye level
    'lymans-ear': { x: 44, y: 14 }, // Ear
    'neuroglottis': { x: 50, y: 19 }, // Throat/Naval cavity
    'betchers-gland': { x: 50, y: 21 }, // Mouth/Salivary
    'omophagea': { x: 50, y: 17 }, // Brain base/Spinal

    // Chest & Torso -- Widen X slightly for bulky armor
    'secondary-heart': { x: 56, y: 32 }, // Right chest
    'haemastamen': { x: 44, y: 32 }, // Main blood vessel (Left chest)
    'multi-lung': { x: 40, y: 35 }, // Left Lung area
    'ossmodula': { x: 50, y: 25 }, // Chest/Bone center
    'biscopea': { x: 35, y: 30 }, // Right Arm/Muscle trigger
    'black-carapace': { x: 50, y: 38 }, // Center Chest Overlay

    // Abdomen
    'preomnor': { x: 50, y: 45 }, // Stomach (Pre-stomach)
    'oolitic-kidney': { x: 58, y: 50 }, // Kidney area
    'progenoids': { x: 50, y: 55 }, // Groin/Glands

    // Skin/Full Body
    'mucranoid': { x: 68, y: 30 }, // Skin/Shoulder pores
    'melanchromic': { x: 32, y: 30 }, // Skin/Shoulder pores
    'larramans-organ': { x: 42, y: 48 }, // White blood cells (Liver area)
};


// Callout System Logic
const LEFT_SIDE_X = 10;
const RIGHT_SIDE_X = 90;

export const BodyGraph: React.FC<BodyGraphProps> = ({ unlockedImplants, onImplantClick }) => {
    const [activeImplant, setActiveImplant] = React.useState<string | null>(null);

    // Group implants by side for cleaner layout
    const leftSideImplants = Object.entries(IMPLANT_COORDS).filter(([_, coords]) => coords.x < 50);
    const rightSideImplants = Object.entries(IMPLANT_COORDS).filter(([_, coords]) => coords.x >= 50);

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-[#020202] overflow-hidden group">
            {/* 1. Tactical Grid Background */}
            <div className="absolute inset-0 z-0 opacity-15"
                style={{
                    backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000_100%)] pointer-events-none" />

            <svg viewBox="0 0 100 100" className="h-full w-auto max-w-full z-10 p-2 sm:p-8 transition-transform duration-700">
                <defs>
                    <filter id="glow-panel" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* 2. Main Silhouette (High Fidelity MK.X Pattern) */}
                <g stroke="#1e293b" strokeWidth="0.4" fill="#0b1221" opacity="0.8" className="transition-opacity duration-500">

                    {/* -- POWER PACK (Back Layer) -- */}
                    {/* Left Vent */}
                    <path d="M30,15 C28,10 32,5 38,6 L40,25 L30,22 Z" fill="#050a14" />
                    <circle cx="34" cy="12" r="2" fill="#0f172a" stroke="#1e293b" strokeWidth="0.2" /> {/* Vent Exhaust */}
                    {/* Right Vent */}
                    <path d="M70,15 C72,10 68,5 62,6 L60,25 L70,22 Z" fill="#050a14" />
                    <circle cx="66" cy="12" r="2" fill="#0f172a" stroke="#1e293b" strokeWidth="0.2" /> {/* Vent Exhaust */}

                    {/* -- LEGS -- */}
                    {/* Left Leg (Greave) */}
                    <path d="M42,55 C38,55 35,60 36,85 L32,95 L48,92 L46,60 Z" />
                    <path d="M38,65 L44,65" stroke="#334155" strokeWidth="0.2" opacity="0.5" /> {/* Knee Detail */}
                    {/* Right Leg (Greave) */}
                    <path d="M58,55 C62,55 65,60 64,85 L68,95 L52,92 L54,60 Z" />
                    <path d="M56,65 L62,65" stroke="#334155" strokeWidth="0.2" opacity="0.5" /> {/* Knee Detail */}
                    {/* Codpiece */}
                    <path d="M46,55 L54,55 L52,65 L48,65 Z" fill="#1e293b" />

                    {/* -- TORSO -- */}
                    {/* Main Abdomen */}
                    <path d="M40,35 L60,35 L58,55 L42,55 Z" />
                    {/* Cables/Grill on stomach */}
                    <line x1="44" y1="40" x2="56" y2="40" stroke="#334155" strokeWidth="0.2" />
                    <line x1="44" y1="42" x2="56" y2="42" stroke="#334155" strokeWidth="0.2" />
                    <line x1="44" y1="44" x2="56" y2="44" stroke="#334155" strokeWidth="0.2" />

                    {/* Chest Plate (Pectorals) */}
                    <path d="M35,22 C35,22 42,38 50,38 C58,38 65,22 65,22 L68,32 L60,45 L40,45 L32,32 Z" fill="#0f172a" />

                    {/* THE AQUILA (Chest Eagle) - Stylized */}
                    <g transform="translate(50, 30) scale(0.6)">
                        {/* Wings */}
                        <path d="M-20,-5 C-10,-8 0,0 0,0 C0,0 10,-8 20,-5 C22,-2 15,5 12,8 L0,10 L-12,8 C-15,5 -22,-2 -20,-5" fill="#1e293b" stroke="#fbbf24" strokeWidth="0.5" opacity="0.3" />
                        {/* Skulls */}
                        <circle cx="-3" cy="2" r="2" fill="#fbbf24" opacity="0.1" />
                        <circle cx="3" cy="2" r="2" fill="#fbbf24" opacity="0.1" />
                    </g>

                    {/* -- HEAD -- */}
                    <g transform="translate(50, 16)">
                        {/* Helmet Main */}
                        <path d="M-6,0 C-6,-5 -4,-8 0,-8 C4,-8 6,-5 6,0 L6,5 C6,7 4,8 0,8 C-4,8 -6,7 -6,5 Z" fill="#1e293b" />
                        {/* Eye Lenses */}
                        <path d="M-4,1 L-1,2 L-4,3 Z" fill="#ef4444" opacity="0.8" />
                        <path d="M4,1 L1,2 L4,3 Z" fill="#ef4444" opacity="0.8" />
                        {/* Grill/Vox */}
                        <path d="M-2,5 L2,5 L1,8 L-1,8 Z" fill="#050a14" />
                        {/* Ear Pods */}
                        <rect x="-7" y="-1" width="1" height="4" fill="#334155" />
                        <rect x="6" y="-1" width="1" height="4" fill="#334155" />
                    </g>

                    {/* -- ARMS & PAULDRONS -- */}
                    {/* Left Pauldron (Massive Shoulder) */}
                    <path d="M35,22 C25,18 15,25 18,40 C20,45 32,42 35,40 Z" fill="#0b1221" stroke="#334155" strokeWidth="0.6" />
                    <path d="M20,25 C25,23 30,23 32,25" stroke="#fbbf24" strokeWidth="0.1" opacity="0.2" fill="none" /> {/* Trim Detail */}

                    {/* Right Pauldron */}
                    <path d="M65,22 C75,18 85,25 82,40 C80,45 68,42 65,40 Z" fill="#0b1221" stroke="#334155" strokeWidth="0.6" />
                    <path d="M68,25 C75,23 80,23 80,25" stroke="#fbbf24" strokeWidth="0.1" opacity="0.2" fill="none" /> {/* Trim Detail */}

                    {/* Left Arm (Vambrace) */}
                    <path d="M22,42 L18,50 C15,55 18,70 20,75 L28,72 L26,45 Z" />
                    <path d="M20,60 L26,60" stroke="#334155" strokeWidth="0.2" opacity="0.3" /> {/* Elbow Joint */}

                    {/* Right Arm (Vambrace) */}
                    <path d="M78,42 L82,50 C85,55 82,70 80,75 L72,72 L74,45 Z" />
                    <path d="M74,60 L80,60" stroke="#334155" strokeWidth="0.2" opacity="0.3" /> {/* Elbow Joint */}
                </g>

                {/* 3. Callout System (Lines & Labels) */}

                {/* Left Side Labels */}
                {leftSideImplants.map(([id, coords], index) => {
                    const isUnlocked = unlockedImplants.includes(id);
                    if (!isUnlocked) return null;
                    const isActive = activeImplant === id;
                    const labelY = 10 + (index * 8); // Distribute vertically

                    return (
                        <g key={`callout-${id}`}
                            onMouseEnter={() => setActiveImplant(id)}
                            onMouseLeave={() => setActiveImplant(null)}
                            onClick={() => onImplantClick?.(id)}
                            className="cursor-pointer group/label"
                        >
                            {/* The Line: Body -> Elbow -> Label */}
                            <polyline
                                points={`${coords.x},${coords.y} ${coords.x - 5},${coords.y} ${LEFT_SIDE_X + 15},${labelY} ${LEFT_SIDE_X},${labelY}`}
                                fill="none"
                                stroke={isActive ? '#fbbf24' : '#334155'}
                                strokeWidth={isActive ? 0.3 : 0.1}
                                className="transition-all duration-300"
                            />
                            {/* Target Dot on Body */}
                            <circle cx={coords.x} cy={coords.y} r={isActive ? 1 : 0.5} fill={isActive ? '#fbbf24' : '#334155'} />

                            {/* The Label Box */}
                            <foreignObject x={0} y={labelY - 3} width={25} height={6}>
                                <div className={`
                                    text-[2px] font-mono leading-none p-0.5 border-l-2 transition-all duration-300
                                    ${isActive ? 'border-imperial-gold text-imperial-gold bg-imperial-gold/10' : 'border-zinc-700 text-zinc-600'}
                                `}>
                                    {id.split('-')[0].toUpperCase()}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

                {/* Right Side Labels */}
                {rightSideImplants.map(([id, coords], index) => {
                    const isUnlocked = unlockedImplants.includes(id);
                    if (!isUnlocked) return null;
                    const isActive = activeImplant === id;
                    const labelY = 10 + (index * 6); // Distribute vertically

                    return (
                        <g key={`callout-${id}`}
                            onMouseEnter={() => setActiveImplant(id)}
                            onMouseLeave={() => setActiveImplant(null)}
                            onClick={() => onImplantClick?.(id)}
                            className="cursor-pointer group/label"
                        >
                            {/* The Line: Body -> Elbow -> Label */}
                            <polyline
                                points={`${coords.x},${coords.y} ${coords.x + 5},${coords.y} ${RIGHT_SIDE_X - 15},${labelY} ${RIGHT_SIDE_X},${labelY}`}
                                fill="none"
                                stroke={isActive ? '#fbbf24' : '#334155'}
                                strokeWidth={isActive ? 0.3 : 0.1}
                                className="transition-all duration-300"
                            />
                            {/* Target Dot on Body */}
                            <circle cx={coords.x} cy={coords.y} r={isActive ? 1 : 0.5} fill={isActive ? '#fbbf24' : '#334155'} />

                            {/* The Label Box */}
                            <foreignObject x={75} y={labelY - 3} width={25} height={6} className="text-right">
                                <div className={`
                                    text-[2px] font-mono leading-none p-0.5 border-r-2 transition-all duration-300
                                    ${isActive ? 'border-imperial-gold text-imperial-gold bg-imperial-gold/10' : 'border-zinc-700 text-zinc-600'}
                                `}>
                                    {id.split('-')[0].toUpperCase()}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

            </svg>

            {/* Status Footer */}
            <div className="absolute bottom-4 left-4 font-mono text-imperial-gold text-xs tracking-widest border-t border-imperial-gold/30 pt-2 w-32">
                <div>SYSTEM: ONLINE</div>
                <div className="text-zinc-500">IMPLANTS: {unlockedImplants.length}/19</div>
            </div>
        </div>
    );
};
