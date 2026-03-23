import * as api from '../lib/api';

export const listNotes = async (projectId) => {
  return api.getNotes(projectId);
};

export const createNote = async (projectId, body) => {
  return api.createNote(projectId, body);
};

export const updateNote = async (projectId, noteId, body) => {
  return api.updateNote(projectId, noteId, body);
};

export const deleteNote = async (projectId, noteId) => {
  return api.deleteNote(projectId, noteId);
};
