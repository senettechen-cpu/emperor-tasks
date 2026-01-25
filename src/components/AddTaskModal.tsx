import React, { useState } from 'react';
import { Modal, Input, Slider, DatePicker, Select, Button, Typography } from 'antd';
import { Task, Faction } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (title: string, faction: Faction, difficulty: number, dueDate: Date) => void;
    initialKeyword?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onClose, onAdd, initialKeyword = '' }) => {
    const [title, setTitle] = useState(initialKeyword);
    const [difficulty, setDifficulty] = useState(1);
    const [faction, setFaction] = useState<Faction>('orks');
    // @ts-ignore
    const [dueDate, setDueDate] = useState<dayjs.Dayjs>(dayjs().add(12, 'hour'));

    // Auto-detect faction based on title
    React.useEffect(() => {
        setTitle(initialKeyword);
        if (/[打掃家務洗]/.test(initialKeyword)) setFaction('nurgle');
        else if (/[學習程式代碼]/.test(initialKeyword)) setFaction('tzeentch');
        else if (/[健身運動困難]/.test(initialKeyword)) setFaction('khorne');
        else if (/[修改bug]/.test(initialKeyword.toLowerCase())) setFaction('necrons');
        else setFaction('orks');
    }, [initialKeyword]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAdd(title, faction, difficulty, dueDate.toDate());
        setTitle('');
        onClose();
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={500}
            title={<span className="text-imperial-gold font-bold tracking-widest text-lg">/// 部署新任務 TACTICAL DEPLOYMENT ///</span>}
            className="p-0 border-2 border-imperial-gold/50 bg-black"
            styles={{
                content: { backgroundColor: '#0a0a0a', border: '1px solid #fbbf24' },
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid #fbbf24' },
            }}
        >
            <div className="space-y-6 pt-4">
                <div>
                    <label className="text-imperial-gold/70 font-mono block mb-2">任務代號 (OBJECTIVE)</label>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="!bg-zinc-900 !border-imperial-gold/30 !text-white font-mono"
                        placeholder="輸入任務名稱..."
                    />
                </div>

                <div>
                    <label className="text-imperial-gold/70 font-mono block mb-2">敵軍勢力 (FACTION)</label>
                    <Select
                        value={faction}
                        onChange={setFaction}
                        className="w-full"
                        dropdownStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    >
                        <Option value="nurgle">納垢 (Nurgle) - 家務/瑣事</Option>
                        <Option value="khorne">恐虐 (Khorne) - 健身/對抗</Option>
                        <Option value="tzeentch">奸奇 (Tzeentch) - 學習/燒腦</Option>
                        <Option value="slaanesh">色孽 (Slaanesh) - 慾望/成癮</Option>
                        <Option value="orks">獸人 (Orks) - 雜務海</Option>
                        <Option value="necrons">死靈 (Necrons) - Fix Bugs</Option>
                    </Select>
                </div>

                <div>
                    <label className="text-imperial-gold/70 font-mono block mb-2">截止時間 (ETA)</label>
                    <DatePicker
                        showTime
                        value={dueDate}
                        onChange={val => setDueDate(val || dayjs())}
                        className="w-full !bg-zinc-900 !border-imperial-gold/30 !text-white"
                    />
                </div>

                <div>
                    <label className="text-imperial-gold/70 font-mono block mb-2">威脅等級 (THREAT LEVEL): {difficulty}</label>
                    <Slider
                        min={1}
                        max={5}
                        value={difficulty}
                        onChange={setDifficulty}
                        railStyle={{ backgroundColor: '#333' }}
                        trackStyle={{ backgroundColor: '#ef4444' }}
                        handleStyle={{ borderColor: '#ef4444', backgroundColor: '#ef4444' }}
                    />
                </div>

                <Button
                    type="primary"
                    onClick={handleSubmit}
                    className="w-full h-12 bg-imperial-gold text-black border-none font-bold tracking-[0.2em] text-lg hover:!bg-yellow-400 mt-4"
                >
                    DEPLOY TASK
                </Button>
            </div>
        </Modal>
    );
};
