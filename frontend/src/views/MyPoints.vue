<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'

const summary = ref({ points: 0, memberRank: '', redemptions: [] })
const loading = ref(false)
const error = ref('')

function formatDate(value) {
  if (!value) return '--'
  return new Date(value).toLocaleString('vi-VN')
}

async function loadPoints() {
  loading.value = true
  error.value = ''
  try {
    summary.value = await api.me.points()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadPoints)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>Điểm thưởng</h2>
        <p>Theo dõi số điểm tích lũy và lịch sử đổi quà.</p>
      </div>
    </div>

    <p v-if="error" class="login-error">{{ error }}</p>

    <div class="card-grid">
      <article class="card">
        <p class="card-title">Điểm tích lũy</p>
        <p class="metric">{{ summary.points }}</p>
        <p class="metric-note">Mỗi lần hiến thành công cộng 50 điểm.</p>
      </article>
      <article class="card">
        <p class="card-title">Hạng thành viên</p>
        <p class="metric">{{ summary.memberRank || '--' }}</p>
        <p class="metric-note">Cập nhật khi điểm thay đổi.</p>
      </article>
      <article class="card">
        <p class="card-title">Số lần đổi quà</p>
        <p class="metric">{{ summary.redemptions.length }}</p>
        <p class="metric-note">Liên hệ trung tâm để đổi điểm.</p>
      </article>
    </div>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Lịch sử đổi quà</h3>
          <p>Các phần quà bạn đã đổi từ điểm tích lũy.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã đổi</th>
              <th>Quà</th>
              <th>Ngày đổi</th>
              <th>Điểm trừ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in summary.redemptions" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ formatDate(row.redeemedAt) }}</td>
              <td>{{ row.pointsSpent }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!summary.redemptions.length && !loading" class="empty-state">Chưa có lịch sử đổi quà.</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
    </section>
  </section>
</template>
