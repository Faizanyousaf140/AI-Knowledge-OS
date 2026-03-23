#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../src/modules/note/note.model');
const { generateEmbedding } = require('../src/modules/ai/embedding.service');

async function ensureConnection() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set in .env');
  await mongoose.connect(uri);
}

async function main() {
  try {
    await ensureConnection();
    const notes = await Note.find({});
    console.log('Found', notes.length, 'notes');

    for (const note of notes) {
      try {
        console.log('Generating embedding for note', note._id.toString());
        const emb = await generateEmbedding(note.content);
        if (!Array.isArray(emb)) {
          console.warn('Embedding not array, skipping note', note._id.toString());
          continue;
        }
        note.embedding = emb;
        await note.save();
        console.log('Updated note', note._id.toString(), 'embeddingLength=', emb.length);
      } catch (err) {
        console.error('Failed to update note', note._id.toString(), err.message || err);
      }
    }

    console.log('Done regenerating embeddings');
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
