import React from 'react';
import './NotesList.css';

function NotesList({ notes, selectedNote, onSelectNote, isLoading }) {
  if (isLoading) {
    return <div className="notes-list loading">Loading notes...</div>;
  }

  return (
    <div className="notes-list">
      {notes.length === 0 ? (
        <p className="empty-notes">No notes yet</p>
      ) : (
        notes.map(note => (
          <div
            key={note._id}
            className={`note-item ${selectedNote?._id === note._id ? 'selected' : ''}`}
            onClick={() => onSelectNote(note)}
            style={{ borderLeftColor: note.color || '#3498db' }}
          >
            <div className="note-title">{note.title}</div>
            <div className="note-preview">
              {note.content.substring(0, 50)}...
            </div>
            <div className="note-date">
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
            {note.isPinned && <span className="pin-badge">📌</span>}
          </div>
        ))
      )}
    </div>
  );
}

export default NotesList;
