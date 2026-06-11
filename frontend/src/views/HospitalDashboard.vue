<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api'

const emit = defineEmits(['open-module'])
const currentUser = (() => {
  try {
    return JSON.parse(window.localStorage.getItem('bloodchain.currentUser') || 'null')
  } catch {
    return null
  }
})()

const requests = ref([])
const exports = ref([])
const loading = ref(false)
const error = ref('')

const pendingCount = computed(() => requests.value.filter((row) => String(row.status || '').trim() === 'Chờ duyệt').length)
const approvedCount = computed(() => requests.value.filter((row) => String(row.status || '').trim() === 'Đã duyệt').length)
const exportsThisMonth = computed(() => {
  const now = new Date()
  return exports.value.filter((row) => {
    if (!row.exportedAt) return false
    const d = new Date(row.exportedAt)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
})

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '--'
}

async function loadDashboard() {
  loading.value = true
  error.value = ''
  try {
    const [reqs, exps] = await Promise.all([
      api.list('/requests').catch(() => []),
      api.list('/exports').catch(() => []),
    ])
    requests.value = reqs
    exports.value = exps
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>Tổng quan bệnh viện</h2>
        <p>Trạng thái nhanh các phiếu yêu cầu máu của bệnh viện bạn.</p>
      </div>
      <div class="hero-actions">
        <button class="btn primary" type="button" @click="emit('open-module', 'requests')">Tạo phiếu yêu cầu</button>
        <button class="btn ghost" type="button" @click="emit('open-module', 'exports')">Xem phiếu xuất</button>
      </div>
    </div>

    <p v-if="error" class="login-error">{{ error }}</p>

    <div class="card-grid">
      <article class="card">
        <p class="card-title">Phiếu chờ duyệt</p>
        <p class="metric">{{ pendingCount }}</p>
        <p class="metric-note">Đang chờ trung tâm xử lý</p>
      </article>
      <article class="card">
        <p class="card-title">Phiếu đã duyệt</p>
        <p class="metric">{{ approvedCount }}</p>
        <p class="metric-note">Sẵn sàng cấp máu</p>
      </article>
      <article class="card">
        <p class="card-title">Xuất kho tháng này</p>
        <p class="metric">{{ exportsThisMonth }}</p>
        <p class="metric-note">Tổng phiếu xuất đã nhận</p>
      </article>
    </div>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Phiếu xuất gần đây</h3>
          <p>Hiển thị các phiếu xuất kho ứng với phiếu yêu cầu của bệnh viện bạn.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Phiếu xuất</th>
              <th>Phiếu yêu cầu</th>
              <th>Ngày xuất</th>
              <th>Thể tích (ml)</th>
              <th>Phản ứng chéo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in exports.slice(0, 10)" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.requestId }}</td>
              <td>{{ formatDate(row.exportedAt) }}</td>
              <td>{{ row.totalVolume }}</td>
              <td>{{ row.crossMatch || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!exports.length && !loading" class="empty-state">Chưa có phiếu xuất.</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
    </section>
  </section>
</template>
