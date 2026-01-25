export type Faction = 'nurgle' | 'khorne' | 'tzeentch' | 'slaanesh' | 'orks' | 'necrons' | 'default';

export interface Task {
    id: string;
    title: string;
    faction: Faction;
    difficulty: number; // 1-5
    dueDate: Date;
    createdAt: Date;
    status: 'active' | 'completed' | 'failed';
}

export interface Resources {
    rp: number; // 帝皇之怒
    glory: number; // 榮耀值
}

export interface Unit {
    id: string;
    name: string;
    cost: number;
    description: string;
    icon?: React.ReactNode;
}
