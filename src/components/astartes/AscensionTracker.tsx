
import React, { useState } from 'react';
import { Button, Drawer, Grid } from 'antd';
import { BodyGraph } from './BodyGraph';
import { ImplantTerminal } from './ImplantTerminal';
import { useAscension } from '../../hooks/useAscension';
import { X, Star, Hammer, Cpu, Activity } from 'lucide-react'; // Icons for resources

const { useBreakpoint } = Grid;

interface AscensionTrackerProps {
    visible: boolean;
    onClose: () => void;
}

export const AscensionTracker: React.FC<AscensionTrackerProps> = ({ visible, onClose }) => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { astartes } = useAscension();
    const [highlightedImplantId, setHighlightedImplantId] = useState<string | null>(null);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#020202] text-white font-mono flex flex-col animate-in fade-in duration-300">
            {/* Background Layers */}
            <div className="absolute inset-0 z-0 bg-no-repeat bg-cover opacity-30 mix-blend-overlay"
                style={{ backgroundImage: 'url("/ascension_tracker_bg.png")' }} /> {/* Assuming image is moved to public */}
            <div className="absolute inset-0 z-0 scanline opacity-20 pointer-events-none" />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)]" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center px-6 py-4 border-b border-imperial-gold/30 bg-black/90 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-imperial-gold animate-pulse-fast" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-[0.2em] text-imperial-gold m-0 text-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                            PROJECT ASCENSION
                        </h1>
                        <span className="hidden md:inline-block text-[10px] text-zinc-400 tracking-[0.3em] uppercase animate-hologram">
                            Secured Terminal // Alpha-Grade Clearance
                        </span>
                    </div>
                </div>

                {/* Header Stats - Desktop */}
                <div className="hidden md:flex gap-12 items-center mr-12 bg-black/40 px-8 py-2 rounded-full border border-zinc-800/50">
                    <div className="flex flex-col items-center group">
                        <span className="text-[9px] text-zinc-600 font-mono tracking-widest mb-1 group-hover:text-red-400 transition-colors">ADAMANTIUM</span>
                        <div className="flex items-center gap-2 text-red-600 group-hover:text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all">
                            <Hammer size={18} />
                            <span className="font-mono font-bold text-xl">{astartes.resources.adamantium}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center group">
                        <span className="text-[9px] text-zinc-600 font-mono tracking-widest mb-1 group-hover:text-blue-400 transition-colors">NEURO_DATA</span>
                        <div className="flex items-center gap-2 text-blue-500 group-hover:text-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all">
                            <Cpu size={18} />
                            <span className="font-mono font-bold text-xl">{astartes.resources.neuroData}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center group">
                        <span className="text-[9px] text-zinc-600 font-mono tracking-widest mb-1 group-hover:text-imperial-gold transition-colors">HK_PURITY</span>
                        <div className="flex items-center gap-2 text-imperial-gold/80 group-hover:text-imperial-gold group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all">
                            <Star size={18} fill="currentColor" />
                            <span className="font-mono font-bold text-xl">{astartes.resources.puritySeals}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center group">
                        <span className="text-[9px] text-zinc-600 font-mono tracking-widest mb-1 group-hover:text-green-400 transition-colors">GENE_SEED</span>
                        <div className="flex items-center gap-2 text-emerald-600 group-hover:text-green-500 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all">
                            <Activity size={18} />
                            <span className="font-mono font-bold text-xl">{astartes.resources.geneLegacy}</span>
                        </div>
                    </div>
                </div>

                {/* Header Stats - Mobile (Compact Row) */}
                <div className="flex md:hidden gap-3 bg-black/60 px-4 py-1.5 rounded-lg border border-zinc-800 absolute top-[70px] left-6 right-6 justify-around items-center z-50 overflow-x-auto custom-scrollbar no-scrollbar">
                    <div className="flex items-center gap-1.5 text-red-600 whitespace-nowrap">
                        <Hammer size={12} />
                        <span className="text-xs font-bold font-mono">{astartes.resources.adamantium}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500 whitespace-nowrap">
                        <Cpu size={12} />
                        <span className="text-xs font-bold font-mono">{astartes.resources.neuroData}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-imperial-gold whitespace-nowrap">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-bold font-mono">{astartes.resources.puritySeals}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 whitespace-nowrap">
                        <Activity size={12} />
                        <span className="text-xs font-bold font-mono">{astartes.resources.geneLegacy}</span>
                    </div>
                </div>

                <Button
                    type="text"
                    icon={<X className="text-zinc-500 hover:text-red-500 transition-colors" size={24} />}
                    onClick={onClose}
                    className="!flex items-center justify-center w-12 h-12 hover:bg-red-900/10 border border-transparent hover:border-red-900/50"
                />

            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
                {/* Left Panel: Body Graph */}
                <div className="w-full md:w-5/12 h-[50vh] md:h-full p-6 md:p-12 flex items-center justify-center relative border-r border-imperial-gold/10 bg-black/40 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0)_49.9%,rgba(251,191,36,0.05)_50%,rgba(0,0,0,0)_50.1%)] bg-[length:20px_20px] opacity-20 pointer-events-none" />

                    <BodyGraph
                        unlockedImplants={astartes.unlockedImplants}
                        onImplantClick={(id) => console.log(id)}
                    />

                    {/* Decorative Info Panel */}
                    <div className="absolute top-8 left-8 p-4 border-l-2 border-imperial-gold/30 bg-black/60 backdrop-blur-md">
                        <div className="text-imperial-gold/40 font-mono text-[10px] tracking-widest mb-1">TARGET_SUBJECT</div>
                        <div className="text-zinc-300 font-mono text-sm tracking-wider">RECRUIT #739-GAMMA</div>
                        <div className="text-emerald-500/80 font-mono text-[10px] tracking-widest mt-2 animate-pulse">STATUS: AUGMENTATION</div>
                    </div>
                </div>

                {/* Right Panel: Terminal */}
                <div className="w-full md:w-7/12 h-full relative z-20">
                    <div className="absolute inset-0 bg-black/80 pointer-events-none" /> {/* Dimmer base */}
                    <ImplantTerminal onSelectImplant={setHighlightedImplantId} />
                </div>
            </div>
        </div>
    );
};
