<script setup>
import { computed, toRef } from 'vue'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination'

const props = defineProps({
  accounts: { type: Array, required: true },
  pendingAccounts: { type: Array, default: () => [] },
  currentUsername: { type: String, required: true },
  resettingDatabase: { type: Boolean, default: false },
  databaseResetMessage: { type: String, default: '' },
  databaseResetError: { type: String, default: '' },
})

// Donors self-register and manage their own profile, so they don't belong in
// the admin account-management list (only admin/staff/hospital are managed here).
const visibleAccounts = computed(() => props.accounts.filter((a) => a.role !== 'donor'))
const acc = usePagination(visibleAccounts, 25)

const emit = defineEmits(['revoke-staff', 'delete-account', 'approve-account', 'reject-account', 'reset-database'])

const roleRequestLabels = {
  HOSPITAL: 'Bệnh viện',
  STAFF: 'Nhân viên trung tâm',
  DONOR: 'Người hiến',
}
function requestRoleLabel(role) {
  return roleRequestLabels[String(role || '').toUpperCase()] || role || '--'
}
function approveAccount(account) {
  if (window.confirm(`Duyệt tài khoản "${account.username}"? Hệ thống sẽ tạo hồ sơ đơn vị tương ứng.`)) {
    emit('approve-account', account.username)
  }
}
function rejectAccount(account) {
  if (window.confirm(`Từ chối và xóa yêu cầu của "${account.username}"?`)) {
    emit('reject-account', account.username)
  }
}

const labels = {
  admin: 'Quản trị',
  staff: 'Nh\u00e2n vi\u00ean trung t\u00e2m',
  hospital: 'B\u1ec7nh vi\u1ec7n',
  donor: 'Ng\u01b0\u1eddi hi\u1ebfn',
}

function accountLabel(account) {
  return labels[account.role] || account.displayName
}
function canRevoke(account) {
  return account.role === 'staff'
}
function canDelete(account, currentUsername) {
  return account.role !== 'admin' && account.username !== currentUsername
}
function revoke(account) {
  if (canRevoke(account)) emit('revoke-staff', account.username)
}
function remove(account) {
  emit('delete-account', account.username)
}
function resetDatabase() {
  const confirmed = window.confirm('Khôi phục toàn bộ dữ liệu về mẫu? TẤT CẢ tài khoản (kể cả người hiến đã đăng ký và staff đã cấp quyền) sẽ bị xóa và đặt lại về 4 tài khoản mẫu. Hành động này không thể hoàn tác.')
  if (confirmed) emit('reset-database')
}
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>T&#224;i kho&#7843;n</h2>
        <p>Theo d&#245;i ng&#432;&#7901;i &#273;ang s&#7917; d&#7909;ng h&#7879; th&#7889;ng v&#224; chuy&#7875;n t&#224;i kho&#7843;n ph&#249; h&#7907;p th&#224;nh Staff.</p>
      </div>
    </div>

    <section v-if="pendingAccounts.length" class="table-card">
      <div class="section-title">
        <div>
          <h3>T&#224;i kho&#7843;n ch&#7901; duy&#7879;t</h3>
          <p>Y&#234;u c&#7847;u t&#7841;o t&#224;i kho&#7843;n b&#7879;nh vi&#7879;n / nh&#226;n vi&#234;n. Duy&#7879;t s&#7869; t&#7841;o h&#7891; s&#417; &#273;&#417;n v&#7883; v&#224; k&#237;ch ho&#7841;t &#273;&#259;ng nh&#7853;p.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>T&#234;n &#273;&#259;ng nh&#7853;p</th>
              <th>Lo&#7841;i</th>
              <th>T&#234;n &#273;&#417;n v&#7883; / h&#7885; t&#234;n</th>
              <th>&#272;&#7883;a ch&#7881; / ch&#7913;c v&#7909;</th>
              <th>S&#272;T</th>
              <th>Thao t&#225;c</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in pendingAccounts" :key="account.username">
              <td><strong>{{ account.username }}</strong></td>
              <td>{{ requestRoleLabel(account.requestedRole) }}</td>
              <td>{{ account.orgName || account.displayName }}</td>
              <td>{{ account.address || account.position || '--' }}</td>
              <td>{{ account.phone || '--' }}</td>
              <td>
                <div class="action-row">
                  <button class="btn primary compact" type="button" @click="approveAccount(account)">Duy&#7879;t</button>
                  <button class="btn danger compact" type="button" @click="rejectAccount(account)">T&#7915; ch&#7889;i</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Danh s&#225;ch t&#224;i kho&#7843;n</h3>
          <p>Admin c&#243; th&#7875; thu h&#7891;i quy&#7873;n staff ho&#7863;c x&#243;a t&#224;i kho&#7843;n kh&#244;ng c&#242;n s&#7917; d&#7909;ng. T&#224;i kho&#7843;n ng&#432;&#7901;i hi&#7871;n kh&#244;ng hi&#7875;n th&#7883; &#7903; &#273;&#226;y.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>T&#234;n &#273;&#259;ng nh&#7853;p</th>
              <th>T&#234;n hi&#7875;n th&#7883;</th>
              <th>Nh&#243;m s&#7917; d&#7909;ng</th>
              <th>Tr&#7841;ng th&#225;i</th>
              <th>Thao t&#225;c</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in acc.paged.value" :key="account.username">
              <td><strong>{{ account.username }}</strong></td>
              <td>{{ account.displayName }}</td>
              <td>{{ accountLabel(account) }}</td>
              <td><span class="badge info" v-if="account.username === currentUsername">&#272;ang &#273;&#259;ng nh&#7853;p</span><span v-else class="badge neutral">Ho&#7841;t &#273;&#7897;ng</span></td>
              <td>
                <div v-if="canRevoke(account)" class="action-row">
                  <button class="btn secondary compact" type="button" @click="revoke(account)">Kh&#244;ng cho l&#224;m Staff</button>
                  <button v-if="canDelete(account, currentUsername)" class="btn danger compact" type="button" @click="remove(account)">X&#243;a</button>
                </div>
                <button v-else-if="canDelete(account, currentUsername)" class="btn danger compact" type="button" @click="remove(account)">X&#243;a</button>
                <span v-else class="muted-text">Kh&#244;ng c&#7847;n thay &#273;&#7893;i</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination :page="acc.page.value" :total-pages="acc.totalPages.value" :total="acc.total.value" @go="acc.goToPage" />
    </section>

    <section class="table-card danger-zone">
      <div class="section-title">
        <div>
          <h3>Khôi phục dữ liệu mẫu</h3>
          <p>Chỉ quản trị dùng khi muốn xóa toàn bộ dữ liệu và khôi phục lại dữ liệu mẫu. Lưu ý: tất cả tài khoản hiện có sẽ bị xóa và đặt lại về 4 tài khoản mẫu.</p>
        </div>
      </div>
      <p v-if="databaseResetError" class="login-error">{{ databaseResetError }}</p>
      <p v-if="databaseResetMessage" class="login-success">{{ databaseResetMessage }}</p>
      <button class="btn danger" type="button" :disabled="resettingDatabase" @click="resetDatabase">
        {{ resettingDatabase ? 'Đang khôi phục dữ liệu...' : 'Khôi phục dữ liệu mẫu' }}
      </button>
    </section>
  </section>
</template>
