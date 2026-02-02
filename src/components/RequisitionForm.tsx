
import React, { useState, useEffect } from 'react';
import { Drawer, Button, Input, Select, Progress, message, List, Empty } from 'antd';
import { Save, Trash2, PieChart, AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types/ledger';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../constants/ledger';

import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

interface RequisitionFormProps {
    visible: boolean;
    onClose: () => void;
}

// const STORAGE_KEY = 'imperial_ledger_expenses'; // Deprecated

export const RequisitionForm: React.FC<RequisitionFormProps> = ({ visible, onClose }) => {
    // Auth
    const { getToken } = useAuth();
    const { modifyResources } = useGame();

    // Form State
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<ExpenseCategory>("飲食");
    const [itemName, setItemName] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

    // List State
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Responsive Check
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load Data
    const loadExpenses = async () => {
        const token = await getToken();
        if (token) {
            import('../services/api').then(m => m.api.getExpenses(token))
                .then(data => setExpenses(data))
                .catch(err => console.error("Failed to load expenses:", err));
        }
    };

    useEffect(() => {
        if (visible) loadExpenses();
    }, [visible]);

    // Helpers
    const getImperialDate = (dateStr: string) => {
        const d = new Date(dateStr);
        // Fake Imperial Date M3.2024...
        // Format: 0 126 024.M3 (Check number + Year fraction + Year)
        // Simple mock:
        return `0.${String(Math.floor(Math.random() * 999)).padStart(3, '0')}.${d.getFullYear()}.M3`;
    };

    const getIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName];
        return IconComponent ? <IconComponent size={16} /> : <LucideIcons.Box size={16} />;
    };

    // Calculate Summary
    const totalCost = expenses.reduce((sum, item) => sum + item.amount, 0);
    const moraleCost = expenses
        .filter(e => e.category === "娛樂")
        .reduce((sum, item) => sum + item.amount, 0);

    const moralePercentage = totalCost > 0 ? (moraleCost / totalCost) * 100 : 0;
    const isSlaaneshCorrupted = moralePercentage > 30;

    // Handlers
    const handleSubmit = async () => {
        if (!itemName || amount <= 0) {
            message.error("Data Slate Incomplete. Required fields missing.");
            return;
        }

        const newExpense: Expense = {
            id: Date.now().toString(), // Temp ID, backend handles actual persistence but we send one
            date: new Date(date),
            category,
            itemName,
            amount,
            paymentMethod
        };

        try {
            const token = await getToken();
            if (!token) throw new Error("No Cogitator Link (Offline)");

            await import('../services/api').then(m => m.api.addExpense(newExpense, token));

            // Reward Glory
            modifyResources(0, 50, "Ledger Entry (Requisition Filed)");

            // Play Sound (Mock)
            const audio = new Audio('/sounds/deploy.mp3');
            audio.play().catch(() => { });

            message.success("Requisition Authorized. Resources allocated.");

            // Reload
            loadExpenses();

            // Lore Feedback
            if (category === "房貸") {
                message.warning("Hive Habitation Tithe Renewed. The Governor is pleased.");
            }
            if (isSlaaneshCorrupted) {
                // Check if *adding* this made it go over
                const newTotal = totalCost + amount;
                const newMorale = category === "娛樂" ? moraleCost + amount : moraleCost;
                if ((newMorale / newTotal) > 0.3) {
                    message.error({
                        content: "WARNING: Slaanesh Corruption Detected! Excessive morale consumption.",
                        duration: 5,
                        className: 'glitch-container text-red-500' // Custom class
                    });
                }
            }

            // Reset
            setItemName('');
            setAmount(0);

        } catch (e) {
            console.error(e);
            message.error("Transaction Failed. Machine Spirit Unresponsive.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const token = await getToken();
            if (!token) return;
            await import('../services/api').then(m => m.api.deleteExpense(id, token));
            setExpenses(prev => prev.filter(e => e.id !== id));
            message.info("Record expunged from local Cogitator.");
        } catch (e) {
            message.error("Expunge Failed.");
        }
    };

    return (
        <Drawer
            title={
                <div className="flex items-center gap-2 text-[#33ff00]">
                    <PieChart size={20} />
                    <span className="font-mono tracking-widest text-lg">帝國後勤總帳 (IMPERIAL LEDGER)</span>
                </div>
            }
            placement="left"
            onClose={onClose}
            open={visible}
            width={isMobile ? '100%' : 480}
            styles={{
                header: { backgroundColor: '#0a0f0d', borderBottom: '1px solid #c5a059' },
                body: {
                    backgroundColor: '#0a0f0d',
                    color: '#33ff00',
                    fontFamily: "'Share Tech Mono', monospace",
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0px, rgba(0, 0, 0, 0.2) 1px, transparent 1px, transparent 2px)',
                },
                content: { backgroundColor: '#0a0f0d' }
            }}
            closeIcon={<span className="text-[#33ff00] text-3xl font-bold p-2">✕</span>}
            className="imperial-ledger-drawer"
        >
            <div className={`flex flex-col gap-6 relative h-full ${isSlaaneshCorrupted ? 'glitch-container' : ''}`}>
                {/* CSS Scanline Overlay (No Image Required) */}
                <div className="absolute inset-0 pointer-events-none z-50 mix-blend-overlay opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                        backgroundSize: '100% 2px, 3px 100%'
                    }}
                />

                {/* Summary Section */}
                <div className="p-4 border border-[#c5a059] bg-[#33ff00]/5 relative overflow-hidden">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="block text-[#c5a059] text-xs tracking-widest mb-1 uppercase">Total Resource Consumption</span>
                            <span className="text-3xl font-mono text-[#33ff00] font-bold">
                                ₮ {totalCost.toLocaleString()}
                            </span>
                        </div>
                        {isSlaaneshCorrupted && (
                            <div className="flex items-center gap-1 text-red-500 animate-pulse">
                                <AlertTriangle size={16} />
                                <span className="text-xs font-bold">HERESY DETECTED</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Form */}
                <div className="flex flex-col gap-4 p-4 border border-[#c5a059]/30">
                    <label className="text-[#c5a059] text-xs uppercase tracking-widest">Requisition Protocol</label>

                    {/* Date */}
                    <div className="w-full">
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="!bg-black !text-[#33ff00] !border-[#c5a059]/50 font-mono w-full"
                            style={{ maxWidth: '100%' }}
                        />
                    </div>

                    {/* Category */}
                    <Select
                        value={category}
                        onChange={setCategory}
                        className="w-full imperial-select"
                        options={Object.entries(EXPENSE_CATEGORIES).map(([key, detail]) => ({
                            label: (
                                <div className="flex items-center gap-2 text-[#33ff00]">
                                    {getIcon(detail.icon)}
                                    <span>{detail.label}</span>
                                </div>
                            ),
                            value: key
                        }))}
                        popupClassName="!bg-[#0a0f0d] !border !border-[#c5a059]"
                    />

                    {/* Item Name */}
                    <Input
                        placeholder="物資清單 / Manifest Detail"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                        className="!bg-black !text-[#33ff00] !border-[#c5a059]/50 font-mono placeholder:!text-[#33ff00]/30"
                    />

                    {/* Amount */}
                    <Input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        placeholder="消耗點數 / Cost"
                        value={amount}
                        // @ts-ignore
                        onFocus={(e) => e.target.select()}
                        onChange={e => setAmount(Number(e.target.value))}
                        prefix={<span className="text-[#c5a059]">₮</span>}
                        className="!bg-black !text-[#33ff00] !border-[#c5a059]/50 font-mono placeholder:!text-[#33ff00]/30 text-lg"
                    />

                    {/* Payment Method */}
                    <Select
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                        className="w-full imperial-select"
                        options={Object.entries(PAYMENT_METHODS).map(([key, label]) => ({
                            label: <span className="text-[#33ff00]">{label}</span>,
                            value: key
                        }))}
                    />

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                        <Button
                            onClick={onClose}
                            className="flex-1 !bg-red-900/20 !text-red-500 !border-red-900/50 font-mono tracking-widest hover:!bg-red-900/40 h-auto py-2 whitespace-normal leading-tight"
                        >
                            駁回申請 (DENY)
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 !bg-[#c5a059] !text-black !border-[#c5a059] font-mono font-bold tracking-widest hover:!bg-[#e6c278] hover:!text-black h-auto py-2 whitespace-normal leading-tight"
                        >
                            批准徵用 (AUTHORIZE)
                        </Button>
                    </div>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <List
                        locale={{ emptyText: <Empty description={<span className="text-[#33ff00]/50">No Data Scryed</span>} /> }}
                        dataSource={expenses}
                        renderItem={item => (
                            <List.Item className="!border-b !border-[#c5a059]/20 hover:bg-[#33ff00]/5 transition-colors group">
                                <div className="flex items-center gap-3 w-full px-2">
                                    <div className="text-[#c5a059]">
                                        {getIcon(EXPENSE_CATEGORIES[item.category].icon)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-[#33ff00]">{item.itemName}</span>
                                            <span className="font-mono text-[#c5a059]">₮ {item.amount}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-[#33ff00]/50 font-mono">
                                            <span>{getImperialDate(item.date.toString())}</span>
                                            <span>{PAYMENT_METHODS[item.paymentMethod].split('(')[0]}</span>
                                        </div>
                                    </div>
                                    <Button
                                        type="text"
                                        icon={<Trash2 size={14} />}
                                        className="text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-400"
                                        onClick={() => handleDelete(item.id)}
                                    />
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            </div>
        </Drawer>
    );
};
