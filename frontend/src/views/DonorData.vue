<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination'

const rows = ref([])
const loading = ref(false)
const error = ref('')
const keyword = ref('')

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) => {
    const hay = [r.id, r.name, r.phone, r.bloodGroup, r.gender, r.memberRank]
      .map((v) => String(v ?? '').toLowerCase())
      .join(' ')
    return hay.includes(q)
  })
})

const { page, totalPages, total, paged, goToPage } = usePagination(filtered, 25)

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '--'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await api.list('/donors')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>Dữ liệu người hiến</h2>
        <p>Tra cứu thông tin chi tiết người hiến máu của trung tâm.</p>
      </div>
    </div>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Danh sách người hiến</h3>
          <p>Tìm theo họ tên, số điện thoại, nhóm máu hoặc mã người hiến.</p>
        </div>
        <button class="btn ghost compact" type="button" :disabled="loading" @click="load">Tải lại</button>
      </div>

      <div class="form-grid">
        <label>
          Tìm kiếm
          <input v-model="keyword" type="text" placeholder="Nhập tên / SĐT / nhóm máu / mã..." />
        </label>
      </div>

      <p v-if="error" class="login-error">{{ error }}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Họ tên</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>SĐT</th>
              <th>Nhóm máu</th>
              <th>Tiền sử bệnh</th>
              <th>Điểm tích lũy</th>
              <th>Hạng thành viên</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paged" :key="row.id">
              <td><strong>{{ row.id }}</strong></td>
              <td>{{ row.name }}</td>
              <td>{{ formatDate(row.birthDate) }}</td>
              <td>{{ row.gender || '--' }}</td>
              <td>{{ row.phone || '--' }}</td>
              <td>{{ row.bloodGroup || '--' }}</td>
              <td>{{ row.medicalHistory || '--' }}</td>
              <td>{{ row.points ?? 0 }}</td>
              <td>{{ row.memberRank || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!filtered.length && !loading" class="empty-state">Không tìm thấy người hiến phù hợp.</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
      <Pagination :page="page" :total-pages="totalPages" :total="total" @go="goToPage" />
    </section>
  </section>
</template>
