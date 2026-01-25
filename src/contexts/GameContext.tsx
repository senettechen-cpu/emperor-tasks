import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Resources, Faction } from '../types';

interface GameContextType {
    tasks: Task[];
    resources: Resources;
    corruption: number;
    ownedUnits: string[];
    isPenitentMode: boolean;
    addTask: (title: string, faction: Faction, difficulty: number, dueDate: Date) => void;
    purgeTask: (id: string) => void;
    buyUnit: (unitId: string, cost: number) => void;
    cheatCorruption: () => void;
    resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'emperor_cogitator_v1';

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State Initialization with Lazy Loading from LocalStorage
    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
        if (saved) {
            return JSON.parse(saved).map((t: any) => ({
                ...t,
                dueDate: new Date(t.dueDate),
                createdAt: new Date(t.createdAt)
            }));
        }
        return [];
    });

    const [resources, setResources] = useState<Resources>(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_resources`);
        return saved ? JSON.parse(saved) : { rp: 0, glory: 0 };
    });

    const [corruption, setCorruption] = useState<number>(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_corruption`);
        return saved ? JSON.parse(saved) : 0;
    });

    const [ownedUnits, setOwnedUnits] = useState<string[]>(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_units`);
        return saved ? JSON.parse(saved) : [];
    });

    const [isPenitentMode, setIsPenitentMode] = useState(false);

    // Persistence Effects
    useEffect(() => localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks)), [tasks]);
    useEffect(() => localStorage.setItem(`${STORAGE_KEY}_resources`, JSON.stringify(resources)), [resources]);
    useEffect(() => localStorage.setItem(`${STORAGE_KEY}_corruption`, JSON.stringify(corruption)), [corruption]);
    useEffect(() => localStorage.setItem(`${STORAGE_KEY}_units`, JSON.stringify(ownedUnits)), [ownedUnits]);

    // Corruption Engine
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const overdueTasks = tasks.filter(t => t.status === 'active' && t.dueDate < now).length;

            // Corruption Formula: Overdue tasks increase corruption
            if (overdueTasks > 0) {
                setCorruption(prev => Math.min(100, prev + overdueTasks * 0.5));
            }
        }, 60000); // Check every minute

        return () => clearInterval(timer);
    }, [tasks]);

    // Penitent Mode Trigger
    useEffect(() => {
        if (corruption >= 100) setIsPenitentMode(true);
        else if (corruption < 80 && isPenitentMode) setIsPenitentMode(false);
    }, [corruption]);

    // Actions
    const addTask = (title: string, faction: Faction, difficulty: number, dueDate: Date) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            title,
            faction,
            difficulty,
            dueDate,
            createdAt: new Date(),
            status: 'active'
        };
        setTasks(prev => [...prev, newTask]);
        // Adding a task slightly reduces corruption (Hope)
        setCorruption(prev => Math.max(0, prev - 1));
    };

    const purgeTask = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        setTasks(prev => prev.filter(t => t.id !== id));

        // Reward Logic
        const rpReward = task.difficulty * 10 + 5;
        const corruptionCleansing = task.difficulty * 2;

        setResources(prev => ({ ...prev, rp: prev.rp + rpReward }));
        setCorruption(prev => Math.max(0, prev - corruptionCleansing));
    };

    const buyUnit = (unitId: string, cost: number) => {
        if (resources.glory >= cost && !ownedUnits.includes(unitId)) {
            setResources(prev => ({ ...prev, glory: prev.glory - cost }));
            setOwnedUnits(prev => [...prev, unitId]);
        }
    };

    const cheatCorruption = () => setCorruption(prev => Math.min(100, prev + 10));

    const resetGame = () => {
        setCorruption(50);
        setIsPenitentMode(false);
    };

    return (
        <GameContext.Provider value={{
            tasks, resources, corruption, ownedUnits, isPenitentMode,
            addTask, purgeTask, buyUnit, cheatCorruption, resetGame
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};
