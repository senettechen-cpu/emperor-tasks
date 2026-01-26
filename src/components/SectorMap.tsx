import React, { useState } from 'react';
import { Card, Progress, Typography, Modal, Button, Form, Input, Select, Tag, Tooltip } from 'antd';
import { Lock, Crosshair, Star, Briefcase, Plus, Check, ChevronRight, Swords, ShieldAlert, Shield, Settings, Skull, Church as ChurchIcon, CircleDashed } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Project, SubTask } from '../types';
import { GuardsmanIcon, MarineIcon, CustodesIcon } from './ImperiumIcons';
import { PlanetaryTraitType } from '../types';

const TRAIT_CONFIG: Record<PlanetaryTraitType, { name: string, effect: string, icon: React.ReactNode, color: string }> = {
    'hive': { name: '巢都世界 (Lv1)', effect: '專案數 1~2: 徵召「帝國衛隊」費用 -20%', icon: <Shield size={14} />, color: '#10b981' }, // Green
    'forge': { name: '鑄造世界 (Lv3)', effect: '專案數 5~7: 專案 Glory 獎勵 +20%', icon: <Settings size={14} />, color: '#f59e0b' }, // Amber
    'death': { name: '死亡世界 (Lv4)', effect: '專案數 8+: 難度提升 / Glory 雙倍', icon: <Skull size={14} />, color: '#ef4444' }, // Red
    'shrine': { name: '聖地世界 (Lv2)', effect: '專案數 3~4: 腐壞增長速度減半', icon: <ChurchIcon size={14} />, color: '#a855f7' }, // Purple
    'barren': { name: '荒蕪世界 (Lv0)', effect: '專案數 0', icon: <CircleDashed size={14} />, color: '#71717a' }, // Zinc
};

const POWER_VALUES = { guardsmen: 50, spaceMarines: 300, custodes: 1500, dreadnought: 1000, baneblade: 5000 };

export const SectorMap: React.FC = () => {
    const { armyStrength, projects, addProject, addSubTask, completeSubTask, deleteProject, getTraitForMonth, deployUnit, recallUnit, currentMonth, sectorHistory, resolveSector } = useGame();
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null); // For Drill-down
    const [activeTab, setActiveTab] = useState<'projects' | 'deployment'>('projects'); // New Tab State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    // SubTask Form
    const [subTaskTitle, setSubTaskTitle] = useState('');

    const currentMonthIdx = currentMonth; // Use GameContext's currentMonth instead of real Date

    // Threat Calculation
    const abaddonProgress = ((currentMonthIdx + 1) / 12) * 100;
    const currentThreat = (currentMonthIdx + 1) * 5000;
    const defenseTarget = 50000;
    const defenseProgress = Math.min(100, (armyStrength.totalActivePower / defenseTarget) * 100);
    const isThreatCritical = armyStrength.totalActivePower < currentThreat;

    const handleSimulation = () => {
        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
            if (armyStrength.totalActivePower >= currentThreat) {
                Modal.success({
                    title: '防線穩固',
                    content: '帝皇的防禦堅不可摧。 (勝利預測: 100%)',
                    okText: '為了帝皇！',
                    className: 'imperial-modal',
                });
            } else {
                Modal.error({
                    title: '警告：防線瀕臨崩潰！',
                    content: '預計傷亡率 99%。請立即徵兵！',
                    okText: '誓死堅守！',
                    className: 'imperial-modal-error',
                });
            }
        }, 2000);
    };

    const MONTHS = Array.from({ length: 12 }, (_, i) => ({
        id: `M${i + 1}`,
        name: `Month ${i + 1}`,
        status: i < currentMonthIdx ? 'past' : i === currentMonthIdx ? 'active' : 'pending',
    }));

    const handleMonthClick = (monthId: string) => {
        setSelectedMonth(monthId);
        setSelectedProject(null); // Reset drill-down
        setActiveTab('projects'); // Default to projects
        setIsModalOpen(true);
    };

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
    };

    const handleBackToMonth = () => {
        setSelectedProject(null);
    };

    const handleAddProject = (values: any) => {
        if (selectedMonth) {
            addProject(values.title, values.difficulty, selectedMonth);
            // form.resetFields();
            // Auto-enter disabled due to stability issues. Manual entry required.
        }
    };

    const handleAddSubTask = () => {
        if (selectedProject && subTaskTitle.trim()) {
            addSubTask(selectedProject.id, subTaskTitle);
            setSubTaskTitle('');
        }
    };

    // Derived state for re-render
    const monthProjects = projects.filter(p => p.month === selectedMonth);

    // Get fresh project data if selected
    const activeProject = selectedProject ? projects.find(p => p.id === selectedProject.id) || null : null;

    return (
        <div className="w-full h-full flex flex-row bg-zinc-950 text-imperial-gold overflow-hidden">
            {/* LEFT SIDEBAR: STRATEGIC RESERVES (Vertical) */}
            <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-zinc-800 bg-black/60 relative z-20">
                <div className="p-4 border-b border-imperial-gold/20 bg-black text-center">
                    <h3 className="text-imperial-gold font-mono tracking-[0.2em] font-bold text-lg uppercase">
                        戰略軍力
                    </h3>
                    <div className="text-zinc-500 font-mono text-[10px] tracking-wider mt-1">STRATEGIC RESERVES</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                    {[
                        { id: 'guardsmen', name: '星界軍', count: armyStrength.reserves.guardsmen, img: '/units/guardsman.png', border: 'border-imperial-gold' },
                        { id: 'spaceMarines', name: '星際戰士', count: armyStrength.reserves.spaceMarines, img: '/units/marine.png', border: 'border-blue-500' },
                        { id: 'custodes', name: '禁軍', count: armyStrength.reserves.custodes, img: '/units/custodes.png', border: 'border-yellow-400' },
                        { id: 'dreadnought', name: '無畏機甲', count: armyStrength.reserves.dreadnought, img: '/units/dreadnought.png', border: 'border-zinc-400' },
                        { id: 'baneblade', name: '帝皇毒刃', count: armyStrength.reserves.baneblade, img: '/units/baneblade.png', border: 'border-red-600' },
                    ].map(u => (
                        <div key={u.id} className={`relative group overflow-hidden border bg-black transition-all duration-300 hover:scale-[1.02] h-20 flex items-center ${u.border}`}>
                            <div className={`h-full w-20 flex-shrink-0 border-r ${u.border} relative`}>
                                <img src={u.img} alt={u.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1 px-4 flex flex-col justify-center">
                                <h5 className="text-white font-bold text-sm tracking-widest m-0">{u.name}</h5>
                                <span className={`text-2xl font-mono font-bold leading-none ${u.count > 0 ? 'text-imperial-gold' : 'text-zinc-600'}`}>
                                    {u.count}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-black text-center">
                    <div className="text-[10px] text-zinc-600 font-mono">
                        AWAITING ORDERS<br />
                        SECTOR COMMAND
                    </div>
                </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-20" />

                <div className="p-6 pb-2 z-10">
                    {/* THREAT MONITOR */}
                    <div className="w-full mb-4 border border-red-900/50 bg-black/80 backdrop-blur-sm p-4 rounded relative overflow-hidden">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex flex-col">
                                <h4 className="!text-red-500 !font-mono !m-0 tracking-widest uppercase text-lg font-bold">
                                    阿巴頓的遠征
                                </h4>
                                <span className="text-red-400/60 font-mono text-xs">黑色遠征威脅等級</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-imperial-gold font-mono font-bold text-xl">
                                    <span>{currentThreat}</span> 侵襲度 vs <span>{armyStrength.totalActivePower}</span> 防禦力
                                </span>
                                <Button
                                    type="primary"
                                    className={`
                                !bg-red-900/20 !border-red-500 !text-red-500 font-bold font-mono tracking-widest animate-pulse
                                hover:!bg-red-500 hover:!text-black transition-all
                            `}
                                    icon={<Swords size={16} />}
                                    loading={isSimulating}
                                    onClick={handleSimulation}
                                >
                                    {isSimulating ? '戰術推演中...' : '執行防禦演習'}
                                </Button>
                            </div>
                        </div>

                        {/* Dual Progress Bar */}
                        <div className="relative h-6 bg-black rounded-full overflow-hidden border border-zinc-800">
                            {/* Abaddon (Red) */}
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-1000 ease-out"
                                style={{ width: `${abaddonProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-mono text-red-500 mt-1">
                            <span>入侵開始</span>
                            <span>泰拉圍城</span>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between items-end mb-1">
                                <h5 className="!text-imperial-gold !font-mono !m-0 tracking-widest uppercase text-sm font-bold">帝國防禦網</h5>
                            </div>
                            <div className="relative h-4 bg-black rounded-full overflow-hidden border border-zinc-800">
                                <div
                                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isThreatCritical ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-yellow-900 to-imperial-gold'}`}
                                    style={{ width: `${defenseProgress}%` }}
                                />
                            </div>


                        </div>
                    </div>

                    {/* SECTOR CHART (GRID) */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-4 gap-4 p-4">
                            {MONTHS.map((month) => {
                                const count = projects.filter(p => p.month === month.id).length;
                                const isFuture = month.status === 'pending';
                                const isActive = month.status === 'active';
                                const isPast = month.status === 'past';
                                const historyResult = sectorHistory[month.id]; // 'victory' | 'defeat'

                                // Dynamic Trait Logic
                                const traitType = getTraitForMonth(month.id);
                                const trait = TRAIT_CONFIG[traitType];

                                // Scaling Threat Logic (Exponential 500 -> 50,000)
                                const monthIndex = parseInt(month.id.slice(1)) - 1; // 0-11
                                const scalingThreat = Math.floor(500 * Math.pow(1.52, monthIndex));

                                // Active Garrison Power
                                const garrison = armyStrength.garrisons[month.id] || { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
                                const garrisonPower = (garrison.guardsmen * POWER_VALUES.guardsmen) + (garrison.spaceMarines * POWER_VALUES.spaceMarines) + (garrison.custodes * POWER_VALUES.custodes) + ((garrison.dreadnought || 0) * POWER_VALUES.dreadnought) + ((garrison.baneblade || 0) * POWER_VALUES.baneblade);

                                const isDefended = garrisonPower >= scalingThreat;

                                return (
                                    <Card
                                        key={month.id}
                                        hoverable={!isPast} // Past months are view-only
                                        onClick={() => handleMonthClick(month.id)}
                                        className={`
                                    !bg-black !text-imperial-gold transition-all duration-300 relative overflow-hidden group
                                    ${isActive
                                                ? '!border-imperial-gold shadow-[0_0_15px_#fbbf24] scale-[1.02]'
                                                : isPast
                                                    ? '!border-zinc-800 opacity-60'
                                                    : '!border-red-900 hover:!border-red-500 animate-pulse'
                                            }
                                    ${isFuture ? 'opacity-70 hover:opacity-100 hover:!border-zinc-600' : ''}
                                    ${historyResult === 'defeat' ? '!border-red-600/50' : ''}
                                `}
                                    >
                                        <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-500 z-20">
                                            THREAT: {scalingThreat}
                                        </div>

                                        {/* Planetary Trait Icon (Top Right) */}
                                        <Tooltip title={`${trait.name}: ${trait.effect}`}>
                                            <div className="absolute top-2 right-2 p-1 rounded-full border bg-black z-20 hover:scale-110 transition-transform cursor-help" style={{ borderColor: trait.color, color: trait.color }}>
                                                {trait.icon}
                                            </div>
                                        </Tooltip>

                                        {isActive && <div className="absolute top-0 right-10 p-1 bg-red-600 text-black text-[10px] font-bold font-mono">交戰區</div>}

                                        {/* Result Stamps */}
                                        {isPast && historyResult === 'victory' && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center opacity-40 pointer-events-none rotate-[-15deg]">
                                                <div className="border-4 border-imperial-gold rounded-full p-4 text-imperial-gold text-4xl font-bold font-mono tracking-widest uppercase">
                                                    VICTORY
                                                </div>
                                            </div>
                                        )}
                                        {isPast && historyResult === 'defeat' && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center opacity-40 pointer-events-none rotate-[15deg]">
                                                <div className="border-4 border-red-600 rounded-full p-4 text-red-600 text-4xl font-bold font-mono tracking-widest uppercase">
                                                    DEFEAT
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                                            {isActive ? (
                                                <Crosshair className="text-red-500 w-10 h-10 animate-spin-slow" />
                                            ) : isFuture ? (
                                                <Lock className="text-zinc-700 w-8 h-8 group-hover:text-zinc-500 transition-colors" />
                                            ) : isPast ? (
                                                historyResult === 'victory' ? <Star className="text-imperial-gold w-8 h-8" /> : <Skull className="text-red-800 w-8 h-8" />
                                            ) : (
                                                <Star className="text-zinc-500 w-8 h-8 group-hover:text-imperial-gold transition-colors" />
                                            )}

                                            <h2 className={`!font-mono !m-0 text-2xl font-bold ${isActive ? '!text-white' : '!text-zinc-500'}`}>
                                                <span>{month.id}</span>
                                            </h2>

                                            <div className="flex gap-1 mt-2">
                                                <Tag color={isActive ? "gold" : isFuture ? "default" : "default"} className="font-mono !m-0">
                                                    <span>{count}</span> 專案
                                                </Tag>
                                                {!isPast && (
                                                    <Tag color={isDefended ? "success" : "error"} className="font-mono !m-0">
                                                        <span>{Math.round(garrisonPower / 100)}</span> PWR
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* PROJECT MODAL */}
                    {isModalOpen && (
                        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                            <div className="w-full max-w-2xl bg-zinc-950 border border-imperial-gold rounded-lg shadow-[0_0_50px_rgba(251,191,36,0.1)] flex flex-col max-h-[90vh] overflow-hidden">
                                {/* Header */}
                                <div className="flex justify-between items-center p-0 border-b border-zinc-800 bg-zinc-900/50 relative">
                                    <div className="flex items-center">
                                        <button
                                            className={`px-6 py-4 font-mono font-bold transition-all ${activeTab === 'projects' ? 'text-black bg-imperial-gold' : 'text-zinc-500 hover:text-white'}`}
                                            onClick={() => setActiveTab('projects')}
                                        >
                                            戰略專案
                                        </button>
                                        <button
                                            className={`px-6 py-4 font-mono font-bold transition-all ${activeTab === 'deployment' ? 'text-black bg-imperial-gold' : 'text-zinc-500 hover:text-white'}`}
                                            onClick={() => setActiveTab('deployment')}
                                        >
                                            部隊部署
                                        </button>
                                    </div>

                                    <div className="px-4 text-imperial-gold font-mono tracking-widest text-lg pr-12">
                                        {/* Current Location Display */}
                                        <span>星區: <span>{selectedMonth}</span></span>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white font-mono text-xl p-2 hover:bg-zinc-800 rounded transition-colors"
                                    >
                                        X
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 overflow-y-auto min-h-[400px]">
                                    {activeTab === 'deployment' && selectedMonth ? (
                                        <div className="flex flex-col gap-6 animate-fade-in">
                                            {/* Deployment Interface */}
                                            {(() => {
                                                const monthIndex = parseInt(selectedMonth!.slice(1)) - 1;
                                                const scalingThreat = Math.floor(500 * Math.pow(1.52, monthIndex));
                                                const garrison = armyStrength.garrisons[selectedMonth!] || { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
                                                const garrisonPower = (garrison.guardsmen * POWER_VALUES.guardsmen) + (garrison.spaceMarines * POWER_VALUES.spaceMarines) + (garrison.custodes * POWER_VALUES.custodes) + ((garrison.dreadnought || 0) * POWER_VALUES.dreadnought) + ((garrison.baneblade || 0) * POWER_VALUES.baneblade);

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center p-4 border border-zinc-800 rounded bg-zinc-900/50">
                                                            <div className="text-center">
                                                                <span className="block text-zinc-500 text-xs mb-1">本月威脅</span>
                                                                <span className="text-red-500 text-2xl font-bold font-mono">{scalingThreat}</span>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-mono text-zinc-600 text-xs">VS</span>
                                                                <span className={`font-bold ${garrisonPower >= scalingThreat ? 'text-green-500' : 'text-red-600 animate-pulse'}`}>
                                                                    {garrisonPower >= scalingThreat ? 'DEFENDED' : 'VULNERABLE'}
                                                                </span>
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="block text-zinc-500 text-xs mb-1">駐軍戰力</span>
                                                                <span className={`text-2xl font-bold font-mono ${garrisonPower >= scalingThreat ? 'text-imperial-gold' : 'text-red-500'}`}>
                                                                    {garrisonPower}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-4">
                                                            {/* Guardsmen Deployment */}
                                                            <div className="flex items-center gap-4 p-3 border border-zinc-800 rounded bg-black">
                                                                <div className="w-16 h-16 flex-shrink-0 border border-zinc-700 rounded overflow-hidden">
                                                                    <img src="/units/guardsman.png" alt="Guardsman" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-white font-bold">帝國衛隊</span>
                                                                        <span className="text-zinc-500 text-xs">威力: {POWER_VALUES.guardsmen}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">後備</span>
                                                                            <span className="text-green-500 font-bold">{armyStrength.reserves.guardsmen}</span>
                                                                        </div>
                                                                        <div className="flex-1 flex gap-2 justify-center">
                                                                            <Button size="small" onClick={() => recallUnit(selectedMonth!, 'guardsmen', 1)} disabled={garrison.guardsmen <= 0}>&lt;</Button>
                                                                            <div className="w-16 text-center text-white font-mono border-b border-zinc-700">{garrison.guardsmen}</div>
                                                                            <Button size="small" onClick={() => deployUnit(selectedMonth!, 'guardsmen', 1)} disabled={armyStrength.reserves.guardsmen <= 0}>&gt;</Button>
                                                                        </div>
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">部署</span>
                                                                            <span className="text-imperial-gold font-bold">{garrison.guardsmen}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Space Marine Deployment */}
                                                            <div className="flex items-center gap-4 p-3 border border-zinc-800 rounded bg-black">
                                                                <div className="w-16 h-16 flex-shrink-0 border border-imperial-gold rounded overflow-hidden">
                                                                    <img src="/units/marine.png" alt="Space Marine" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-white font-bold">星際戰士</span>
                                                                        <span className="text-zinc-500 text-xs">威力: {POWER_VALUES.spaceMarines}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">後備</span>
                                                                            <span className="text-blue-500 font-bold">{armyStrength.reserves.spaceMarines}</span>
                                                                        </div>
                                                                        <div className="flex-1 flex gap-2 justify-center">
                                                                            <Button size="small" onClick={() => recallUnit(selectedMonth!, 'space_marine', 1)} disabled={garrison.spaceMarines <= 0}>&lt;</Button>
                                                                            <div className="w-16 text-center text-white font-mono border-b border-zinc-700">{garrison.spaceMarines}</div>
                                                                            <Button size="small" onClick={() => deployUnit(selectedMonth!, 'space_marine', 1)} disabled={armyStrength.reserves.spaceMarines <= 0}>&gt;</Button>
                                                                        </div>
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">部署</span>
                                                                            <span className="text-imperial-gold font-bold">{garrison.spaceMarines}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Custodes Deployment */}
                                                            <div className="flex items-center gap-4 p-3 border border-zinc-800 rounded bg-black">
                                                                <div className="w-16 h-16 flex-shrink-0 border border-yellow-400 rounded overflow-hidden shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                                                    <img src="/units/custodes.png" alt="Custodes" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-white font-bold">帝皇禁軍</span>
                                                                        <span className="text-zinc-500 text-xs">威力: {POWER_VALUES.custodes}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">後備</span>
                                                                            <span className="text-yellow-500 font-bold">{armyStrength.reserves.custodes}</span>
                                                                        </div>
                                                                        <div className="flex-1 flex gap-2 justify-center">
                                                                            <Button size="small" onClick={() => recallUnit(selectedMonth!, 'custodes', 1)} disabled={garrison.custodes <= 0}>&lt;</Button>
                                                                            <div className="w-16 text-center text-white font-mono border-b border-zinc-700">{garrison.custodes}</div>
                                                                            <Button size="small" onClick={() => deployUnit(selectedMonth!, 'custodes', 1)} disabled={armyStrength.reserves.custodes <= 0}>&gt;</Button>
                                                                        </div>
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">部署</span>
                                                                            <span className="text-imperial-gold font-bold">{garrison.custodes}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Dreadnought Deployment */}
                                                            <div className="flex items-center gap-4 p-3 border border-zinc-800 rounded bg-black">
                                                                <div className="w-16 h-16 flex-shrink-0 border border-zinc-500 rounded overflow-hidden">
                                                                    <img src="/units/dreadnought.png" alt="Dreadnought" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-white font-bold">無畏機甲</span>
                                                                        <span className="text-zinc-500 text-xs">威力: {POWER_VALUES.dreadnought}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">後備</span>
                                                                            <span className="text-zinc-300 font-bold">{armyStrength.reserves.dreadnought}</span>
                                                                        </div>
                                                                        <div className="flex-1 flex gap-2 justify-center">
                                                                            <Button size="small" onClick={() => recallUnit(selectedMonth!, 'dreadnought', 1)} disabled={(garrison.dreadnought || 0) <= 0}>&lt;</Button>
                                                                            <div className="w-16 text-center text-white font-mono border-b border-zinc-700">{garrison.dreadnought || 0}</div>
                                                                            <Button size="small" onClick={() => deployUnit(selectedMonth!, 'dreadnought', 1)} disabled={armyStrength.reserves.dreadnought <= 0}>&gt;</Button>
                                                                        </div>
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">部署</span>
                                                                            <span className="text-imperial-gold font-bold">{garrison.dreadnought || 0}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Baneblade Deployment */}
                                                            <div className="flex items-center gap-4 p-3 border border-zinc-800 rounded bg-black">
                                                                <div className="w-16 h-16 flex-shrink-0 border border-red-500 rounded overflow-hidden">
                                                                    <img src="/units/baneblade.png" alt="Baneblade" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-white font-bold">帝皇毒刃</span>
                                                                        <span className="text-zinc-500 text-xs">威力: {POWER_VALUES.baneblade}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">後備</span>
                                                                            <span className="text-red-500 font-bold">{armyStrength.reserves.baneblade}</span>
                                                                        </div>
                                                                        <div className="flex-1 flex gap-2 justify-center">
                                                                            <Button size="small" onClick={() => recallUnit(selectedMonth!, 'baneblade', 1)} disabled={(garrison.baneblade || 0) <= 0}>&lt;</Button>
                                                                            <div className="w-16 text-center text-white font-mono border-b border-zinc-700">{garrison.baneblade || 0}</div>
                                                                            <Button size="small" onClick={() => deployUnit(selectedMonth!, 'baneblade', 1)} disabled={armyStrength.reserves.baneblade <= 0}>&gt;</Button>
                                                                        </div>
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs text-zinc-500">部署</span>
                                                                            <span className="text-imperial-gold font-bold">{garrison.baneblade || 0}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            {/* RESOLVE BUTTON (Current Month Only) */}
                                            {parseInt(selectedMonth!.slice(1)) - 1 === currentMonth && (
                                                <div className="mt-4 pt-4 border-t border-zinc-800">
                                                    <Button
                                                        danger // Red button for critical action
                                                        size="large"
                                                        block
                                                        className="!h-16 !text-xl !font-bold !font-mono tracking-widest uppercase !bg-red-900/20 hover:!bg-red-600 hover:!text-black !border-red-600 animate-pulse"
                                                        onClick={() => {
                                                            Modal.confirm({
                                                                title: '確認戰役結算 (RESOLVE SECTOR)',
                                                                content: '您確定要結束本月的部署並進行戰鬥結算嗎？一旦執行，戰果將無法撤銷，並且時間將推進到下個月。',
                                                                okText: '為了帝皇！(執行)',
                                                                cancelText: '取消',
                                                                className: 'imperial-modal',
                                                                onOk: () => {
                                                                    resolveSector(selectedMonth!);
                                                                    setIsModalOpen(false); // Close Modal
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        🛑 結算本月戰役 (RESOLVE)
                                                    </Button>
                                                    <span className="block text-center text-red-500/50 text-xs mt-2 font-mono">
                                                        警告：失敗將招致永久腐化
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : sectorHistory[selectedMonth!] ? (
                                        // PAST MONTH VIEW (Result)
                                        <div key="result-view" className="flex flex-col items-center justify-center h-full gap-6 p-8">
                                            <div className="text-6xl animate-bounce">
                                                {sectorHistory[selectedMonth!] === 'victory' ? '🏅' : '💀'}
                                            </div>
                                            <h2 className={`text-4xl font-bold font-mono tracking-widest ${sectorHistory[selectedMonth!] === 'victory' ? 'text-imperial-gold' : 'text-red-600'}`}>
                                                {sectorHistory[selectedMonth!] === 'victory' ? 'SECTOR SECURED' : 'SECTOR LOST'}
                                            </h2>
                                            <div className="text-zinc-500 font-mono text-center">
                                                該星區的戰役已經結束。<br />
                                                歷史已由勝者書寫。
                                            </div>
                                        </div>
                                    ) : activeProject ? (
                                        // PROJECT MISSION VIEW (Drill-down)
                                        <div key="drill-down" className="flex flex-col gap-6">
                                            {/* Keep existing Drill-down content */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="block text-zinc-500 text-xs font-mono mb-1">行動目標</span>
                                                    <h4 className="!text-white !m-0 text-lg font-bold"><span>{activeProject?.title || '未知專案'}</span></h4>
                                                </div>
                                                <Tag color="volcano" className="font-mono">難度 <span>{activeProject?.difficulty || 1}</span></Tag>
                                            </div>

                                            {/* SubTasks List */}
                                            <div className="flex flex-col gap-2">
                                                <span className="block text-imperial-gold/70 font-mono text-xs mb-1">任務日誌 (<span>{((activeProject?.subTasks || []).filter(t => t.completed).length)}</span>/<span>{((activeProject?.subTasks || []).length)}</span>)</span>

                                                {/* Safe List Rendering */}
                                                {(activeProject?.subTasks || []).length === 0 ? (
                                                    <div className="p-8 border border-dashed border-zinc-800 rounded flex flex-col items-center justify-center text-zinc-600">
                                                        <div className="text-4xl mb-2 opacity-50">📝</div>
                                                        <span className="font-mono text-xs text-center block">尚未建立目標</span>
                                                        <span className="font-mono text-xs text-center text-imperial-gold/50 animate-pulse block">等待輸入指令...</span>
                                                    </div>
                                                ) : (
                                                    (activeProject?.subTasks || []).map((st, idx) => (
                                                        <div
                                                            key={st.id || idx}
                                                            className={`flex items-center gap-3 p-3 rounded border transition-all ${st.completed ? 'bg-green-900/20 border-green-900/50 opacity-50' : 'bg-zinc-900 border-zinc-700'}`}
                                                        >
                                                            <div
                                                                className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer ${st.completed ? 'bg-green-500 border-green-500 text-black' : 'border-zinc-500'}`}
                                                                onClick={() => st.id && !st.completed && completeSubTask(activeProject?.id || '', st.id)}
                                                            >
                                                                {st.completed && <span>✓</span>}
                                                            </div>
                                                            <span className={`${st.completed ? 'line-through text-green-500' : 'text-white'}`}>
                                                                <span>{st.title || '任務目標'}</span>
                                                            </span>
                                                        </div>
                                                    ))
                                                )}

                                                {/* Add SubTask Input - Safe Version */}
                                                <div className="flex gap-2 mt-4 p-4 bg-zinc-900/50 rounded border border-zinc-800">
                                                    <input
                                                        value={subTaskTitle}
                                                        onChange={e => setSubTaskTitle(e.target.value)}
                                                        placeholder="> 輸入新目標座標..."
                                                        className="flex-1 bg-black text-white border border-zinc-700 p-2 font-mono focus:border-imperial-gold outline-none"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                                                    />
                                                    <button
                                                        onClick={handleAddSubTask}
                                                        disabled={!subTaskTitle.trim()}
                                                        className="bg-yellow-600 text-black font-bold px-4 py-2 hover:bg-yellow-500 disabled:opacity-50"
                                                    >
                                                        增加
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // MONTH OVERVIEW (Project List)
                                        <div key="list-view" className="flex flex-col gap-6">
                                            {/* Project List */}
                                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                                                {monthProjects.length === 0 && <span className="text-zinc-500 text-center py-4 block">此星區尚無部屬行動。</span>}
                                                {monthProjects.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="flex justify-between items-center p-3 bg-zinc-900 border border-zinc-700 rounded cursor-pointer hover:border-imperial-gold hover:bg-zinc-800 transition-all"
                                                        onClick={() => handleProjectClick(p)}
                                                    >
                                                        <div>
                                                            <div className="text-imperial-gold font-bold"><span>{p.title}</span></div>
                                                            <div className="text-xs text-zinc-500">難度: <span>{p.difficulty}</span> • <span>{(p.subTasks || []).length}</span> 個目標</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-right">
                                                                <div className="text-xs text-zinc-400 font-mono">
                                                                    <span>{Math.round(((p.subTasks || []).filter(t => t.completed).length / ((p.subTasks || []).length || 1)) * 100)}</span>%
                                                                </div>
                                                                <Progress
                                                                    percent={((p.subTasks || []).filter(t => t.completed).length / ((p.subTasks || []).length || 1)) * 100}
                                                                    size="small"
                                                                    showInfo={false}
                                                                    strokeColor="#fbbf24"
                                                                    trailColor="#333"
                                                                    className="w-16 !m-0"
                                                                />
                                                            </div>
                                                            <Tag color={p.completed ? "green" : "volcano"}>
                                                                {p.completed ? "已確保" : "進行中"}
                                                            </Tag>

                                                            {/* Action Buttons */}
                                                            <div className="flex items-center gap-2">
                                                                {/* Delete Button (Only for empty projects or debug) */}
                                                                {(p.subTasks || []).length === 0 && (
                                                                    <Button
                                                                        type="text"
                                                                        danger
                                                                        className="!px-2 !py-0 !h-6 hover:!bg-red-900/50 font-mono text-[10px]"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (deleteProject) deleteProject(p.id);
                                                                        }}
                                                                    >
                                                                        DEL
                                                                    </Button>
                                                                )}

                                                                <div className="flex items-center gap-1 text-imperial-gold/50 group-hover:text-imperial-gold transition-colors font-mono text-xs tracking-wider">
                                                                    <span>開啟</span>
                                                                    <ChevronRight size={16} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Project Form - Native HTML Version */}
                                            <div className="border-t border-zinc-800 pt-4">
                                                <span className="block text-imperial-gold/70 mb-2 font-mono text-xs">部屬新專案</span>
                                                <div className="flex gap-2">
                                                    <input
                                                        name="title"
                                                        placeholder="專案名稱"
                                                        className="flex-1 bg-black text-white border border-zinc-700 p-2 font-mono focus:border-imperial-gold outline-none"
                                                        id="new-project-title"
                                                    />
                                                    <select
                                                        name="difficulty"
                                                        className="bg-black text-white border border-zinc-700 p-2 font-mono focus:border-imperial-gold outline-none w-24"
                                                        id="new-project-difficulty"
                                                    >
                                                        {[1, 2, 3, 4, 5].map(v => (
                                                            <option key={v} value={v}>Lvl {v}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            const titleInput = document.getElementById('new-project-title') as HTMLInputElement;
                                                            const diffInput = document.getElementById('new-project-difficulty') as HTMLSelectElement;
                                                            if (titleInput && titleInput.value) {
                                                                handleAddProject({ title: titleInput.value, difficulty: Number(diffInput.value) });
                                                                titleInput.value = ''; // Clean reset
                                                            }
                                                        }}
                                                        className="bg-yellow-600 text-black font-bold px-4 py-2 hover:bg-yellow-500"
                                                    >
                                                        部署
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                );
};
