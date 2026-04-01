const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  if (!refreshToken) return null;

  const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const refreshData = await refreshRes.json().catch(() => ({}));
  if (!refreshRes.ok || !refreshData.accessToken) {
    return null;
  }

  localStorage.setItem("accessToken", refreshData.accessToken);
  return refreshData.accessToken;
}

async function getRefreshedAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch (err) {
    throw new Error("Network error: could not reach API");
  }

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    const errMsg = (data && data.message) || `Request failed with ${response.status}`;
    const authFailure = response.status === 401 || response.status === 403 || /invalid token|unauthorized|forbidden/i.test(String(errMsg));
    // If token invalid/expired, try refresh once
    if (response.status === 401) {
      try {
        const newAccessToken = await getRefreshedAccessToken();
        if (newAccessToken) {
          // retry original request once with new token
          const retryHeaders = { ...headers, Authorization: `Bearer ${newAccessToken}` };
          const retryResp = await fetch(`${API_BASE}${path}`, {
            ...options,
            credentials: "include",
            headers: retryHeaders,
          });
          let retryData = {};
          try { retryData = await retryResp.json(); } catch (e) { retryData = {}; }
          if (!retryResp.ok) throw new Error((retryData && retryData.message) || `Request failed with ${retryResp.status}`);
          return retryData;
        }
      } catch (e) {
        // refresh failed — fall through to throw original error
      }
    }

    // Redirect to login only for auth failures.
    if (authFailure) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userEmail');
          window.location.href = '/login';
        }
      } catch (e) {
        // ignore
      }
    }

    throw new Error(errMsg || 'Invalid token');
  }

  return data;
}

export async function login(email, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProjects() {
  return apiRequest("/api/projects", { method: "GET" });
}

export async function createProject(body) {
  return apiRequest("/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getProject(id) {
  return apiRequest(`/api/projects/${id}`, { method: "GET" });
}

export async function getAllProjectsAdmin() {
  return apiRequest(`/api/projects/admin/all`, { method: "GET" });
}

export async function regenerateProjectEmbeddings(projectId) {
  return apiRequest(`/api/projects/admin/${projectId}/regenerate-embeddings`, { method: "POST" });
}

export async function updateUserRole(userId, role) {
  return apiRequest(`/api/auth/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteUserAdmin(userId) {
  return apiRequest(`/api/auth/users/${userId}`, { method: 'DELETE' });
}

export async function getUsageAdmin(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/api/admin/usage?${qs}`, { method: 'GET' });
}

export async function getUsageByUser(userId, days = 30) {
  return apiRequest(`/api/admin/usage/user?userId=${userId}&days=${days}`, { method: 'GET' });
}

export async function getUsersAdmin() {
  return apiRequest(`/api/auth/users`, { method: "GET" });
}

export async function deleteProject(id) {
  return apiRequest(`/api/projects/${id}`, { method: "DELETE" });
}

export async function updateProject(id, body) {
  return apiRequest(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// Notes
export async function getNotes(projectId) {
  return apiRequest(`/api/projects/${projectId}/notes`, { method: "GET" });
}

export async function createNote(projectId, body) {
  return apiRequest(`/api/projects/${projectId}/notes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteNote(projectId, noteId) {
  return apiRequest(`/api/projects/${projectId}/notes/${noteId}`, { method: "DELETE" });
}

export async function updateNote(projectId, noteId, body) {
  return apiRequest(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// AI
export async function askAI(projectId, question) {
  return apiRequest(`/api/ai/chat`, {
    method: "POST",
    body: JSON.stringify({ projectId, question }),
  });
}

// stream AI: POST to /api/ai/chat/stream and parse SSE-like data tokens
export async function streamAI(projectId, question, onToken, onDone, onError) {
  try {
    const res = await fetch(`${API_BASE}/api/ai/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}) },
      body: JSON.stringify({ projectId, question }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      onError && onError((body && body.message) || `Stream failed with ${res.status}`);
      return;
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      const answer = data && (data.answer || data.data || data.output || data);
      let text = '';
      if (typeof answer === 'string') text = answer;
      else if (answer && typeof answer === 'object') {
        text = answer.text || (Array.isArray(answer) ? (answer[0] && (answer[0].text || JSON.stringify(answer[0]))) : JSON.stringify(answer));
      }
      if (text) onToken && onToken(text);
      onDone && onDone(text, data.meta || null);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        // parse 'data: ' lines
        const parts = buffer.split(/\n\n/);
        for (let i = 0; i < parts.length - 1; i++) {
          const chunk = parts[i];
          const m = chunk.match(/data:\s*(.*)/s);
          if (m) {
            const payload = m[1].trim();
            if (payload === '[DONE]') {
              onDone && onDone();
            } else {
              try {
                const parsed = JSON.parse(payload);
                if (parsed.token) onToken && onToken(parsed.token);
                else if (typeof parsed === 'string') onToken && onToken(parsed);
              } catch (e) {
                // not JSON, deliver raw
                onToken && onToken(payload);
              }
            }
          }
        }
        buffer = parts[parts.length - 1];
      }
    }
    onDone && onDone();
  } catch (err) {
    onError && onError(err.message || 'Stream error');
  }
}
