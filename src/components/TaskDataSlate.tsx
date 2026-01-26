import React, { useMemo } from 'react';
import { Table, Button, Tag, Tooltip } from 'antd';
import { Shield, Trash2, Target, Sword, Activity, Plus, FileEdit } from 'lucide-react';
import { Task, Faction } from '../types';

// Removed Text destructured from Typography to prevent accidental usage

interface TaskDataSlateProps {
    tasks: Task[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onPurge: (id: string) => void;
    onOpenAddModal?: () => void;
    onEdit?: (task: Task) => void;
    viewMode?: 'active' | 'mandates';
    onToggleView?: (mode: 'active' | 'mandates') => void;
}

const FACTION_ICONS: Record<Faction, React.ReactNode> = {
    'nurgle': <Activity size={14} className="text-green-500" />,
    'khorne': <Sword size={14} className="text-red-500" />,
    'tzeentch': <Target size={14} className="text-blue-500" />,
    'slaanesh': <Activity size={14} className="text-purple-500" />,
    'orks': <Activity size={14} className="text-orange-500" />,
    'necrons': <Shield size={14} className="text-zinc-400" />,
    'default': <Shield size={14} className="text-imperial-gold" />,
};

const TaskDataSlate: React.FC<TaskDataSlateProps> = ({
    tasks, selectedId, onSelect, onPurge, onOpenAddModal,
    onEdit, viewMode = 'active', onToggleView
}) => {
    const [showTodayOnly, setShowTodayOnly] = React.useState(false);

    const sortedTasks = useMemo(() => {
        let filtered = [...tasks];

        if (showTodayOnly) {
            const todayStr = new Date().toLocaleDateString();
            filtered = filtered.filter(t => {
                const isDueToday = new Date(t.dueDate).toLocaleDateString() === todayStr;
                const isOverdue = new Date(t.dueDate) < new Date();
                return isDueToday || isOverdue; // Show today AND overdue
            });
        }

        return filtered.sort((a, b) => {
            const now = new Date().getTime();
            const timeA = new Date(a.dueDate).getTime();
            const timeB = new Date(b.dueDate).getTime();
            const isOverdueA = timeA < now;
            const isOverdueB = timeB < now;

            // 1. Overdue first
            if (isOverdueA && !isOverdueB) return -1;
            if (!isOverdueA && isOverdueB) return 1;

            // 2. Date Ascending (Soonest first)
            return timeA - timeB;
        });
    }, [tasks, showTodayOnly]);

    const columns = useMemo(() => [
        {
            title: '辨識碼',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id: string) => <span className="text-[10px] font-mono text-imperial-gold/30"><span>#{id.slice(0, 4)}</span></span>,
        },
        {
            title: '細別',
            key: 'type',
            width: 100,
            render: (_: any, record: Task) => (
                <Tag
                    className={`!bg-transparent !border-0 font-mono text-[9px] px-1 ${record.isRecurring ? 'text-cyan-400 border border-cyan-400/30' : 'text-imperial-gold/40'}`}
                >
                    <span>{record.isRecurring ? '〔法令〕' : '〔臨時〕'}</span>
                </Tag>
            )
        },
        {
            title: '威脅源',
            dataIndex: 'faction',
            key: 'faction',
            width: 100,
            render: (faction: Faction) => (
                <div className="flex items-center gap-2">
                    {FACTION_ICONS[faction]}
                    <span className="text-xs uppercase font-mono text-imperial-gold/50"><span>{faction}</span></span>
                </div>
            ),
        },
        {
            title: '目標內容',
            dataIndex: 'title',
            key: 'title',
            render: (title: string, record: Task) => (
                <span
                    className={`font-mono transition-colors ${record.id === selectedId ? 'text-green-400' : 'text-green-500/80'}`}
                >
                    <span>{title}</span>
                </span>
            ),
        },
        {
            title: '威脅等級',
            dataIndex: 'difficulty',
            key: 'difficulty',
            width: 120,
            render: (diff: number) => (
                <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-3 border border-imperial-gold/20 ${i < diff ? 'bg-red-600/60 shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'bg-transparent'}`}
                        />
                    ))}
                </div>
            ),
        },
        {
            title: '期限',
            dataIndex: 'dueDate',
            key: 'dueDate',
            width: 150,
            render: (date: Date) => {
                const isOverdue = new Date(date) < new Date();
                return <span className={`font-mono text-xs ${isOverdue ? 'text-red-500 animate-pulse font-bold' : 'text-imperial-gold/60'}`}><span>{new Date(date).toLocaleString()}</span></span>;
            }
        },
        {
            title: '指令',
            key: 'actions',
            width: 140,
            render: (_: any, record: Task) => (
                <div className="flex gap-2">
                    {/* Edit Button - Always visible if handler provided */}
                    {onEdit && (
                        <Tooltip title="修改參數">
                            <Button
                                size="small"
                                className="!bg-blue-900/20 !border-blue-500/50 hover:!bg-blue-500 hover:!text-black !text-blue-500 !p-1 h-7 w-7 flex items-center justify-center transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(record);
                                }}
                            >
                                <FileEdit size={14} />
                            </Button>
                        </Tooltip>
                    )}

                    <Tooltip title="執行淨化">
                        <Button
                            size="small"
                            className="!bg-green-900/20 !border-green-500/50 hover:!bg-green-500 hover:!text-black !text-green-500 !p-1 h-7 w-7 flex items-center justify-center transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPurge(record.id);
                            }}
                        >
                            <Shield size={14} />
                        </Button>
                    </Tooltip>
                    <Tooltip title="標記無效">
                        <Button
                            size="small"
                            className="!bg-red-900/20 !border-red-500/50 hover:!bg-red-500 hover:!text-black !text-red-500 !p-1 h-7 w-7 flex items-center justify-center transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPurge(record.id);
                            }}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </Tooltip>
                </div>
            ),
        },
    ], [selectedId, viewMode, onEdit, onPurge]);

    return (
        <div
            className="w-full border border-imperial-gold/20 bg-black/60 backdrop-blur-md relative overflow-hidden flex flex-col"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-imperial-gold/30 to-transparent" />
            <header className="px-4 py-2 border-b border-imperial-gold/10 flex justify-between items-center bg-imperial-gold/5">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <div
                            className={`cursor-pointer px-2 py-1 text-[10px] font-mono tracking-[0.2em] transition-colors ${viewMode === 'active' ? 'text-imperial-gold border-b border-imperial-gold' : 'text-imperial-gold/40 hover:text-imperial-gold/70'}`}
                            onClick={() => onToggleView && onToggleView('active')}
                        >
                            ACTIVE MISSIONS
                        </div>
                        <div className="w-px h-4 bg-imperial-gold/20" />
                        <div
                            className={`cursor-pointer px-2 py-1 text-[10px] font-mono tracking-[0.2em] transition-colors ${viewMode === 'mandates' ? 'text-cyan-400 border-b border-cyan-400' : 'text-imperial-gold/40 hover:text-cyan-400/70'}`}
                            onClick={() => onToggleView && onToggleView('mandates')}
                        >
                            MANDATE PROTOCOLS
                        </div>
                    </div>
                    {/* Today Filter Toggle */}
                    <div
                        className={`cursor-pointer px-2 py-1 text-[10px] font-mono tracking-[0.1em] border transition-all ${showTodayOnly ? 'border-green-500 text-green-500 bg-green-900/10' : 'border-imperial-gold/20 text-imperial-gold/40 hover:border-imperial-gold/50'}`}
                        onClick={() => setShowTodayOnly(!showTodayOnly)}
                    >
                        [ {showTodayOnly ? 'TODAY ONLY' : 'SHOW ALL'} ]
                    </div>

                    {onOpenAddModal && (
                        <Button
                            size="small"
                            icon={<Plus size={14} />}
                            className="!bg-imperial-gold/10 !border-imperial-gold/30 !text-imperial-gold hover:!bg-imperial-gold hover:!text-black flex items-center justify-center h-6 text-[10px] font-mono ml-2"
                            onClick={onOpenAddModal}
                        >
                            NEW DEPLOYMENT
                        </Button>
                    )}
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <span className="text-[9px] font-mono text-green-500 opacity-50 underline">ENCRYPTED LINK STABLE</span>
                    </div>
                </div>
            </header>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Table
                    dataSource={sortedTasks}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    className="imperial-table"
                    onRow={(record) => ({
                        onMouseEnter: () => onSelect(record.id),
                        onMouseLeave: () => onSelect(null),
                        onClick: () => onSelect(record.id === selectedId ? null : record.id),
                    })}
                    rowClassName={(record) => `cursor-pointer transition-all duration-300 ${record.id === selectedId ? 'bg-green-500/10 border-l-2 border-green-500' : 'hover:bg-imperial-gold/5'}`}
                />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-3 p-4 pb-20">
                {sortedTasks.map(task => {
                    const isOverdue = new Date(task.dueDate) < new Date();
                    return (
                        <div
                            key={task.id}
                            className={`p-4 border ${task.id === selectedId ? 'border-green-500 bg-green-900/10' : 'border-zinc-800 bg-zinc-900/40'} rounded-lg transition-all`}
                            onClick={() => onSelect(task.id === selectedId ? null : task.id)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className={`font-mono text-lg font-bold ${task.id === selectedId ? 'text-green-400' : 'text-green-500'}`}>
                                        {task.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Tag className="!bg-transparent !border-zinc-700 !text-zinc-500 !m-0 text-[10px]">
                                            #{task.id.slice(0, 4)}
                                        </Tag>
                                        {task.isRecurring && (
                                            <Tag className="!bg-cyan-900/20 !border-cyan-500/30 !text-cyan-400 !m-0 text-[10px]">
                                                法令
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {FACTION_ICONS[task.faction]}
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-2 border border-imperial-gold/20 ${i < task.difficulty ? 'bg-red-600/60' : 'bg-transparent'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mt-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 font-mono">DEADLINE</span>
                                    <span className={`font-mono text-sm ${isOverdue ? 'text-red-500 animate-pulse font-bold' : 'text-imperial-gold/80'}`}>
                                        {new Date(task.dueDate).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        size="middle"
                                        className="!bg-green-600 !border-green-500 !text-white !h-10 !px-6 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPurge(task.id);
                                        }}
                                    >
                                        <Shield size={18} />
                                        <span className="font-bold tracking-widest">淨化</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .imperial-table .ant-table {
                    background: transparent !important;
                    color: #fbbf24 !important;
                }
                .imperial-table .ant-table-thead > tr > th {
                    background: rgba(251, 191, 36, 0.05) !important;
                    color: rgba(251, 191, 36, 0.5) !important;
                    text-transform: uppercase;
                    font-size: 14px; /* Increased from 10px */
                    letter-spacing: 0.1em;
                    border-bottom: 1px solid rgba(251, 191, 36, 0.1) !important;
                    font-family: monospace;
                }
                .imperial-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid rgba(251, 191, 36, 0.05) !important;
                    font-size: 16px; /* Increased base font size */
                }
                .imperial-table .ant-table-tbody > tr:hover > td {
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
};

export default TaskDataSlate;
