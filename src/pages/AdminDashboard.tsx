
import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button, Input, Card, Statistic, Table, Tag, message, Collapse, Tabs } from 'antd';
import { Save, AlertTriangle, Shield, Coins, Star, Trash2, FileText, RefreshCw } from 'lucide-react'; // Added icons
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const { Panel } = Collapse;

export const AdminDashboard: React.FC = () => {
    const {
        resources, corruption, armyStrength, tasks,
        debugSetResources, debugSetCorruption, debugSetArmyStrength,
        deleteTask, updateTask
    } = useGame();
    const { getToken } = useAuth();

    // Logs State
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const token = await getToken();
            if (token) {
                const data = await api.getLogs(100, 0, token); // Limit 100
                setLogs(data);
            }
        } catch (e) {
            message.error("Failed to fetch logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const [localRp, setLocalRp] = useState(resources.rp);
    const [localGlory, setLocalGlory] = useState(resources.glory);
    const [localCorruption, setLocalCorruption] = useState(corruption);

    // Sync local state when context changes (initial load)
    useEffect(() => {
        setLocalRp(resources.rp);
        setLocalGlory(resources.glory);
        setLocalCorruption(corruption);
    }, [resources, corruption]);

    const handleSaveResources = () => {
        debugSetResources({ rp: Number(localRp), glory: Number(localGlory) });
        message.success("Resources updated! (Auto-syncing to Void...)");
    };

    const handleSaveCorruption = () => {
        debugSetCorruption(Number(localCorruption));
        message.success("Corruption level updated!");
    };

    const taskColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 100, ellipsis: true },
        { title: 'Title', dataIndex: 'title', key: 'title' },
        {
            title: 'Faction',
            dataIndex: 'faction',
            key: 'faction',
            render: (tag: string) => <Tag>{tag}</Tag>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'completed' ? 'green' : 'blue'}>{status}</Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button size="small" onClick={() => updateTask(record.id, { status: 'completed', lastCompletedAt: new Date() })}>Complete</Button>
                    <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => deleteTask(record.id)} />
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-8 font-mono">
            <header className="mb-8 border-b border-imperial-gold/30 pb-4 flex justify-between items-center">
                <h1 className="text-3xl text-imperial-gold tracking-widest uppercase">
                    <Shield className="inline mr-2 mb-1" />
                    Inquisition Administration Console
                </h1>
                <div className="text-zinc-500">ACCESS LEVEL: OMEGA <span className="text-xs text-green-500 ml-2">v2.3.1 (Audit Live)</span></div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Audit Logs (Moved to Top for Visibility) */}
                <Card title={<span className="text-zinc-400">Log Cogitator (Audit Records)</span>} className="!bg-black/50 !border-zinc-700/30 md:col-span-2">
                    <div className="mb-4 flex justify-end">
                        <Button icon={<RefreshCw size={14} />} onClick={fetchLogs} loading={loadingLogs}>Refresh Logs</Button>
                    </div>
                    <Table
                        dataSource={logs}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                        className="dark-table"
                        scroll={{ x: true }}
                        columns={[
                            {
                                title: 'Time',
                                dataIndex: 'created_at',
                                key: 'time',
                                render: (d: string) => <span className="text-zinc-500">{dayjs(d).format('MM-DD HH:mm:ss')}</span>,
                                width: 140
                            },
                            {
                                title: 'User',
                                dataIndex: 'user_id',
                                key: 'user',
                                ellipsis: true,
                                render: (u: string) => <span className="text-xs text-zinc-600">{u.slice(0, 8)}...</span>
                            },
                            {
                                title: 'Category',
                                dataIndex: 'category',
                                key: 'cat',
                                render: (c: string) => {
                                    let color = 'default';
                                    if (c === 'rp') color = 'gold';
                                    if (c === 'glory') color = 'blue';
                                    if (c === 'corruption') color = 'red';
                                    return <Tag color={color}>{c.toUpperCase()}</Tag>;
                                }
                            },
                            {
                                title: 'Change',
                                key: 'change',
                                render: (_: any, r: any) => {
                                    const isPos = r.change_type === 'increase';
                                    return (
                                        <span className={isPos ? 'text-green-500' : 'text-red-500'}>
                                            {isPos ? '+' : '-'}{r.amount}
                                        </span>
                                    );
                                }
                            },
                            { title: 'Reason', dataIndex: 'reason', key: 'reason' }
                        ]}
                    />
                </Card>
                {/* Resources Panel */}
                <Card title={<span className="text-imperial-gold">Resource Override</span>} className="!bg-black/50 !border-imperial-gold/30">
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs mb-1 text-zinc-400">Emperor's Wrath (RP)</label>
                            <Input
                                prefix={<Coins size={14} />}
                                value={localRp}
                                onChange={e => setLocalRp(Number(e.target.value))}
                                className="!bg-black !text-white !border-zinc-700"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs mb-1 text-zinc-400">Glory</label>
                            <Input
                                prefix={<Star size={14} />}
                                value={localGlory}
                                onChange={e => setLocalGlory(Number(e.target.value))}
                                className="!bg-black !text-white !border-zinc-700"
                            />
                        </div>
                    </div>
                    <Button type="primary" icon={<Save size={14} />} onClick={handleSaveResources} className="!bg-imperial-gold !text-black w-full">
                        Update Resources
                    </Button>
                </Card>

                {/* Corruption Panel */}
                <Card title={<span className="text-red-500">Warp Corruption</span>} className="!bg-black/50 !border-red-900/30">
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-zinc-400">Corruption Level (0-100)</label>
                            <span className={`text-xl font-bold ${localCorruption > 90 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {localCorruption}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={localCorruption}
                            onChange={e => setLocalCorruption(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>
                    <Button danger icon={<AlertTriangle size={14} />} onClick={handleSaveCorruption} className="w-full">
                        Set Corruption Level
                    </Button>
                </Card>

                {/* Army Data (Read-onlyish for now) */}
                <Card title={<span className="text-blue-400">Militarum Data</span>} className="!bg-black/50 !border-blue-900/30 md:col-span-2">
                    <Collapse ghost>
                        <Panel header="Raw Army Strength Data" key="1">
                            <pre className="bg-black p-4 rounded text-xs text-green-500 overflow-auto max-h-60">
                                {JSON.stringify(armyStrength, null, 2)}
                            </pre>
                        </Panel>
                    </Collapse>
                </Card>

                {/* Task Management */}
                <Card title={<span className="text-green-400">Task Force Manifest</span>} className="!bg-black/50 !border-green-900/30 md:col-span-2">
                    <Table
                        dataSource={tasks}
                        columns={taskColumns}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                        className="dark-table"
                    />
                </Card>

                {/* Audit Logs */}
                <Card title={<span className="text-zinc-400">Log Cogitator (Audit Records)</span>} className="!bg-black/50 !border-zinc-700/30 md:col-span-2">
                    <div className="mb-4 flex justify-end">
                        <Button icon={<RefreshCw size={14} />} onClick={fetchLogs} loading={loadingLogs}>Refresh Logs</Button>
                    </div>
                    <Table
                        dataSource={logs}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        size="small"
                        className="dark-table"
                        scroll={{ x: true }}
                        columns={[
                            {
                                title: 'Time',
                                dataIndex: 'created_at',
                                key: 'time',
                                render: (d: string) => <span className="text-zinc-500">{dayjs(d).format('MM-DD HH:mm:ss')}</span>,
                                width: 140
                            },
                            {
                                title: 'User',
                                dataIndex: 'user_id',
                                key: 'user',
                                ellipsis: true,
                                render: (u: string) => <span className="text-xs text-zinc-600">{u.slice(0, 8)}...</span>
                            },
                            {
                                title: 'Category',
                                dataIndex: 'category',
                                key: 'cat',
                                render: (c: string) => {
                                    let color = 'default';
                                    if (c === 'rp') color = 'gold';
                                    if (c === 'glory') color = 'blue';
                                    if (c === 'corruption') color = 'red';
                                    return <Tag color={color}>{c.toUpperCase()}</Tag>;
                                }
                            },
                            {
                                title: 'Change',
                                key: 'change',
                                render: (_: any, r: any) => {
                                    const isPos = r.change_type === 'increase';
                                    return (
                                        <span className={isPos ? 'text-green-500' : 'text-red-500'}>
                                            {isPos ? '+' : '-'}{r.amount}
                                        </span>
                                    );
                                }
                            },
                            { title: 'Reason', dataIndex: 'reason', key: 'reason' }
                        ]}
                    />
                </Card>
            </div>
        </div>
    );
};
