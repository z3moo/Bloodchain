const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const SESSION_STORAGE_KEY = 'bloodchain.currentUser'

// Trust-on-faith identity for Sprint 1: pull the logged-in user out of
// localStorage and attach it to each request so the backend can scope. The
// backend has a matching middleware that turns these headers into req.user.
// A real JWT replaces this in Sprint 3 — until then anyone with curl can
// spoof the headers, so don't treat it as a security boundary.
function identityHeaders(path) {
  if (path.startsWith('/auth/')) return {}
  let user = null
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    user = raw ? JSON.parse(raw) : null
  } catch {
    user = null
  }
  if (!user?.username || !user?.role) return {}
  const headers = {
    'X-User': user.username,
    'X-Role': user.role,
  }
  if (user.donorId) headers['X-Donor-Id'] = user.donorId
  if (user.hospitalId) headers['X-Hospital-Id'] = user.hospitalId
  if (user.staffId) headers['X-Staff-Id'] = user.staffId
  return headers
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...identityHeaders(path),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `HTTP ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  list: (resource) => request(resource),
  get: (resource) => request(resource),
  create: (resource, payload) => request(resource, { method: 'POST', body: payload }),
  update: (resource, id, payload) => request(`${resource}/${id}`, { method: 'PUT', body: payload }),
  put: (resource, payload) => request(resource, { method: 'PUT', body: payload }),
  patch: (resource, id, payload) => request(`${resource}/${id}`, { method: 'PATCH', body: payload }),
  remove: (resource, id) => request(`${resource}/${id}`, { method: 'DELETE' }),
  removePath: (resource) => request(resource, { method: 'DELETE' }),
  reports: {
    inventory: () => request('/reports/inventory'),
    expiring: () => request('/reports/expiring'),
    campaigns: () => request('/reports/campaigns'),
    intakeByDay: (days = 14) => request(`/reports/intake-by-day?days=${days}`),
  },
  me: {
    profile: () => request('/donors/me'),
    saveProfile: (payload) => request('/donors/me', { method: 'PUT', body: payload }),
    donations: () => request('/donors/me/donations'),
    points: () => request('/donors/me/points'),
    campaigns: () => request('/donors/me/campaigns'),
  },
  registerStaff: (payload) => request('/auth/register-staff', { method: 'POST', body: payload }),
  accounts: {
    pending: () => request('/accounts/pending'),
    approve: (username) => request(`/accounts/${username}/approve`, { method: 'PATCH', body: {} }),
    reject: (username) => request(`/accounts/${username}/reject`, { method: 'DELETE' }),
  },
}

export const endpoints = {
  bloodGroups: '/blood-groups',
  donors: '/donors',
  campaigns: '/campaigns',
  bloodBags: '/blood-bags',
  labTests: '/lab-tests',
  components: '/components',
  hospitals: '/hospitals',
  patients: '/patients',
  requests: '/requests',
  exports: '/exports',
}
