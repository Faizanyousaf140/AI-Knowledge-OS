"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getProject, deleteProject, updateProject } from '../../../services/project.service';
import { listNotes, createNote, deleteNote, updateNote } from '../../../services/note.service';
import { askAI, streamAI } from '../../../services/ai.service';

const getEntityId = (item) => item?._id || item?.id || null;

const dedupeByEntityId = (items = []) => {
  const seen = new Set();
  return items.filter((item, idx) => {
    const id = getEntityId(item);
    const dedupeKey = id ? `id:${id}` : `idx:${idx}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
};

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params || {};
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // notes
  const [notes, setNotes] = useState([]);
  const [noteBody, setNoteBody] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  // AI
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [aiMeta, setAiMeta] = useState(null);
  const [computedProgress, setComputedProgress] = useState(null);
  const [notesWithEmbCount, setNotesWithEmbCount] = useState(0);
  const [notesTotalCount, setNotesTotalCount] = useState(0);

  const logRecentAIQuestion = (q) => {
    try {
      if (!q || !q.trim()) return;
      const key = 'aiRecentQuestions';
      const raw = localStorage.getItem(key);
      const parsed = JSON.parse(raw || '[]');
      const list = Array.isArray(parsed) ? parsed : [];
      const next = [
        {
          question: q.trim(),
          projectId: id,
          projectName: project?.name || 'Project',
          createdAt: new Date().toISOString(),
        },
        ...list,
      ].slice(0, 30);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      // ignore localStorage failures
    }
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getProject(id);
        const data = res && res.data ? res.data : res;
        setProject(data);
        setNameInput(data?.name || "");
        setDescInput(data?.description || "");
        setTagsInput((data?.tags || []).join(", "));
        // load notes (use service wrapper)
        setLoadingNotes(true);
        try {
          const nres = await listNotes(id);
          const list = Array.isArray(nres) ? nres : (nres && nres.data ? nres.data : []);
          setNotes(dedupeByEntityId(list));
          // compute embedding-based progress
          try {
            const total = list.length;
            const withEmb = list.filter(n => Array.isArray(n.embedding) && n.embedding.length > 0).length;
            setNotesTotalCount(total);
            setNotesWithEmbCount(withEmb);
            if (total > 0) setComputedProgress(Math.round((withEmb / total) * 100));
          } catch (e) {
            // ignore
          }
        } catch (e) {
          console.error('Failed to load notes', e.message || e);
        } finally {
          setLoadingNotes(false);
        }
      } catch (err) {
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateNote = async () => {
    setNoteError("");
    if (!noteBody || !noteBody.trim()) return setNoteError("Note cannot be empty");
    setCreatingNote(true);
    try {
      const res = await createNote(id, { content: noteBody });
      const created = res && res.data ? res.data : res;
      setNotes((s) => dedupeByEntityId([created, ...s]));
      setNoteBody("");
    } catch (err) {
      setNoteError(err.message || "Failed to create note");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete note?')) return;
    try {
      await deleteNote(id, noteId);
      setNotes((s) => s.filter(n => n._id !== noteId && n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note', err.message || err);
    }
  };

  const startEditNote = (note) => {
    setEditingNoteId(note._id || note.id);
    setEditingNoteBody(note.content);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteBody("");
  };

  const saveEditNote = async () => {
    if (!editingNoteBody || !editingNoteBody.trim()) return;
    try {
      const res = await updateNote(id, editingNoteId, { content: editingNoteBody });
      const updated = res && res.data ? res.data : res;
      setNotes((s) => s.map(n => (n._id === updated._id || n.id === updated._id || n.id === updated.id) ? updated : n));
      cancelEditNote();
    } catch (err) {
      console.error('Failed to update note', err.message || err);
    }
  };

  const handleAskAI = async () => {
    if (!question || !question.trim()) return;
    logRecentAIQuestion(question);
    setAsking(true);
    setAnswer("");
    setStreamedAnswer("");
    try {
      // use streaming helper
      await streamAI(
        id,
        question.trim(),
        (token) => {
          setStreamedAnswer((s) => s + token);
        },
        (finalText, meta) => {
          // finalText provided by API for JSON responses
          if (finalText) setAnswer(finalText);
          else setAnswer(streamedAnswer);
          if (meta) setAiMeta(meta);
          setAsking(false);
        },
        (errMsg) => {
          setAnswer(errMsg);
          setAsking(false);
        }
      );
    } catch (err) {
      setAnswer(err.message || 'AI request failed');
      setAsking(false);
    }
  };

  const handleSaveQuestionAsNote = async () => {
    setNoteError("");
    if (!question || !question.trim()) return setNoteError('Question is empty');
    if (!answer && !streamedAnswer) return setNoteError('Ask AI first so both question and answer are saved.');
    setCreatingNote(true);
    try {
      const questionText = question.trim();
      const answerText = (answer || streamedAnswer || "").trim();
      const content = answerText
        ? `Q: ${questionText}\n\nA: ${answerText}`
        : `Q: ${questionText}`;

      const res = await createNote(id, { content });
      const created = res && res.data ? res.data : res;
      setNotes((s) => dedupeByEntityId([created, ...s]));
      setQuestion("");
    } catch (err) {
      setNoteError(err.message || "Failed to create note from question");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleSave = async () => {
    setSaveError("");
    if (!nameInput) return setSaveError("Project name is required");
    setSaving(true);
    try {
      const payload = {
        name: nameInput,
        description: descInput,
        tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      };
      const res = await updateProject(id, payload);
      const updated = res && res.data ? res.data : res;
      setProject(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="page-wrap"><div className="container"><div className="card">Loading...</div></div></main>;

  if (error) return <main className="page-wrap"><div className="container"><div className="card error-text">{error}<div style={{marginTop:12}}><Link href="/dashboard" className="subtle-link">← Back to dashboard</Link></div></div></div></main>;

  if (!project) return <main className="page-wrap"><div className="container"><div className="card">Project not found — <Link href="/dashboard" className="subtle-link">Back to dashboard</Link></div></div></main>;

  const progress = (project && typeof project.progressPercent === 'number') ? project.progressPercent : 0;
  const progressToShow = (typeof computedProgress === 'number') ? computedProgress : progress;

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="title">{project.name}</h1>
                <div className="muted">{project.description}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/dashboard" className="btn secondary">Back</Link>
                <button className="btn" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>
                <button className="btn" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressToShow}%` }} />
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                Completion: {progressToShow}%
                {notesTotalCount > 0 ? (
                  <div style={{ marginTop: 6 }} className="muted">Notes embedded: {notesWithEmbCount}/{notesTotalCount} ({progressToShow}%)</div>
                ) : null}
              </div>
            </div>
          </div>

          {editing ? (
            <div className="mini-card">
              <input className="input" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Project name" />
              <input className="input" value={descInput} onChange={(e) => setDescInput(e.target.value)} placeholder="Short description" />
              <input className="input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags (comma separated)" />
              {saveError ? <div className="error-text">{saveError}</div> : null}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : null}

          <div className="section">
            <h3 className="title">Notes</h3>
            <p className="muted">Notes saved to this project are searchable by the AI.</p>

            <div style={{ marginTop: 12 }}>
              <div className="mini-card">
                <textarea className="input" style={{ minHeight: 80 }} placeholder="Write a short note..." value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
                {noteError ? <div className="error-text">{noteError}</div> : null}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={handleCreateNote} disabled={creatingNote}>{creatingNote ? 'Saving...' : 'Save Note'}</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {loadingNotes ? <div className="muted">Loading notes...</div> : (
                  notes.length === 0 ? <div className="muted">No notes yet.</div> : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {notes.map((n, idx) => (
                        <div key={`${n._id || n.id || 'note'}-${idx}`} className="card" style={{ padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <div className="muted">{new Date(n.createdAt).toLocaleString()}</div>
                              {editingNoteId === (n._id || n.id) ? (
                                <textarea className="input" style={{ minHeight: 80, marginTop: 6 }} value={editingNoteBody} onChange={(e) => setEditingNoteBody(e.target.value)} />
                              ) : (
                                <div style={{ marginTop: 6 }}>{n.content}</div>
                              )}
                            </div>
                            <div style={{ marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {editingNoteId === (n._id || n.id) ? (
                                <>
                                  <button className="btn" onClick={saveEditNote}>Save</button>
                                  <button className="btn secondary" onClick={cancelEditNote}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button className="btn" onClick={() => startEditNote(n)}>Edit</button>
                                  <button className="btn secondary" onClick={() => handleDeleteNote(n._id || n.id)}>Delete</button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h3 className="title">AI Chat</h3>
              <p className="muted">Ask the project-specific AI using your notes as context.</p>
              <div className="mini-card">
                <textarea className="input" style={{ minHeight: 80 }} placeholder="Ask a question about this project..." value={question} onChange={(e) => setQuestion(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={handleAskAI} disabled={asking}>{asking ? 'Thinking...' : 'Ask AI'}</button>
                  <button className="btn secondary" onClick={handleSaveQuestionAsNote} disabled={creatingNote || !question.trim() || (!answer && !streamedAnswer)}>{creatingNote ? 'Saving...' : 'Save Q&A as Note'}</button>
                </div>
                {answer ? (
                  <div style={{ marginTop: 12 }} className="card">
                    <div>{answer}</div>
                    {aiMeta ? (
                      <div style={{ marginTop: 12 }}>
                        <strong>Summary:</strong>
                        <div className="muted" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{aiMeta.summary}</div>
                        {aiMeta.mappedNotes && aiMeta.mappedNotes.length ? (
                          <div style={{ marginTop: 8 }}>
                            <strong>Notes used:</strong>
                            <ul>
                              {aiMeta.mappedNotes.map((n, idx) => (
                                <li key={`${n.id || n._id || 'mapped-note'}-${idx}`}>{n.excerpt} — <span className="muted">{new Date(n.createdAt).toLocaleString()}</span></li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
