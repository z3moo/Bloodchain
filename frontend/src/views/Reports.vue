<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'

const inventory = ref([])
const expiring = ref([])
const campaigns = ref([])
const error = ref('')
const loading = ref(false)

async function loadReports() {
  loading.value = true
  error.value = ''
  try {
    const [inventoryRows, expiringRows, campaignRows] = await Promise.all([
      api.reports.inventory(),
      api.reports.expiring(),
      api.reports.campaigns(),
    ])
    inventory.value = inventoryRows
    expiring.value = expiringRows
    campaigns.value = campaignRows
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadReports)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>Báo cáo</h2>
        <p>Xem thống kê tồn kho, túi sắp hết hạn và hiệu quả chiến dịch.</p>
      </div>
      <div class="hero-actions">
        <button class="btn primary" type="button" :disabled="loading" @click="loadReports">Tải báo cáo</button>
      </div>
    </div>

    <p v-if="error" class="login-error">{{ error }}</p>

    <section class="table-card">
      <div class="section-title"><div><h3>Tồn kho theo nhóm máu</h3><p>Dữ liệu đọc từ bảng thành phần máu.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Nhóm máu</th><th>Hồng cầu</th><th>Huyết tương</th><th>Tiểu cầu</th><th>Tổng</th></tr></thead><tbody><tr v-for="row in inventory" :key="row.bloodGroup"><td>{{ row.bloodGroup }}</td><td>{{ row.redCells }}</td><td>{{ row.plasma }}</td><td>{{ row.platelets }}</td><td>{{ row.total }}</td></tr></tbody></table></div>
    </section>

    <div class="card-grid two">
      <section class="table-card">
        <div class="section-title"><div><h3>Sắp hết hạn</h3><p>Túi máu hết hạn trong 30 ngày.</p></div></div>
        <div class="table-wrap"><table><thead><tr><th>Mã</th><th>Loại</th><th>Hạn dùng</th><th>Trạng thái</th></tr></thead><tbody><tr v-for="row in expiring" :key="row.id"><td>{{ row.id }}</td><td>{{ row.type }}</td><td>{{ new Date(row.expiresAt).toLocaleDateString('vi-VN') }}</td><td>{{ row.status }}</td></tr></tbody></table></div>
      </section>
      <section class="table-card">
        <div class="section-title"><div><h3>Chiến dịch</h3><p>So sánh dự kiến và thực tế.</p></div></div>
        <div class="table-wrap"><table><thead><tr><th>Mã</th><th>Tên</th><th>Dự kiến</th><th>Thực tế</th></tr></thead><tbody><tr v-for="row in campaigns" :key="row.id"><td>{{ row.id }}</td><td>{{ row.name }}</td><td>{{ row.expected }}</td><td>{{ row.actual }}</td></tr></tbody></table></div>
      </section>
    </div>
  </section>
</template>
