const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { upload } = require('../config/s3');
const logger = require('../config/logger');

// Get all notes for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await Note.find({ userId }).sort({ createdAt: -1 });
    logger.info('Fetched notes', { metadata: { userId, count: notes.length } });
    res.json(notes);
  } catch (error) {
    logger.error('Error fetching notes', { metadata: { error: error.message } });
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a single note
router.get('/:userId/:noteId', async (req, res) => {
  try {
    const { userId, noteId } = req.params;
    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    logger.error('Error fetching note', { metadata: { error: error.message } });
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create a new note
router.post('/', async (req, res) => {
  try {
    const { title, content, userId, category, tags, color } = req.body;

    if (!title || !content || !userId) {
      return res.status(400).json({ error: 'Title, content, and userId are required' });
    }

    const note = new Note({
      title,
      content,
      userId,
      category,
      tags: tags || [],
      color
    });

    await note.save();
    logger.info('Note created', { metadata: { noteId: note._id, userId } });
    res.status(201).json(note);
  } catch (error) {
    logger.error('Error creating note', { metadata: { error: error.message } });
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update a note
router.put('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content, category, tags, color, isPinned } = req.body;

    const note = await Note.findByIdAndUpdate(
      noteId,
      { title, content, category, tags, color, isPinned, updatedAt: Date.now() },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    logger.info('Note updated', { metadata: { noteId } });
    res.json(note);
  } catch (error) {
    logger.error('Error updating note', { metadata: { error: error.message } });
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findByIdAndDelete(noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    logger.info('Note deleted', { metadata: { noteId } });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    logger.error('Error deleting note', { metadata: { error: error.message } });
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Upload file to note
router.post('/:noteId/upload', upload.single('file'), async (req, res) => {
  try {
    const { noteId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.attachments.push({
      filename: req.file.originalname,
      url: req.file.location
    });

    await note.save();
    logger.info('File uploaded to note', { metadata: { noteId, filename: req.file.originalname } });
    res.json(note);
  } catch (error) {
    logger.error('Error uploading file', { metadata: { error: error.message } });
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
