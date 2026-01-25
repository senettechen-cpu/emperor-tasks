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
                    {/* Stable container used to prevent removeChild errors from browser extensions */}
                    <span style={{ display: (viewMode === 'mandates' && onEdit) ? 'inline-block' : 'none' }}>
                        <Tooltip title="修改參數">
                            <Button
                                size="small"
                                className="!bg-blue-900/20 !border-blue-500/50 hover:!bg-blue-500 hover:!text-black !text-blue-500 !p-1 h-7 w-7 flex items-center justify-center transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEdit) onEdit(record);
                                }}
                            >
                                <FileEdit size={14} />
                            </Button>
                        </Tooltip>
                    </span>

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
                    {onOpenAddModal && (
                        <Button
                            size="small"
                            icon={<Plus size={14} />}
                            className="!bg-imperial-gold/10 !border-imperial-gold/30 !text-imperial-gold hover:!bg-imperial-gold hover:!text-black flex items-center justify-center h-6 text-[10px] font-mono"
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

            <Table
                dataSource={tasks}
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

            <style>{`
                .imperial-table .ant-table {
                    background: transparent !important;
                    color: #fbbf24 !important;
                }
                .imperial-table .ant-table-thead > tr > th {
                    background: rgba(251, 191, 36, 0.05) !important;
                    color: rgba(251, 191, 36, 0.5) !important;
                    text-transform: uppercase;
                    font-size: 10px;
                    letter-spacing: 0.1em;
                    border-bottom: 1px solid rgba(251, 191, 36, 0.1) !important;
                    font-family: monospace;
                }
                .imperial-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid rgba(251, 191, 36, 0.05) !important;
                }
                .imperial-table .ant-table-tbody > tr:hover > td {
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
};

export default TaskDataSlate;
