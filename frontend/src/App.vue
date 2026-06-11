<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Dashboard from './views/Dashboard.vue'
import HospitalDashboard from './views/HospitalDashboard.vue'
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
import MyProfile from './views/MyProfile.vue'
import MyDonations from './views/MyDonations.vue'
import DonorCampaigns from './views/DonorCampaigns.vue'
import MyPoints from './views/MyPoints.vue'
import DonorData from './views/DonorData.vue'
import { api } from './api'

const SESSION_STORAGE_KEY = 'bloodchain.currentUser'

// Order matters: firstAllowedModule(role) returns the first match, which
// becomes the post-login landing page. Hospital lands on hospital-dashboard,
// donor lands on my-profile, admin/staff land on dashboard.
const modules = [
  { key: 'dashboard', label: 'Tổng quan', component: Dashboard, group: 'Điều hành', access: ['admin', 'staff'] },
  { key: 'hospital-dashboard', label: 'Tổng quan bệnh viện', component: HospitalDashboard, group: 'Điều hành', access: ['hospital'] },
  { key: 'my-profile', label: 'Hồ sơ của tôi', component: MyProfile, group: 'Người hiến', access: ['donor'] },
  { key: 'my-donations', label: 'Lịch sử hiến máu', component: MyDonations, group: 'Người hiến', access: ['donor'] },
  { key: 'donor-campaigns', label: 'Chiến dịch sắp tới', component: DonorCampaigns, group: 'Người hiến', access: ['donor'] },
  { key: 'my-points', label: 'Điểm thưởng', component: MyPoints, group: 'Người hiến', access: ['donor'] },
  { key: 'donors', label: 'Người hiến máu', component: Donors, group: 'Người hiến', access: ['admin', 'staff'] },
  { key: 'donor-data', label: 'Dữ liệu người hiến', component: DonorData, group: 'Người hiến', access: ['admin', 'staff'] },
  { key: 'campaigns', label: 'Chiến dịch', component: Campaigns, group: 'Tiếp nhận', access: ['admin', 'staff'] },
  { key: 'blood-bags', label: 'Gói máu', component: BloodBags, group: 'Tiếp nhận', access: ['admin', 'staff'] },
  { key: 'lab-tests', label: 'Xét nghiệm', component: LabTests, group: 'Y khoa', access: ['admin', 'staff'] },
  { key: 'components', label: 'Kho máu', component: Components, group: 'Kho', access: ['admin', 'staff'] },
  { key: 'hospitals', label: 'Bệnh viện', component: Hospitals, group: 'Cung ứng', access: ['admin', 'staff'] },
  { key: 'patients', label: 'Bệnh nhân', component: Patients, group: 'Cung ứng', access: ['admin', 'hospital', 'staff'] },
  { key: 'requests', label: 'Phiếu yêu cầu', component: Requests, group: 'Cung ứng', access: ['admin', 'hospital', 'staff'] },
  { key: 'exports', label: 'Xuất kho FIFO', component: Exports, group: 'Cung ứng', access: ['admin', 'staff'] },
  { key: 'reports', label: 'Báo cáo', component: Reports, group: 'Tổng hợp', access: ['admin', 'staff'] },
  { key: 'accounts', label: 'Tài khoản', component: Accounts, group: 'Tổng hợp', access: ['admin'] },
]

const accounts = ref([])
const pendingAccounts = ref([])
const resettingDatabase = ref(false)
const databaseResetMessage = ref('')
const databaseResetError = ref('')

const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const registerForm = ref({
  displayName: '',
  username: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  gender: 'Khác',
  phone: '',
  bloodGroup: 'O+',
})
const bloodGroups = ref([])
const registerError = ref('')
const registerSuccess = ref('')
const orgForm = ref({
  displayName: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'hospital',
  orgName: '',
  address: '',
  phone: '',
  position: '',
  email: '',
})
const orgError = ref('')
const orgSuccess = ref('')
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
      // Only admin reaches the Accounts page; load that data on demand instead
      // of unauthenticated on app boot. Other roles don't need the list.
      if (account.role === 'admin') return Promise.all([loadAccounts(), loadPending()])
      return null
    })
    .catch((error) => {
      loginError.value = error.message
    })
}
function loadBloodGroups() {
  return api.list('/blood-groups')
    .then((items) => {
      bloodGroups.value = items
      if (items.length && !registerForm.value.bloodGroup) {
        registerForm.value.bloodGroup = items[0].id
      }
    })
    .catch(() => {
      bloodGroups.value = []
    })
}
function openRegister() {
  authMode.value = 'register'
  loginError.value = ''
  if (!bloodGroups.value.length) loadBloodGroups()
}
function openLogin() {
  authMode.value = 'login'
  registerError.value = ''
  registerSuccess.value = ''
  orgError.value = ''
  orgSuccess.value = ''
}
function openRegisterOrg() {
  authMode.value = 'register-org'
  loginError.value = ''
  orgError.value = ''
  orgSuccess.value = ''
}
function registerOrg() {
  const { displayName, username, password, confirmPassword, role } = orgForm.value
  orgError.value = ''
  orgSuccess.value = ''

  if (!displayName.trim() || !username.trim() || !password) {
    orgError.value = 'Vui lòng nhập đầy đủ họ tên / tên đơn vị, tên đăng nhập và mật khẩu.'
    return
  }
  if (password !== confirmPassword) {
    orgError.value = 'Mật khẩu xác nhận không khớp.'
    return
  }

  return api.registerStaff({
    username: username.trim(),
    password,
    displayName: displayName.trim(),
    email: orgForm.value.email,
    role,
    orgName: orgForm.value.orgName || displayName.trim(),
    address: orgForm.value.address,
    phone: orgForm.value.phone,
    position: orgForm.value.position,
  })
    .then((result) => {
      orgForm.value = {
        displayName: '', username: '', password: '', confirmPassword: '',
        role: 'hospital', orgName: '', address: '', phone: '', position: '', email: '',
      }
      orgSuccess.value = result?.message || 'Đã gửi yêu cầu. Vui lòng chờ quản trị duyệt tài khoản.'
      authMode.value = 'login'
    })
    .catch((error) => {
      orgError.value = error.message
    })
}
function registerDonor() {
  const { displayName, username, password, confirmPassword } = registerForm.value
  registerError.value = ''
  registerSuccess.value = ''

  if (!displayName.trim() || !username.trim() || !password) {
    registerError.value = 'Vui lòng nhập đầy đủ họ tên, tên đăng nhập và mật khẩu.'
    return
  }
  if (password !== confirmPassword) {
    registerError.value = 'Mật khẩu xác nhận không khớp.'
    return
  }

  // Backend already returns 409 on duplicate username; trust that instead of
  // pre-fetching the entire account list before login (information disclosure).
  return api.create('/auth/register', {
    username: username.trim(),
    password,
    displayName: displayName.trim(),
    birthDate: registerForm.value.birthDate || null,
    gender: registerForm.value.gender,
    phone: registerForm.value.phone,
    bloodGroup: registerForm.value.bloodGroup,
  })
    .then(() => {
      registerForm.value = {
        displayName: '',
        username: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
        gender: 'Khác',
        phone: '',
        bloodGroup: bloodGroups.value[0]?.id || 'O+',
      }
      registerSuccess.value = 'Đăng ký tài khoản người hiến thành công. Bạn có thể đăng nhập ngay.'
      authMode.value = 'login'
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
function loadPending() {
  return api.accounts.pending()
    .then((items) => { pendingAccounts.value = items })
    .catch(() => { pendingAccounts.value = [] })
}
function approveAccount(username) {
  return api.accounts.approve(username)
    .then(() => Promise.all([loadAccounts(), loadPending()]))
}
function rejectAccount(username) {
  return api.accounts.reject(username)
    .then(() => loadPending())
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
      databaseResetMessage.value = result.message || 'Đã khôi phục dữ liệu mẫu. Tài khoản đã được đặt lại về 4 tài khoản mẫu.'
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
  accounts.value = []
  pendingAccounts.value = []
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
  // Defer account fetch to logged-in admins (see login()) so anonymous visitors
  // don't see the full username/role list. authMode='register' loads blood
  // groups on demand.
  if (currentUser.value?.role === 'admin') {
    loadAccounts()
    loadPending()
  }
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
      <div v-else-if="authMode === 'register'" class="login-copy register-copy">
        <p class="eyebrow">T&#7841;o t&#224;i kho&#7843;n</p>
        <h2>&#272;&#259;ng k&#253; ng&#432;&#7901;i hi&#7871;n m&#225;u</h2>
        <p>T&#7841;o t&#224;i kho&#7843;n &#273;&#7875; ng&#432;&#7901;i hi&#7871;n c&#243; th&#7875; tham gia &#273;&#259;ng k&#253; hi&#7871;n m&#225;u v&#224; theo d&#245;i th&#244;ng tin c&#225; nh&#226;n.</p>
      </div>
      <div v-else class="login-copy register-copy">
        <p class="eyebrow">T&#7841;o t&#224;i kho&#7843;n</p>
        <h2>&#272;&#259;ng k&#253; b&#7879;nh vi&#7879;n / nh&#226;n vi&#234;n</h2>
        <p>G&#7917;i y&#234;u c&#7847;u t&#7841;o t&#224;i kho&#7843;n b&#7879;nh vi&#7879;n ho&#7863;c nh&#226;n vi&#234;n trung t&#226;m. Qu&#7843;n tr&#7883; vi&#234;n s&#7869; duy&#7879;t tr&#432;&#7899;c khi b&#7841;n &#273;&#259;ng nh&#7853;p &#273;&#432;&#7907;c.</p>
      </div>

      <form v-if="authMode === 'login'" class="login-form" @submit.prevent="login">
        <label class="auth-username-label">T&#234;n &#273;&#259;ng nh&#7853;p<input v-model="loginForm.username" autocomplete="username" /></label>
        <label class="auth-password-label">M&#7853;t kh&#7849;u<input v-model="loginForm.password" type="password" autocomplete="current-password" /></label>
        <p v-if="loginError" class="login-error">{{ loginError }}</p>
        <p v-if="orgSuccess" class="login-success">{{ orgSuccess }}</p>
        <button class="btn primary" type="submit">&#272;&#259;ng nh&#7853;p</button>
        <button class="btn ghost register-link-button" type="button" @click="openRegister">&#272;&#259;ng k&#253; t&#224;i kho&#7843;n ng&#432;&#7901;i hi&#7871;n</button>
        <button class="btn ghost register-link-button" type="button" @click="openRegisterOrg">&#272;&#259;ng k&#253; b&#7879;nh vi&#7879;n / nh&#226;n vi&#234;n</button>
      </form>

      <form v-else-if="authMode === 'register'" class="login-form register-form" @submit.prevent="registerDonor">
        <label>H&#7885; v&#224; t&#234;n<input v-model="registerForm.displayName" autocomplete="name" /></label>
        <label class="auth-username-label">T&#234;n &#273;&#259;ng nh&#7853;p<input v-model="registerForm.username" autocomplete="username" /></label>
        <label class="auth-password-label">M&#7853;t kh&#7849;u<input v-model="registerForm.password" type="password" autocomplete="new-password" /></label>
        <label>X&#225;c nh&#7853;n m&#7853;t kh&#7849;u<input v-model="registerForm.confirmPassword" type="password" autocomplete="new-password" /></label>
        <label>Ng&#224;y sinh<input v-model="registerForm.birthDate" type="date" /></label>
        <label>Gi&#7899;i t&#237;nh
          <select v-model="registerForm.gender">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </label>
        <label>S&#7889; &#273;i&#7879;n tho&#7841;i<input v-model="registerForm.phone" type="text" autocomplete="tel" placeholder="0912345678" /></label>
        <label>Nh&#243;m m&#225;u
          <select v-model="registerForm.bloodGroup">
            <option v-for="g in bloodGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </label>
        <p v-if="registerError" class="login-error">{{ registerError }}</p>
        <p v-if="registerSuccess" class="login-success">{{ registerSuccess }}</p>
        <button class="btn secondary" type="submit">T&#7841;o t&#224;i kho&#7843;n</button>
        <button class="btn ghost" type="button" @click="openLogin">Quay l&#7841;i &#273;&#259;ng nh&#7853;p</button>
      </form>

      <form v-else class="login-form register-form" @submit.prevent="registerOrg">
        <label>Lo&#7841;i t&#224;i kho&#7843;n
          <select v-model="orgForm.role">
            <option value="hospital">B&#7879;nh vi&#7879;n</option>
            <option value="staff">Nh&#226;n vi&#234;n trung t&#226;m</option>
          </select>
        </label>
        <label>{{ orgForm.role === 'hospital' ? 'Tên bệnh viện' : 'Họ và tên' }}<input v-model="orgForm.displayName" autocomplete="organization" /></label>
        <label class="auth-username-label">T&#234;n &#273;&#259;ng nh&#7853;p<input v-model="orgForm.username" autocomplete="username" /></label>
        <label class="auth-password-label">M&#7853;t kh&#7849;u<input v-model="orgForm.password" type="password" autocomplete="new-password" /></label>
        <label>X&#225;c nh&#7853;n m&#7853;t kh&#7849;u<input v-model="orgForm.confirmPassword" type="password" autocomplete="new-password" /></label>
        <label v-if="orgForm.role === 'hospital'">&#272;&#7883;a ch&#7881;<input v-model="orgForm.address" type="text" placeholder="78 Gi&#7843;i Ph&#243;ng, H&#224; N&#7897;i" /></label>
        <label v-else>Ch&#7913;c v&#7909;<input v-model="orgForm.position" type="text" placeholder="K&#7929; thu&#7853;t vi&#234;n x&#233;t nghi&#7879;m" /></label>
        <label>S&#7889; &#273;i&#7879;n tho&#7841;i<input v-model="orgForm.phone" type="text" autocomplete="tel" placeholder="0912345678" /></label>
        <label>Email<input v-model="orgForm.email" type="email" autocomplete="email" /></label>
        <p v-if="orgError" class="login-error">{{ orgError }}</p>
        <p v-if="orgSuccess" class="login-success">{{ orgSuccess }}</p>
        <button class="btn secondary" type="submit">G&#7917;i y&#234;u c&#7847;u duy&#7879;t</button>
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
      <main id="main-content" class="main-content" tabindex="-1"><Accounts v-if="activeModule.key === 'accounts'" :accounts="accounts" :pending-accounts="pendingAccounts" :current-username="currentUser.username" :resetting-database="resettingDatabase" :database-reset-message="databaseResetMessage" :database-reset-error="databaseResetError" @promote-staff="promoteToStaff" @revoke-staff="revokeStaff" @delete-account="deleteAccount" @approve-account="approveAccount" @reject-account="rejectAccount" @reset-database="resetDatabase" /><component v-else :is="activeModule.component" @open-module="openModule" /></main>
    </div>
  </div>
</template>
