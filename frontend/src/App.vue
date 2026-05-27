<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Dashboard from './views/Dashboard.vue'
import Donors from './views/Donors.vue'
import Campaigns from './views/Campaigns.vue'
import BloodBags from './views/BloodBags.vue'
import LabTests from './views/LabTests.vue'
import Components from './views/Components.vue'
import Hospitals from './views/Hospitals.vue'
import Patients from './views/Patients.vue'
import Requests from './views/Requests.vue'
import Exports from './views/Exports.vue'
import Reports from './views/Reports.vue'
import Accounts from './views/Accounts.vue'
import { api } from './api'

const SESSION_STORAGE_KEY = 'bloodchain.currentUser'

const modules = [
  { key: 'dashboard', label: 'T\u1ed5ng quan', component: Dashboard, group: '\u0110i\u1ec1u h\u00e0nh', access: ['admin', 'staff'] },
  { key: 'donors', label: '\u0110\u0103ng k\u00fd hi\u1ebfn m\u00e1u', component: Donors, group: 'Ng\u01b0\u1eddi hi\u1ebfn', access: ['admin', 'donor', 'staff'] },
  { key: 'campaigns', label: 'Chi\u1ebfn d\u1ecbch', component: Campaigns, group: 'Ti\u1ebfp nh\u1eadn', access: ['admin', 'staff'] },
  { key: 'blood-bags', label: 'G\u00f3i m\u00e1u', component: BloodBags, group: 'Ti\u1ebfp nh\u1eadn', access: ['admin', 'staff'] },
  { key: 'lab-tests', label: 'X\u00e9t nghi\u1ec7m', component: LabTests, group: 'Y khoa', access: ['admin', 'staff'] },
  { key: 'components', label: 'Kho m\u00e1u', component: Components, group: 'Kho', access: ['admin', 'staff'] },
  { key: 'hospitals', label: 'B\u1ec7nh vi\u1ec7n', component: Hospitals, group: 'Cung \u1ee9ng', access: ['admin', 'staff'] },
  { key: 'patients', label: 'B\u1ec7nh nh\u00e2n', component: Patients, group: 'Cung \u1ee9ng', access: ['admin', 'hospital', 'staff'] },
  { key: 'requests', label: 'Phi\u1ebfu y\u00eau c\u1ea7u', component: Requests, group: 'Cung \u1ee9ng', access: ['admin', 'hospital', 'staff'] },
  { key: 'exports', label: 'Xu\u1ea5t kho FIFO', component: Exports, group: 'Cung \u1ee9ng', access: ['admin', 'staff'] },
  { key: 'reports', label: 'B\u00e1o c\u00e1o', component: Reports, group: 'T\u1ed5ng h\u1ee3p', access: ['admin'] },
  { key: 'accounts', label: 'T\u00e0i kho\u1ea3n', component: Accounts, group: 'T\u1ed5ng h\u1ee3p', access: ['admin'] },
]

const accounts = ref([])
const resettingDatabase = ref(false)
const databaseResetMessage = ref('')
const databaseResetError = ref('')

const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const registerForm = ref({ displayName: '', username: '', password: '', confirmPassword: '' })
const registerError = ref('')
const registerSuccess = ref('')
const authMode = ref('login')
const currentUser = ref(readStoredUser())
const activeKey = ref(routeKeyFromLocation() || 'dashboard')
const activeRoleKey = computed(() => currentUser.value?.role || '')
const mobileOpen = ref(false)

const activeModule = computed(() => modules.find((item) => item.key === activeKey.value) || modules[0])
const groupedModules = computed(() => modules
  .filter((item) => item.access.includes(activeRoleKey.value))
  .reduce((groups, item) => {
    groups[item.group] = groups[item.group] || []
    groups[item.group].push(item)
    return groups
  }, {}))

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.username && parsed?.role ? parsed : null
  } catch {
    return null
  }
}
function rememberUser(account) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account))
}
function forgetUser() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}
function routeKeyFromLocation() {
  const key = window.location.pathname.replace(/^\/+|\/+$/g, '')
  return modules.some((item) => item.key === key) ? key : ''
}
function pathForKey(key) {
  return `/${key}`
}
function setRoute(key, replace = false) {
  const nextPath = pathForKey(key)
  if (window.location.pathname === nextPath) return
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method]({ key }, '', nextPath)
}
function firstAllowedModule(roleKey) {
  return modules.find((item) => item.access.includes(roleKey)) || modules[0]
}
function moduleForRoute(roleKey) {
  const requestedKey = routeKeyFromLocation()
  const requested = modules.find((item) => item.key === requestedKey)
  if (requested?.access.includes(roleKey)) return requested
  return firstAllowedModule(roleKey)
}
function syncRouteToAccess(replace = false) {
  if (!currentUser.value) return
  const next = moduleForRoute(currentUser.value.role)
  activeKey.value = next.key
  setRoute(next.key, replace || routeKeyFromLocation() !== next.key)
}
function canOpen(item) {
  return item.access.includes(activeRoleKey.value)
}
function navigate(item) {
  if (!canOpen(item)) return
  activeKey.value = item.key
  setRoute(item.key)
  mobileOpen.value = false
}
function openModule(key) {
  const item = modules.find((module) => module.key === key)
  if (item) navigate(item)
}
function login() {
  return api.create('/auth/login', loginForm.value)
    .then((account) => {
      currentUser.value = account
      rememberUser(account)
      const next = moduleForRoute(account.role)
      activeKey.value = next.key
      setRoute(next.key, true)
      loginError.value = ''
      return loadAccounts()
    })
    .catch((error) => {
      loginError.value = error.message
    })
}
function openRegister() {
  authMode.value = 'register'
  loginError.value = ''
}
function openLogin() {
  authMode.value = 'login'
  registerError.value = ''
  registerSuccess.value = ''
}
function registerDonor() {
  const { displayName, username, password, confirmPassword } = registerForm.value
  registerError.value = ''
  registerSuccess.value = ''

  if (!displayName.trim() || !username.trim() || !password) {
    registerError.value = 'Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 h\u1ecd t\u00ean, t\u00ean \u0111\u0103ng nh\u1eadp v\u00e0 m\u1eadt kh\u1ea9u.'
    return
  }
  if (password !== confirmPassword) {
    registerError.value = 'M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp.'
    return
  }
  if (accounts.value.some((item) => item.username.toLowerCase() === username.trim().toLowerCase())) {
    registerError.value = 'T\u00ean \u0111\u0103ng nh\u1eadp \u0111\u00e3 t\u1ed3n t\u1ea1i.'
    return
  }

  return api.create('/auth/register', {
    username: username.trim(),
    password,
    displayName: displayName.trim(),
  })
    .then(() => {
      registerForm.value = { displayName: '', username: '', password: '', confirmPassword: '' }
      registerSuccess.value = '\u0110\u0103ng k\u00fd t\u00e0i kho\u1ea3n ng\u01b0\u1eddi hi\u1ebfn th\u00e0nh c\u00f4ng. B\u1ea1n c\u00f3 th\u1ec3 \u0111\u0103ng nh\u1eadp ngay.'
      authMode.value = 'login'
      return loadAccounts()
    })
    .catch((error) => {
      registerError.value = error.message
    })
}
function loadAccounts() {
  return api.list('/accounts')
    .then((items) => {
      accounts.value = items
      if (currentUser.value && !items.some((item) => item.username === currentUser.value.username)) {
        logout()
      }
    })
    .catch(() => {
      accounts.value = []
    })
}
function promoteToStaff(username) {
  return api.patch('/accounts', `${username}/promote`, {})
    .then(() => loadAccounts())
}
function revokeStaff(username) {
  const account = accounts.value.find((item) => item.username === username)
  const nextRole = account?.hospitalId ? 'hospital' : 'donor'
  return api.patch('/accounts', `${username}/revoke`, { role: nextRole })
    .then(() => loadAccounts())
}
function deleteAccount(username) {
  return api.remove('/accounts', username)
    .then(() => loadAccounts())
}
function resetDatabase() {
  resettingDatabase.value = true
  databaseResetMessage.value = ''
  databaseResetError.value = ''
  return api.create('/admin/reset-database', {})
    .then((result) => {
      databaseResetMessage.value = result.message || '\u0110\u00e3 reset d\u1eef li\u1ec7u v\u1eadn h\u00e0nh. T\u00e0i kho\u1ea3n v\u00e0 quy\u1ec1n \u0111\u01b0\u1ee3c gi\u1eef nguy\u00ean.'
      return loadAccounts()
    })
    .catch((error) => {
      databaseResetError.value = error.message
    })
    .finally(() => {
      resettingDatabase.value = false
    })
}
function logout() {
  currentUser.value = null
  forgetUser()
  loginForm.value = { username: '', password: '' }
  activeKey.value = 'dashboard'
  window.history.replaceState({}, '', '/')
}
function handlePopState() {
  syncRouteToAccess(true)
}

onMounted(() => {
  window.addEventListener('popstate', handlePopState)
  syncRouteToAccess(true)
  loadAccounts()
})
onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <section v-if="!currentUser" class="login-page">
    <div class="login-card">
      <div class="brand-card login-brand">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 3.2 6.7 10a8.1 8.1 0 0 0-1.8 5.1 7.1 7.1 0 0 0 14.2 0c0-1.8-.6-3.6-1.8-5.1L12 3.2Zm0 16a4.1 4.1 0 0 1-4.1-4.1c0-1 .3-2 .9-2.8L12 8.2l3.2 4.1c.6.8.9 1.8.9 2.8A4.1 4.1 0 0 1 12 19.2Z" />
          </svg>
        </div>
        <div>
          <p class="eyebrow">Trung t&#226;m huy&#7871;t h&#7885;c</p>
          <h1>BLOODCHAIN</h1>
        </div>
      </div>

      <div v-if="authMode === 'login'" class="login-copy">
        <p class="eyebrow">&#272;&#259;ng nh&#7853;p h&#7879; th&#7889;ng</p>
        <h2>Qu&#7843;n l&#253; kho m&#225;u trung t&#226;m</h2>
        <p>Vui l&#242;ng &#273;&#259;ng nh&#7853;p &#273;&#7875; ti&#7871;p t&#7909;c qu&#7843;n l&#253; th&#244;ng tin hi&#7871;n m&#225;u v&#224; kho m&#225;u.</p>
      </div>
      <div v-else class="login-copy register-copy">
        <p class="eyebrow">T&#7841;o t&#224;i kho&#7843;n</p>
        <h2>&#272;&#259;ng k&#253; ng&#432;&#7901;i hi&#7871;n m&#225;u</h2>
        <p>T&#7841;o t&#224;i kho&#7843;n &#273;&#7875; ng&#432;&#7901;i hi&#7871;n c&#243; th&#7875; tham gia &#273;&#259;ng k&#253; hi&#7871;n m&#225;u v&#224; theo d&#245;i th&#244;ng tin c&#225; nh&#226;n.</p>
      </div>

      <form v-if="authMode === 'login'" class="login-form" @submit.prevent="login">
        <label class="auth-username-label">T&#234;n &#273;&#259;ng nh&#7853;p<input v-model="loginForm.username" autocomplete="username" /></label>
        <label class="auth-password-label">M&#7853;t kh&#7849;u<input v-model="loginForm.password" type="password" autocomplete="current-password" /></label>
        <p v-if="loginError" class="login-error">{{ loginError }}</p>
        <button class="btn primary" type="submit">&#272;&#259;ng nh&#7853;p</button>
        <button class="btn ghost register-link-button" type="button" @click="openRegister">&#272;&#259;ng k&#253; t&#224;i kho&#7843;n ng&#432;&#7901;i hi&#7871;n</button>
      </form>

      <form v-else class="login-form register-form" @submit.prevent="registerDonor">
        <label>H&#7885; v&#224; t&#234;n<input v-model="registerForm.displayName" autocomplete="name" /></label>
        <label class="auth-username-label">T&#234;n &#273;&#259;ng nh&#7853;p<input v-model="registerForm.username" autocomplete="username" /></label>
        <label class="auth-password-label">M&#7853;t kh&#7849;u<input v-model="registerForm.password" type="password" autocomplete="new-password" /></label>
        <label>X&#225;c nh&#7853;n m&#7853;t kh&#7849;u<input v-model="registerForm.confirmPassword" type="password" autocomplete="new-password" /></label>
        <p v-if="registerError" class="login-error">{{ registerError }}</p>
        <p v-if="registerSuccess" class="login-success">{{ registerSuccess }}</p>
        <button class="btn secondary" type="submit">T&#7841;o t&#224;i kho&#7843;n</button>
        <button class="btn ghost" type="button" @click="openLogin">Quay l&#7841;i &#273;&#259;ng nh&#7853;p</button>
      </form>

    </div>
  </section>

  <div v-else class="app-shell">
    <a class="skip-link" href="#main-content">B&#7887; qua menu</a>
    <aside id="main-sidebar" class="sidebar" :class="{ 'is-open': mobileOpen }" aria-label="&#272;i&#7873;u h&#432;&#7899;ng ch&#237;nh">
      <div class="brand-card">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 3.2 6.7 10a8.1 8.1 0 0 0-1.8 5.1 7.1 7.1 0 0 0 14.2 0c0-1.8-.6-3.6-1.8-5.1L12 3.2Zm0 16a4.1 4.1 0 0 1-4.1-4.1c0-1 .3-2 .9-2.8L12 8.2l3.2 4.1c.6.8.9 1.8.9 2.8A4.1 4.1 0 0 1 12 19.2Z" />
          </svg>
        </div>
        <div><p class="eyebrow">Trung t&#226;m huy&#7871;t h&#7885;c</p><h1>BLOODCHAIN</h1></div>
      </div>


      <nav class="nav-groups">
        <section v-for="(items, group) in groupedModules" :key="group" class="nav-group">
          <p class="nav-group-title">{{ group }}</p>
          <button v-for="item in items" :key="item.key" class="nav-item" :class="{ active: activeKey === item.key }" type="button" :aria-current="activeKey === item.key ? 'page' : undefined" @click="navigate(item)">
            <span>{{ item.label }}</span>
          </button>
        </section>
      </nav>
    </aside>

    <div class="content-shell">
      <header class="topbar">
        <button class="menu-button" type="button" :aria-expanded="mobileOpen" aria-controls="main-sidebar" @click="mobileOpen = !mobileOpen"><span class="menu-lines" aria-hidden="true"></span>Menu</button>
        <div><p class="eyebrow">Khu v&#7921;c &#273;ang m&#7903;</p><h2>{{ activeModule.label }}</h2></div>
        <div class="topbar-actions">
          <div class="operator-pill" aria-label="Ng&#432;&#7901;i d&#249;ng hi&#7879;n t&#7841;i"><span class="status-dot"></span><span class="operator-text"><strong>{{ currentUser.username }}</strong><small>{{ currentUser.displayName }}</small></span></div>
          <button class="btn ghost" type="button" @click="logout">&#272;&#259;ng xu&#7845;t</button>
        </div>
      </header>
      <main id="main-content" class="main-content" tabindex="-1"><Accounts v-if="activeModule.key === 'accounts'" :accounts="accounts" :current-username="currentUser.username" :resetting-database="resettingDatabase" :database-reset-message="databaseResetMessage" :database-reset-error="databaseResetError" @promote-staff="promoteToStaff" @revoke-staff="revokeStaff" @delete-account="deleteAccount" @reset-database="resetDatabase" /><component v-else :is="activeModule.component" @open-module="openModule" /></main>
    </div>
  </div>
</template>
