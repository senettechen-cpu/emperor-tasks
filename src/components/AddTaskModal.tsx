import React, { useState, useEffect } from 'react';
import { Modal, Input, Slider, DatePicker, Select, Button, Typography, Checkbox, Radio } from 'antd';
import { Task, Faction } from '../types';
import { useGame } from '../contexts/GameContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring: boolean) => void;
    initialKeyword?: string;
    initialTask?: Task | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onClose, onAdd, initialKeyword = '', initialTask }) => {
    const { projects } = useGame();

    // Modes: 'manual' | 'project'
    const [inputMode, setInputMode] = useState<'manual' | 'project'>('manual');
    const [selectedProjectId, setSelectedProjectId] = useState<string>();
    const [selectedSubTaskId, setSelectedSubTaskId] = useState<string>();

    const [title, setTitle] = useState(initialKeyword);
    const [difficulty, setDifficulty] = useState(1);
    const [faction, setFaction] = useState<Faction>('orks');
    const [isRecurring, setIsRecurring] = useState(false);
    // @ts-ignore
    const [dueDate, setDueDate] = useState<dayjs.Dayjs>(dayjs().add(12, 'hour'));

    // Effect to handle edit mode vs new mode
    useEffect(() => {
        if (visible) {
            if (initialTask) {
                // Edit Mode
                setTitle(initialTask.title);
                setDifficulty(initialTask.difficulty);
                setFaction(initialTask.faction);
                setIsRecurring(initialTask.isRecurring || false);
                // @ts-ignore
                setDueDate(dayjs(initialTask.dueDate));
                setInputMode('manual'); // Force manual on edit
            } else {
                // New Mode
                setTitle(initialKeyword);
                setDifficulty(1);
                setFaction('orks');
                setIsRecurring(false);
                // @ts-ignore
                setDueDate(dayjs().add(12, 'hour'));
                setInputMode('manual');
                setSelectedProjectId(undefined);
                setSelectedSubTaskId(undefined);
            }
        }
    }, [visible, initialTask, initialKeyword]);

    // Auto-detect faction based on title (only for new tasks)
    useEffect(() => {
        if (!initialTask && /[打掃家務洗]/.test(title)) setFaction('nurgle');
        else if (!initialTask && /[學習程式代碼]/.test(title)) setFaction('tzeentch');
        else if (!initialTask && /[健身運動困難]/.test(title)) setFaction('khorne');
        else if (!initialTask && /[修改bug]/.test(title.toLowerCase())) setFaction('necrons');
        // keep existing decision if not matched or editing
    }, [title, initialTask]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAdd(title, faction, difficulty, dueDate.toDate(), isRecurring);
        setTitle('');
        setIsRecurring(false);
        onClose();
    };

    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
        setSelectedSubTaskId(undefined);
    };

    const handleSubTaskChange = (subTaskId: string) => {
        setSelectedSubTaskId(subTaskId);
        const project = projects.find(p => p.id === selectedProjectId);
        const subTask = project?.subTasks.find(st => st.id === subTaskId);
        if (subTask) {
            setTitle(subTask.title);
        }
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
                {/* Mode Toggle */}
                {!initialTask && (
                    <div className="flex justify-center mb-4">
                        <Radio.Group
                            value={inputMode}
                            onChange={e => setInputMode(e.target.value)}
                            className="bg-zinc-900 border border-imperial-gold/30 rounded-lg p-1"
                        >
                            <Radio.Button value="manual" className="!bg-transparent !border-none !text-imperial-gold hover:!text-white after:!hidden checked:!bg-imperial-gold/20">
                                手動輸入
                            </Radio.Button>
                            <Radio.Button value="project" className="!bg-transparent !border-none !text-imperial-gold hover:!text-white after:!hidden checked:!bg-imperial-gold/20">
                                從專案導入
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                )}

                {/* Project Selection Mode */}
                {inputMode === 'project' && !initialTask && (
                    <div className="p-4 border border-imperial-gold/20 rounded bg-zinc-900/50 space-y-4 mb-4">
                        <div>
                            <label className="text-imperial-gold/70 font-mono block mb-2 text-xs">來源專案 (SOURCE PROJECT)</label>
                            <Select
                                className="w-full"
                                placeholder="選擇戰略專案..."
                                value={selectedProjectId}
                                onChange={handleProjectChange}
                                dropdownStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                            >
                                {projects.map(p => (
                                    <Option key={p.id} value={p.id}>{p.month} - {p.title}</Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="text-imperial-gold/70 font-mono block mb-2 text-xs">子任務目標 (SUB-OBJECTIVE)</label>
                            <Select
                                className="w-full"
                                placeholder="選擇子任務..."
                                value={selectedSubTaskId}
                                onChange={handleSubTaskChange}
                                disabled={!selectedProjectId}
                                dropdownStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                            >
                                {projects.find(p => p.id === selectedProjectId)?.subTasks.map(st => (
                                    <Option key={st.id} value={st.id}>
                                        {st.completed ? '[已完成] ' : ''}{st.title}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                )}

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
                        step={1}
                        marks={{
                            1: '微小',
                            2: '低度',
                            3: '中度',
                            4: '高度',
                            5: '極限'
                        }}
                        value={difficulty}
                        onChange={setDifficulty}
                        railStyle={{ backgroundColor: '#333' }}
                        trackStyle={{ backgroundColor: '#ef4444' }}
                        handleStyle={{ borderColor: '#ef4444', backgroundColor: '#ef4444' }}
                    />
                </div>

                <div className="flex items-center gap-2 pt-4">
                    <Checkbox
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
                        className="!text-imperial-gold font-mono"
                    >
                        每日固定任務 (IMPERIAL MANDATE)
                    </Checkbox>
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
