import * as api from '../lib/api';

export const askAI = async (projectId, question) => {
  return api.askAI(projectId, question);
};

export const streamAI = async (projectId, question, onToken, onDone, onError) => {
  return api.streamAI(projectId, question, onToken, onDone, onError);
};
