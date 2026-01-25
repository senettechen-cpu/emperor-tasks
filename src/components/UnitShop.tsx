import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { Shield, BookOpen, BadgeCheck } from 'lucide-react';
import { GuardsmanIcon, MarineIcon, CustodesIcon, SkullIcon } from './ImperiumIcons';
import { useGame } from '../contexts/GameContext';

// Removed Title/Text destructuring

interface Unit {
    id: string;
    name: string;
    cost: number;
    description: string;
    icon: React.ReactNode;
}

const UNITS: Unit[] = [
    { id: 'tactical', name: '戰術小隊', cost: 10, description: '基礎防衛單位。獲得 RP +5%', icon: <GuardsmanIcon size={20} /> },
    { id: 'dreadnought', name: '無畏機甲', cost: 50, description: '每天可復活一個過期任務。', icon: <MarineIcon size={20} /> },
    { id: 'librarian', name: '智庫館長', cost: 100, description: '降低「心智類」任務腦力消耗。', icon: <SkullIcon size={20} /> },
    { id: 'barge', name: '戰鬥駁船', cost: 500, description: '解鎖技能「軌道轟炸」。', icon: <Shield size={20} /> },
    { id: 'baneblade', name: '帝皇毒刃', cost: 1000, description: '年度目標達成紀念。', icon: <CustodesIcon size={20} /> },
];

interface UnitShopProps {
    visible: boolean;
    onClose: () => void;
    glory: number;
    onBuy: (unit: Unit) => void;
    ownedUnitIds: string[];
}

export const UnitShop: React.FC<UnitShopProps> = ({ visible, onClose, glory, onBuy, ownedUnitIds }) => {
    const { getTraitForMonth, recruitUnit, buyUnit } = useGame();

    // Determine current month trait
    const currentMonthIdx = new Date().getMonth();
    const currentMonthId = `M${currentMonthIdx + 1}`;
    const activeTrait = getTraitForMonth(currentMonthId);
    const isHiveWorld = activeTrait === 'hive';
    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            title={<span className="text-imperial-gold font-bold tracking-widest text-xl">/// 軍械庫資源 ARMORY RESOURCES ///</span>}
            className="p-0 border-2 border-imperial-gold/50 rounded-none bg-zinc-900"
            styles={{
                content: { backgroundColor: '#0a0a0a', border: '1px solid #fbbf24' },
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid #fbbf24' },
            }}
        >
            <div className="grid grid-cols-1 gap-4 p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 px-2">
                    <span className="text-white/60 font-mono">可用榮耀值 (GLORY):</span>
                    <span className="text-imperial-gold font-bold text-2xl device-font"><span>{glory}</span></span>
                </div>

                {UNITS.map((unit) => {
                    const isOwned = ownedUnitIds.includes(unit.id);

                    // Price Calculation
                    let displayCost = unit.cost;
                    let isDiscounted = false;
                    if (unit.id === 'tactical' && isHiveWorld) {
                        displayCost = Math.floor(unit.cost * 0.8);
                        isDiscounted = true;
                    }

                    const canAfford = glory >= displayCost;

                    // Map ID to Image
                    let unitImage = '';
                    switch (unit.id) {
                        case 'tactical': unitImage = '/units/tactical.png'; break;
                        case 'dreadnought': unitImage = '/units/dreadnought.png'; break;
                        case 'baneblade': unitImage = '/units/baneblade.png'; break;
                        case 'librarian': unitImage = '/units/librarian.png'; break;
                        case 'barge': unitImage = '/units/barge.png'; break;
                        default: unitImage = '/units/guardsman.png';
                    }

                    return (
                        <div
                            key={unit.id}
                            className={`relative group overflow-hidden border p-0 flex justify-between items-center transition-all duration-300 ${isOwned
                                ? 'border-nurgle-green/50 bg-nurgle-green/5'
                                : canAfford
                                    ? 'border-imperial-gold/30 hover:border-imperial-gold bg-zinc-900'
                                    : 'border-white/10 opacity-50 bg-black'
                                }`}
                        >
                            {/* Background Image with Gradient Overlay */}
                            <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                                <img src={unitImage} alt={unit.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                            </div>

                            <div className="relative z-10 p-4 flex items-center gap-4 w-full justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Icon Container (Optional specific icon overlay) */}
                                    <div className={`w-12 h-12 flex items-center justify-center rounded border bg-black/50 backdrop-blur-sm ${isOwned ? 'border-nurgle-green text-nurgle-green' : 'border-imperial-gold text-imperial-gold'}`}>
                                        {unit.icon}
                                    </div>
                                    <div>
                                        <h5 className={`!m-0 tracking-wider text-[18px] font-bold uppercase ${isOwned ? '!text-nurgle-green' : '!text-imperial-gold'}`}>
                                            <span>{unit.name}</span>
                                        </h5>
                                        <span className="text-white/60 text-xs block mt-1 font-mono tracking-wide"><span>{unit.description}</span></span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className={`font-mono font-bold text-lg ${canAfford || isOwned ? 'text-white' : 'text-red-500'}`}>
                                        {isDiscounted && <span className="line-through text-zinc-500 text-xs mr-2">{unit.cost}</span>}
                                        <span>{displayCost} GLORY</span>
                                        {isDiscounted && <span className="ml-1 text-green-500 text-xs font-bold animate-pulse">[HIVE BONUS]</span>}
                                    </span>

                                    {isOwned ? (
                                        <span className="text-nurgle-green text-xs font-bold border border-nurgle-green px-3 py-1 tracking-widest bg-black/50 backdrop-blur-sm">
                                            已部署
                                        </span>
                                    ) : (
                                        <Button
                                            type="primary"
                                            disabled={!canAfford}
                                            onClick={() => {
                                                if (['tactical', 'dreadnought', 'baneblade'].includes(unit.id)) {
                                                    const typeMap: Record<string, 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade'> = {
                                                        'tactical': 'guardsmen',
                                                        'dreadnought': 'dreadnought',
                                                        'baneblade': 'baneblade'
                                                    };
                                                    recruitUnit(typeMap[unit.id]);
                                                } else {
                                                    buyUnit(unit.id, displayCost);
                                                }
                                            }}
                                            className={`bg-imperial-gold text-black border-none font-bold tracking-widest ${!canAfford ? 'opacity-20' : 'hover:scale-105 hover:!bg-white'}`}
                                        >
                                            徵召
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};
