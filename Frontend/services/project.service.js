import * as api from '../lib/api';

export const listProjects = async () => {
  return api.getProjects();
};

export const getProject = async (id) => {
  return api.getProject(id);
};

export const createProject = async (body) => {
  return api.createProject(body);
};

export const updateProject = async (id, body) => {
  return api.updateProject(id, body);
};

export const deleteProject = async (id) => {
  return api.deleteProject(id);
};

export const adminListAllProjects = async () => {
  return api.getAllProjectsAdmin();
};

export const regenerateEmbeddings = async (projectId) => {
  return api.regenerateProjectEmbeddings(projectId);
};
