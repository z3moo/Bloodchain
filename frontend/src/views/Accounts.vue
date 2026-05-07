<script setup>
defineProps({
  accounts: { type: Array, required: true },
  currentUsername: { type: String, required: true },
  resettingDatabase: { type: Boolean, default: false },
  databaseResetMessage: { type: String, default: '' },
  databaseResetError: { type: String, default: '' },
})

const emit = defineEmits(['promote-staff', 'revoke-staff', 'delete-account', 'reset-database'])

const labels = {
  admin: 'BLOODCHAIN',
  staff: 'Nh\u00e2n vi\u00ean trung t\u00e2m',
  hospital: 'B\u1ec7nh vi\u1ec7n',
  donor: 'Ng\u01b0\u1eddi hi\u1ebfn',
}

function accountLabel(account) {
  return labels[account.role] || account.displayName
}
function canPromote(account) {
  return account.role !== 'admin' && account.role !== 'staff'
}
function canRevoke(account) {
  return account.role === 'staff'
}
function canDelete(account, currentUsername) {
  return account.role !== 'admin' && account.username !== currentUsername
}
function promote(account) {
  if (canPromote(account)) emit('promote-staff', account.username)
}
function revoke(account) {
  if (canRevoke(account)) emit('revoke-staff', account.username)
}
function remove(account) {
  emit('delete-account', account.username)
}
function resetDatabase() {
  const confirmed = window.confirm('Reset toàn bộ database về dữ liệu mẫu? Tất cả dữ liệu đã thêm sẽ bị xóa.')
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

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Danh s&#225;ch t&#224;i kho&#7843;n</h3>
          <p>Admin c&#243; th&#7875; c&#7845;p quy&#7873;n staff, thu h&#7891;i quy&#7873;n staff ho&#7863;c x&#243;a t&#224;i kho&#7843;n kh&#244;ng c&#242;n s&#7917; d&#7909;ng.</p>
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
            <tr v-for="account in accounts" :key="account.username">
              <td><strong>{{ account.username }}</strong></td>
              <td>{{ account.displayName }}</td>
              <td>{{ accountLabel(account) }}</td>
              <td><span class="badge info" v-if="account.username === currentUsername">&#272;ang &#273;&#259;ng nh&#7853;p</span><span v-else class="badge neutral">Ho&#7841;t &#273;&#7897;ng</span></td>
              <td>
                <button v-if="canPromote(account)" class="btn primary compact" type="button" @click="promote(account)">Chuy&#7875;n th&#224;nh Staff</button>
                <div v-else-if="canRevoke(account)" class="action-row">
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
    </section>

    <section class="table-card danger-zone">
      <div class="section-title">
        <div>
          <h3>Reset database</h3>
          <p>Chỉ admin dùng khi muốn xóa dữ liệu test và tạo lại dữ liệu mẫu ban đầu.</p>
        </div>
      </div>
      <p v-if="databaseResetError" class="login-error">{{ databaseResetError }}</p>
      <p v-if="databaseResetMessage" class="login-success">{{ databaseResetMessage }}</p>
      <button class="btn danger" type="button" :disabled="resettingDatabase" @click="resetDatabase">
        {{ resettingDatabase ? 'Đang reset database...' : 'Reset toàn bộ database' }}
      </button>
    </section>
  </section>
</template>
