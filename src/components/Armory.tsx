import React from 'react';
import { Drawer, Card, Button, Typography, message, Tabs } from 'antd';
import { ShoppingCart, Skull, Zap, ShieldCheck, Users, Sword } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

// Removed Title/Text destructuring

interface ArmoryProps {
    visible: boolean;
    onClose: () => void;
}

const ARMORY_ITEMS = [
    {
        id: 'servo_skull',
        name: '伺服骷髏 (Servo-Skull)',
        cost: 30,
        desc: '自動完成一個「歐克獸人」等級任務',
        icon: <Skull size={32} className="text-zinc-400" />
    },
    {
        id: 'theme_khorne',
        name: '戰術塗裝：恐虐紅',
        cost: 50,
        desc: '更改雷達介面為嗜血紅色',
        icon: <Zap size={32} className="text-red-500" />
    },
    {
        id: 'rosarius',
        name: '免死金牌 (Rosarius)',
        cost: 80,
        desc: '立即消除 50 點腐壞值',
        icon: <ShieldCheck size={32} className="text-imperial-gold" />
    },
    {
        id: 'theme_gold',
        name: '戰術塗裝：黃金王座',
        cost: 100,
        desc: '更改雷達介面為神聖金色',
        icon: <Zap size={32} className="text-yellow-400" />
    }
];

const RECRUITMENT_UNITS = [
    {
        id: 'guardsmen',
        name: '帝國衛隊 (Imperial Guard)',
        cost: 300,
        power: 50,
        desc: '數量就是力量。',
        icon: <img src="/units/guardsman.png" alt="Guardsman" className="w-16 h-16 object-cover border border-zinc-700 rounded" />
    },
    {
        id: 'space_marine',
        name: '阿斯塔特修士 (Space Marine)',
        cost: 1500,
        power: 300,
        desc: '帝皇的死亡天使。',
        icon: <img src="/units/marine.png" alt="Space Marine" className="w-16 h-16 object-cover border border-imperial-gold rounded" />
    },
    {
        id: 'custodes',
        name: '禁軍 (Custodes)',
        cost: 4500,
        power: 1500,
        desc: '萬中選一的守護者。',
        icon: <img src="/units/custodes.png" alt="Custodes" className="w-16 h-16 object-cover border border-yellow-400 rounded shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
    }
] as const;

export const Armory: React.FC<ArmoryProps> = ({ visible, onClose }) => {
    const { resources, purchaseItem, recruitUnit } = useGame();

    const handleBuy = (item: typeof ARMORY_ITEMS[0]) => {
        if (resources.rp >= item.cost) {
            purchaseItem(item.cost, item.id);
            message.success(`已配發：${item.name}`);
            const audio = new Audio('/sounds/deploy.mp3');
        } else {
            message.error('帝皇之怒 (RP) 不足！無法徵用此裝備。');
        }
    };

    const handleRecruit = (unit: any) => {
        if (resources.glory >= unit.cost) {
            recruitUnit(unit.id);
            message.success(`援軍抵達！防禦力提升 (+${unit.power})`);
        } else {
            message.error('榮耀值 (GLORY) 不足！無法徵召此單位。');
        }
    };

    return (
        <Drawer
            title={
                <div className="flex items-center gap-2 text-imperial-gold">
                    <ShoppingCart size={20} />
                    <span className="font-mono tracking-widest text-lg">帝國軍械庫 (IMPERIAL ARMORY)</span>
                </div>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={400}
            styles={{
                header: { backgroundColor: '#000', borderBottom: '1px solid #fbbf24' },
                body: { backgroundColor: '#0a0a0a', backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 1px)', backgroundSize: '20px 20px' },
                content: { backgroundColor: '#000' }
            }}
            closeIcon={<span className="text-imperial-gold">✕</span>}
        >
            <Tabs
                defaultActiveKey="requisition"
                items={[
                    {
                        key: 'requisition',
                        label: '物資徵用 (REQUISITION)',
                        children: (
                            <div className="flex flex-col gap-4">
                                <div className="p-4 border border-imperial-gold/30 bg-imperial-gold/5 mb-4 text-center">
                                    <span className="block text-imperial-gold/60 text-xs tracking-widest mb-1">目前徵用點數 (RP)</span>
                                    <span className="text-4xl font-mono text-imperial-gold font-bold"><span>{resources.rp}</span></span>
                                </div>
                                {ARMORY_ITEMS.map(item => (
                                    <Card
                                        key={item.id}
                                        className="!bg-zinc-900 !border-imperial-gold/20 hover:!border-imperial-gold/60 transition-colors"
                                        styles={{ body: { padding: '16px' } }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-black border border-zinc-800 rounded mt-1">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1">
                                                <span className="block text-imperial-gold font-bold font-mono text-base"><span>{item.name}</span></span>
                                                <span className="block text-zinc-500 text-xs mt-1 mb-3"><span>{item.desc}</span></span>
                                                <Button
                                                    block
                                                    disabled={resources.rp < item.cost}
                                                    onClick={() => handleBuy(item)}
                                                    className={`
                                                        font-mono tracking-widest h-8 text-xs font-bold border-none
                                                        ${resources.rp >= item.cost
                                                            ? '!bg-imperial-gold !text-black hover:!bg-yellow-400'
                                                            : '!bg-zinc-800 !text-zinc-600'}
                                                    `}
                                                >
                                                    徵用 [<span>{item.cost}</span> RP]
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )
                    },
                    {
                        key: 'recruitment',
                        label: '軍團徵召 (RECRUITMENT)',
                        children: (
                            <div className="flex flex-col gap-4">
                                <div className="p-4 border border-imperial-gold/30 bg-imperial-gold/5 mb-4 text-center">
                                    <span className="block text-imperial-gold/60 text-xs tracking-widest mb-1">可用榮耀值 (GLORY)</span>
                                    <span className="text-4xl font-mono text-imperial-gold font-bold"><span>{resources.glory}</span></span>
                                </div>
                                {RECRUITMENT_UNITS.map(unit => (
                                    <Card
                                        key={unit.id}
                                        className="!bg-zinc-900 !border-imperial-gold/20 hover:!border-imperial-gold/60 transition-colors"
                                        styles={{ body: { padding: '16px' } }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-black border border-zinc-800 rounded mt-1">
                                                {unit.icon}
                                            </div>
                                            <div className="flex-1">
                                                <span className="block text-imperial-gold font-bold font-mono text-base"><span>{unit.name}</span></span>
                                                <span className="block text-zinc-500 text-xs mt-1 mb-3"><span>{unit.desc}</span></span>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs text-zinc-400 font-mono">戰力: +<span>{unit.power}</span></span>
                                                </div>
                                                <Button
                                                    block
                                                    disabled={resources.glory < unit.cost}
                                                    onClick={() => handleRecruit(unit)}
                                                    className={`
                                                        font-mono tracking-widest h-8 text-xs font-bold border-none
                                                        ${resources.glory >= unit.cost
                                                            ? '!bg-imperial-gold !text-black hover:!bg-yellow-400'
                                                            : '!bg-zinc-800 !text-zinc-600'}
                                                    `}
                                                >
                                                    徵召 [<span>{unit.cost}</span> GLORY]
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )
                    }
                ]}
            />
        </Drawer>
    );
};
