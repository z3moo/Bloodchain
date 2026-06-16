<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination'

const donations = ref([])
const loading = ref(false)
const error = ref('')

const { page, totalPages, total, paged, goToPage } = usePagination(donations, 20)

function formatDate(value) {
  if (!value) return '--'
  return new Date(value).toLocaleString('vi-VN')
}

async function loadDonations() {
  loading.value = true
  error.value = ''
  try {
    donations.value = await api.me.donations()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadDonations)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>Lịch sử hiến máu</h2>
        <p>Tất cả các túi máu bạn đã hiến và trạng thái xét nghiệm.</p>
      </div>
    </div>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Các lần hiến của bạn</h3>
          <p>Sắp xếp từ gần đây nhất.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã túi máu</th>
              <th>Ngày hiến</th>
              <th>Thể tích (ml)</th>
              <th>Nhóm máu</th>
              <th>Trạng thái xét nghiệm</th>
              <th>Chiến dịch</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paged" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ formatDate(row.donatedAt) }}</td>
              <td>{{ row.volume }}</td>
              <td>{{ row.bloodGroup }}</td>
              <td>{{ row.testStatus || '--' }}</td>
              <td>{{ row.campaignId || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="error" class="login-error">{{ error }}</p>
      <div v-if="!donations.length && !loading" class="empty-state">Bạn chưa có lần hiến nào được ghi nhận.</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
      <Pagination :page="page" :total-pages="totalPages" :total="total" @go="goToPage" />
    </section>
  </section>
</template>
