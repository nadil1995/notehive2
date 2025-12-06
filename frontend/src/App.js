import React, { useState, useEffect } from 'react';
import './App.css';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import { notesAPI, healthAPI } from './services/api';

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId] = useState('user123'); // In production, this would come from auth
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  // Check API connection on mount
  useEffect(() => {
    const checkAPI = async () => {
      try {
        await healthAPI.check();
        setApiConnected(true);
      } catch (err) {
        console.error('API connection failed:', err);
        setApiConnected(false);
      }
    };
    checkAPI();
  }, []);

  // Fetch notes
  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notesAPI.getAllNotes(userId);
      setNotes(response.data);
    } catch (err) {
      setError('Failed to fetch notes. Make sure the API is running.');
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      const newNote = await notesAPI.createNote({
        ...noteData,
        userId
      });
      setNotes([newNote.data, ...notes]);
      setSelectedNote(newNote.data);
      setIsCreatingNew(false);
    } catch (err) {
      setError('Failed to create note');
      console.error('Error creating note:', err);
    }
  };

  const handleUpdateNote = async (noteId, noteData) => {
    try {
      const updated = await notesAPI.updateNote(noteId, noteData);
      setNotes(notes.map(n => n._id === noteId ? updated.data : n));
      setSelectedNote(updated.data);
    } catch (err) {
      setError('Failed to update note');
      console.error('Error updating note:', err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notesAPI.deleteNote(noteId);
      setNotes(notes.filter(n => n._id !== noteId));
      setSelectedNote(null);
    } catch (err) {
      setError('Failed to delete note');
      console.error('Error deleting note:', err);
    }
  };

  const handleFileUpload = async (noteId, file) => {
    try {
      const updated = await notesAPI.uploadFile(noteId, file);
      setNotes(notes.map(n => n._id === noteId ? updated.data : n));
      setSelectedNote(updated.data);
    } catch (err) {
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>NoteHive</h1>
        <div className="header-status">
          <span className={`status-indicator ${apiConnected ? 'connected' : 'disconnected'}`}>
            {apiConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <button
            className="new-note-btn"
            onClick={() => setIsCreatingNew(true)}
          >
            + New Note
          </button>
          <NotesList
            notes={notes}
            selectedNote={selectedNote}
            onSelectNote={setSelectedNote}
            isLoading={isLoading}
          />
        </aside>

        <main className="main-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {isCreatingNew ? (
            <NoteEditor
              note={null}
              onSave={handleCreateNote}
              onCancel={() => setIsCreatingNew(false)}
              onDelete={null}
            />
          ) : selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onSave={(data) => handleUpdateNote(selectedNote._id, data)}
              onDelete={() => handleDeleteNote(selectedNote._id)}
              onFileUpload={(file) => handleFileUpload(selectedNote._id, file)}
            />
          ) : (
            <div className="empty-state">
              <h2>Welcome to NoteHive</h2>
              <p>Create a new note or select one from the list to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
