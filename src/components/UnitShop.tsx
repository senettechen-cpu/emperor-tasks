import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { User, Shield, BookOpen, Skull, BadgeCheck } from 'lucide-react';

const { Title, Text } = Typography;

interface Unit {
    id: string;
    name: string;
    cost: number;
    description: string;
    icon: React.ReactNode;
}

const UNITS: Unit[] = [
    { id: 'tactical', name: '戰術小隊', cost: 10, description: '基礎防衛單位。獲得 RP +5%', icon: <User size={20} /> },
    { id: 'dreadnought', name: '無畏機甲', cost: 50, description: '每天可復活一個過期任務。', icon: <Skull size={20} /> },
    { id: 'librarian', name: '智庫館長', cost: 100, description: '降低「心智類」任務腦力消耗。', icon: <BookOpen size={20} /> },
    { id: 'barge', name: '戰鬥駁船', cost: 500, description: '解鎖技能「軌道轟炸」。', icon: <Shield size={20} /> },
    { id: 'baneblade', name: '帝皇毒刃', cost: 1000, description: '年度目標達成紀念。', icon: <BadgeCheck size={20} /> },
];

interface UnitShopProps {
    visible: boolean;
    onClose: () => void;
    glory: number;
    onBuy: (unit: Unit) => void;
    ownedUnitIds: string[];
}

export const UnitShop: React.FC<UnitShopProps> = ({ visible, onClose, glory, onBuy, ownedUnitIds }) => {
    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            title={<span className="text-imperial-gold font-bold tracking-widest text-xl">/// 軍械庫 REQUISITION ///</span>}
            className="p-0 border-2 border-imperial-gold/50 rounded-none bg-zinc-900"
            styles={{
                content: { backgroundColor: '#0a0a0a', border: '1px solid #fbbf24' },
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid #fbbf24' },
            }}
        >
            <div className="grid grid-cols-1 gap-4 p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 px-2">
                    <Text className="text-white/60 font-mono">AVAILABLE GLORY:</Text>
                    <Text className="text-imperial-gold font-bold text-2xl device-font">{glory}</Text>
                </div>

                {UNITS.map((unit) => {
                    const isOwned = ownedUnitIds.includes(unit.id);
                    const canAfford = glory >= unit.cost;

                    return (
                        <div
                            key={unit.id}
                            className={`relative border p-4 flex justify-between items-center transition-all duration-300 ${isOwned
                                    ? 'border-nurgle-green/50 bg-nurgle-green/5'
                                    : canAfford
                                        ? 'border-imperial-gold/30 hover:border-imperial-gold bg-zinc-900'
                                        : 'border-white/10 opacity-50 bg-black'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 flex items-center justify-center rounded border ${isOwned ? 'border-nurgle-green text-nurgle-green' : 'border-imperial-gold text-imperial-gold'}`}>
                                    {unit.icon}
                                </div>
                                <div>
                                    <Title level={5} className={`!m-0 tracking-wider ${isOwned ? '!text-nurgle-green' : '!text-imperial-gold'}`}>
                                        {unit.name}
                                    </Title>
                                    <Text className="text-white/50 text-xs block mt-1 font-mono">{unit.description}</Text>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <Text className={`font-mono font-bold ${canAfford || isOwned ? 'text-white' : 'text-red-500'}`}>
                                    {unit.cost} GLORY
                                </Text>

                                {isOwned ? (
                                    <span className="text-nurgle-green text-xs font-bold border border-nurgle-green px-2 py-1 tracking-widest">
                                        DEPLOYED
                                    </span>
                                ) : (
                                    <Button
                                        type="primary"
                                        disabled={!canAfford}
                                        onClick={() => onBuy(unit)}
                                        className={`bg-imperial-gold text-black border-none font-bold tracking-widest ${!canAfford ? 'opacity-20' : 'hover:scale-105'}`}
                                    >
                                        RECRUIT
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};
