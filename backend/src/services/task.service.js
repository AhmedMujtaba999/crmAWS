import * as taskRepo from '../repositories/task.repo.js';

export async function createTask(data) {
    return taskRepo.createTask(data);
}

export async function getAllTasks() {
    return taskRepo.getAllTasks();
}

export async function getTaskById(id) {
    const task = await taskRepo.getTaskById(id);
    if (!task) throw new Error('Task not found');
    return task;
}

export async function updateTask(id, data) {
    const updated = await taskRepo.updateTask(id, data);
    if (!updated) throw new Error('Task not found');
    return updated;
}

export async function deleteTask(id) {
    const deleted = await taskRepo.deleteTask(id);
    if (!deleted) throw new Error('Task not found');
    return deleted;
}