import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

/* ── Helpers ─────────────────────────────────────────────── */
function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const STATUS_OPTIONS = ['pending', 'in-progress', 'completed']

/* ── Badge ───────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cls = {
    pending: 'badge badge-pending',
    'in-progress': 'badge badge-in-progress',
    completed: 'badge badge-completed',
  }[status] || 'badge'
  const icon = { pending: '○', 'in-progress': '◑', completed: '●' }[status]
  return <span className={cls}>{icon} {status}</span>
}

/* ── Task Card ───────────────────────────────────────────── */
function TaskCard({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editStatus, setEditStatus] = useState(task.status)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(task._id, { title: editTitle, status: editStatus })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    setDeleting(true)
    try {
      await onDelete(task._id)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleToggleComplete = () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    onUpdate(task._id, { status: newStatus })
  }

  return (
    <div className={`task-card ${editing ? 'editing' : ''} ${confirmDelete ? 'deleting' : ''}`}>
      {/* Checkbox toggle */}
      <div className="task-checkbox-area">
        <button
          className={`task-check ${task.status === 'completed' ? 'done' : ''}`}
          onClick={handleToggleComplete}
          title="Toggle complete"
          aria-label="Toggle task completion"
        >
          {task.status === 'completed' && '✓'}
        </button>
      </div>

      {/* Body */}
      {editing ? (
        <div className="edit-form">
          <input
            id={`edit-title-${task._id}`}
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Task title"
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
          />
          <select
            id={`edit-status-${task._id}`}
            value={editStatus}
            onChange={e => setEditStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="task-body">
          <div className={`task-title ${task.status === 'completed' ? 'done' : ''}`}>
            {task.title}
          </div>
          <div className="task-meta">
            {confirmDelete
              ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Delete this task?</span>
              : <>Created {formatDate(task.createdAt)}</>
            }
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="task-actions">
        {!editing && !confirmDelete && <StatusBadge status={task.status} />}

        {editing ? (
          <>
            <button
              id={`save-task-${task._id}`}
              className="btn btn-success btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✓ Save'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setEditing(false); setEditTitle(task.title); setEditStatus(task.status) }}
            >
              Cancel
            </button>
          </>
        ) : confirmDelete ? (
          <>
            <button
              id={`confirm-delete-${task._id}`}
              className="btn btn-danger btn-sm"
              onClick={handleDeleteConfirmed}
              disabled={deleting}
            >
              {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Yes, delete'}
            </button>
            <button
              id={`cancel-delete-${task._id}`}
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              id={`edit-task-${task._id}`}
              className="btn btn-ghost btn-sm"
              onClick={() => setEditing(true)}
            >
              ✎ Edit
            </button>
            <button
              id={`delete-task-${task._id}`}
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Dashboard Page ──────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const user = getUser()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [newTitle, setNewTitle] = useState('')
  const [newStatus, setNewStatus] = useState('pending')
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState(null)

  /* toast helper */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* fetch tasks */
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tasks')
      setTasks(data.data.tasks)
    } catch {
      showToast('Failed to load tasks.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  /* create */
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/tasks', { title: newTitle.trim(), status: newStatus })
      setTasks(prev => [data.data.task, ...prev])
      setNewTitle('')
      setNewStatus('pending')
      showToast('Task created successfully!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create task.', 'error')
    } finally {
      setCreating(false)
    }
  }

  /* update */
  const handleUpdate = async (id, updates) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, updates)
      setTasks(prev => prev.map(t => t._id === id ? data.data.task : t))
      showToast('Task updated!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error')
      throw err
    }
  }

  /* delete */
  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(prev => prev.filter(t => t._id !== id))
      showToast('Task deleted.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error')
      throw err
    }
  }

  /* logout */
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  /* stats */
  const total = tasks.length
  const pending = tasks.filter(t => t.status === 'pending').length
  const inProgress = tasks.filter(t => t.status === 'in-progress').length
  const completed = tasks.filter(t => t.status === 'completed').length

  /* filtered list */
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo-icon">✦</div>
          <span className="brand-name">TaskFlow</span>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>
          <button
            id="logout-btn"
            className="btn btn-ghost"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1>My Tasks</h1>
          <p>
            {total === 0
              ? 'No tasks yet. Create your first one below!'
              : `${total} task${total !== 1 ? 's' : ''} total — ${completed} completed`}
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`} role="status">
            <span>{toast.type === 'error' ? '⚠️' : '✓'}</span> {toast.msg}
          </div>
        )}

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{pending}</span>
          </div>
          <div className="stat-card in-progress">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{inProgress}</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{completed}</span>
          </div>
        </div>

        {/* Create Task */}
        <div className="create-panel">
          <div className="panel-title">
            <span>＋</span> New Task
          </div>
          <form className="create-form" onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="new-task-title">Task title</label>
              <input
                id="new-task-title"
                type="text"
                placeholder="e.g. Complete internship assignment"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-task-status">Status</label>
              <select
                id="new-task-status"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              id="create-task-btn"
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={creating || !newTitle.trim()}
              style={{ marginBottom: 0, width: 'auto', padding: '12px 20px' }}
            >
              {creating ? <span className="spinner" /> : 'Add Task'}
            </button>
          </form>
        </div>

        {/* Task List */}
        <div>
          <div className="task-list-header">
            <span className="task-list-title">
              {filter === 'all' ? 'All Tasks' : `${filter} tasks`}
              {' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '14px' }}>
                ({filtered.length})
              </span>
            </span>
            <div className="filter-bar">
              {['all', 'pending', 'in-progress', 'completed'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                  id={`filter-${f}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {filter === 'completed' ? '🎉' : filter === 'pending' ? '⏳' : '📋'}
              </div>
              <h3>No {filter === 'all' ? '' : filter} tasks yet</h3>
              <p>
                {filter === 'all'
                  ? 'Create your first task using the form above.'
                  : `No tasks with "${filter}" status.`}
              </p>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
