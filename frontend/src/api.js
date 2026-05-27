const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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
  create: (resource, payload) => request(resource, { method: 'POST', body: payload }),
  update: (resource, id, payload) => request(`${resource}/${id}`, { method: 'PUT', body: payload }),
  patch: (resource, id, payload) => request(`${resource}/${id}`, { method: 'PATCH', body: payload }),
  remove: (resource, id) => request(`${resource}/${id}`, { method: 'DELETE' }),
  reports: {
    inventory: () => request('/reports/inventory'),
    expiring: () => request('/reports/expiring'),
    campaigns: () => request('/reports/campaigns'),
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
