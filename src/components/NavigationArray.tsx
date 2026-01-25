import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Radar, Map, ShoppingCart } from 'lucide-react';

interface NavigationArrayProps {
    onOpenArmory: () => void;
}

export const NavigationArray: React.FC<NavigationArrayProps> = ({ onOpenArmory }) => {
    const { viewMode, setViewMode, resources } = useGame();

    return (
        <div className="w-full h-[60px] bg-black border-t border-imperial-gold flex items-center justify-between px-8 z-50 relative">
            {/* Background Mesh */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '4px 4px' }}
            />

            <div className="flex gap-4 h-full items-center">
                {/* Tactical View Toggle */}
                <button
                    onClick={() => setViewMode('tactical')}
                    className={`
                        h-10 px-6 flex items-center gap-2 font-mono tracking-widest text-xs border transition-all duration-300
                        ${viewMode === 'tactical'
                            ? 'border-imperial-gold bg-imperial-gold/20 text-imperial-gold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                            : 'border-zinc-800 bg-black text-zinc-500 hover:border-imperial-gold/50 hover:text-imperial-gold/70'}
                    `}
                >
                    <Radar size={16} />
                    <span>戰術視圖</span>
                </button>

                {/* Strategic View Toggle */}
                <button
                    onClick={() => setViewMode('strategic')}
                    className={`
                        h-10 px-6 flex items-center gap-2 font-mono tracking-widest text-xs border transition-all duration-300
                        ${viewMode === 'strategic'
                            ? 'border-imperial-gold bg-imperial-gold/20 text-imperial-gold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                            : 'border-zinc-800 bg-black text-zinc-500 hover:border-imperial-gold/50 hover:text-imperial-gold/70'}
                    `}
                >
                    <Map size={16} />
                    <span>戰略地圖</span>
                </button>
            </div>

            {/* Armory Toggle */}
            <button
                onClick={onOpenArmory}
                className="h-10 px-6 flex items-center gap-2 font-mono tracking-widest text-xs border border-zinc-800 bg-black text-imperial-gold hover:bg-imperial-gold hover:text-black transition-all"
            >
                <ShoppingCart size={16} />
                <span>軍械庫 [<span>{resources.rp}</span> RP]</span>
            </button>
        </div>
    );
};
