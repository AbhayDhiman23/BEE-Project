const express = require('express');
const Note = require('../models/Note');
const { auth, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/notes - Get user's notes
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tags, studyRoom } = req.query;
    
    const query = { author: req.user._id };
    
    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagsArray };
    }
    
    if (studyRoom) {
      query.studyRoom = studyRoom;
    }

    const notes = await Note.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'username profile.displayName');

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notes - Create new note
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== CREATE NOTE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user.username);
    
    const { title, content, tags, isPublic, studyRoom } = req.body;

    console.log('Extracted fields:');
    console.log('- Title:', title);
    console.log('- Content length:', content?.length);
    console.log('- StudyRoom:', studyRoom);

    if (!title || !content) {
      console.log('Validation failed: missing title or content');
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const note = new Note({
      title,
      content,
      author: req.user._id,
      tags: tags || [],
      isPublic: isPublic || false,
      studyRoom: studyRoom || 'default-room'
    });

    console.log('Note object created:', {
      title: note.title,
      contentLength: note.content.length,
      author: note.author,
      studyRoom: note.studyRoom
    });

    await note.save();
    console.log('Note saved to database with ID:', note._id);
    
    await note.populate('author', 'username profile.displayName');
    console.log('Note populated with author info');

    const response = {
      message: 'Note created successfully',
      note
    };
    
    console.log('Sending response:', response);
    res.status(201).json(response);

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/notes/:id - Get specific note
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'username profile.displayName');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user has permission to view note
    if (!note.isPublic && (!req.user || note.author._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ note });

  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags, isPublic } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (isPublic !== undefined) note.isPublic = isPublic;

    await note.save();
    await note.populate('author', 'username profile.displayName');

    res.json({
      message: 'Note updated successfully',
      note
    });

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notes/:id/ai-summary - Generate AI summary for note
router.post('/:id/ai-summary', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Here you would integrate with your AI service
    // For now, we'll create a simple summary
    const summary = `Summary of "${note.title}": This note contains ${note.metadata.wordCount} words and covers key study material.`;

    note.aiSummary = {
      content: summary,
      provider: 'local',
      generatedAt: new Date()
    };

    await note.save();

    res.json({
      message: 'AI summary generated successfully',
      summary: note.aiSummary
    });

  } catch (error) {
    console.error('Generate AI summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;