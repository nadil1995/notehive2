import React, { useState } from 'react';
import './NoteEditor.css';

function NoteEditor({ note, onSave, onCancel, onDelete, onFileUpload }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || 'General');
  const [color, setColor] = useState(note?.color || '#FFFFFF');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        title: title || 'Untitled',
        content,
        category,
        color,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        isPinned
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  return (
    <div className="note-editor">
      <form onSubmit={handleSave} className="editor-form">
        <div className="editor-header">
          <input
            type="text"
            className="title-input"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="editor-actions">
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {note && (
              <button
                type="button"
                className="btn-danger"
                onClick={onDelete}
              >
                Delete
              </button>
            )}
            {!note && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="editor-meta">
          <div className="meta-group">
            <label>Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal"
            />
          </div>

          <div className="meta-group">
            <label>Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="meta-group">
            <label>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma separated"
            />
          </div>

          <div className="meta-group">
            <label>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              Pin this note
            </label>
          </div>
        </div>

        <textarea
          className="content-input"
          placeholder="Start typing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {note && (
          <div className="attachments-section">
            <h3>Attachments</h3>
            {note.attachments && note.attachments.length > 0 ? (
              <ul className="attachments-list">
                {note.attachments.map((att, idx) => (
                  <li key={idx}>
                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                      {att.filename}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No attachments</p>
            )}

            {onFileUpload && (
              <div className="file-upload">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  id="file-input"
                />
                <label htmlFor="file-input" className="upload-label">
                  📎 Add attachment
                </label>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default NoteEditor;
