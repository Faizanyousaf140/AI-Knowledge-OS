import * as api from '../lib/api';

export const getAllProjectsAdmin = async () => api.getAllProjectsAdmin();
export const regenerateProjectEmbeddings = async (projectId) => api.regenerateProjectEmbeddings(projectId);
export const getUsersAdmin = async () => api.getUsersAdmin();
export const updateUserRole = async (userId, role) => api.updateUserRole(userId, role);
export const deleteUserAdmin = async (userId) => api.deleteUserAdmin(userId);
export const getUsageByUser = async (userId, days = 30) => api.getUsageByUser(userId, days);
export const getUsageAdmin = async (params) => api.getUsageAdmin(params);
