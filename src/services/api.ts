
import { Task, Project, ArmyStrength, SectorHistory, Resources } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
    // Tasks
    getTasks: async (): Promise<Task[]> => {
        const response = await fetch(`${API_URL}/tasks`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    createTask: async (task: Task): Promise<void> => {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!response.ok) throw new Error('Failed to create task');
    },

    updateTask: async (id: string, updates: Partial<Task>): Promise<void> => {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update task');
    },

    deleteTask: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete task');
    },

    // Game State
    getGameState: async () => {
        const response = await fetch(`${API_URL}/game-state`);
        if (!response.ok) throw new Error('Failed to fetch game state');
        return response.json();
    },

    syncGameState: async (state: any): Promise<void> => {
        const response = await fetch(`${API_URL}/game-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        if (!response.ok) throw new Error('Failed to sync game state');
    },

    // Projects
    getProjects: async (): Promise<Project[]> => {
        const response = await fetch(`${API_URL}/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
    },

    createProject: async (project: Project): Promise<void> => {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        if (!response.ok) throw new Error('Failed to create project');
    },

    updateProject: async (id: string, updates: Partial<Project>): Promise<void> => {
        const response = await fetch(`${API_URL}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update project');
    },

    deleteProject: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/projects/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete project');
    }
};
