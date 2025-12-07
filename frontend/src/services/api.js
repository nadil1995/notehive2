import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Notes API calls
export const notesAPI = {
  getAllNotes: (userId) => api.get(`/notes/${userId}`),
  getNote: (userId, noteId) => api.get(`/notes/${userId}/${noteId}`),
  createNote: (noteData) => api.post('/notes', noteData),
  updateNote: (noteId, noteData) => api.put(`/notes/${noteId}`, noteData),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
  uploadFile: (noteId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/notes/${noteId}/upload`, formData);
  }
};

// Health check
export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
