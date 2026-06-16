<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination'

const all = ref([])
const mine = ref([])
const loading = ref(false)
const message = ref('')
const error = ref('')

const upcoming = computed(() => {
  const now = Date.now()
  return all.value.filter((c) => !c.time || new Date(c.time).getTime() >= now)
})

const myCampaignIds = computed(() => new Set(mine.value.map((row) => row.id)))

const up = usePagination(upcoming, 15)
const mn = usePagination(mine, 15)

function formatDate(value) {
  if (!value) return '--'
  return new Date(value).toLocaleString('vi-VN')
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [campaigns, registered] = await Promise.all([
      api.list('/campaigns').catch(() => []),
      api.me.campaigns().catch(() => []),
    ])
    all.value = campaigns
    mine.value = registered
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function register(campaignId) {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await api.create(`/campaigns/${campaignId}/register`, {})
    message.value = 'Đã đăng ký tham gia.'
    await loadAll()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function unregister(campaignId) {
  if (!window.confirm('Hủy đăng ký chiến dịch này?')) return
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await api.removePath(`/campaigns/${campaignId}/register`)
    message.value = 'Đã hủy đăng ký.'
    await loadAll()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>Chiến dịch sắp tới</h2>
        <p>Xem các đợt tiếp nhận máu và đăng ký tham gia.</p>
      </div>
    </div>

    <p v-if="error" class="login-error">{{ error }}</p>
    <p v-if="message" class="login-success">{{ message }}</p>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Sắp diễn ra</h3>
          <p>Bấm "Đăng ký tham gia" để có tên trong danh sách hiến của chiến dịch.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên chiến dịch</th>
              <th>Địa điểm</th>
              <th>Thời gian</th>
              <th>Dự kiến</th>
              <th>Thực tế</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in up.paged.value" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.location || '--' }}</td>
              <td>{{ formatDate(row.time) }}</td>
              <td>{{ row.expected }}</td>
              <td>{{ row.actual }}</td>
              <td>
                <button
                  v-if="myCampaignIds.has(row.id)"
                  class="btn ghost compact"
                  type="button"
                  :disabled="loading"
                  @click="unregister(row.id)"
                >Hủy đăng ký</button>
                <button
                  v-else
                  class="btn primary compact"
                  type="button"
                  :disabled="loading"
                  @click="register(row.id)"
                >Đăng ký tham gia</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!upcoming.length && !loading" class="empty-state">Chưa có chiến dịch sắp diễn ra.</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
      <Pagination :page="up.page.value" :total-pages="up.totalPages.value" :total="up.total.value" @go="up.goToPage" />
    </section>

    <section class="table-card" v-if="mine.length">
      <div class="section-title">
        <div>
          <h3>Chiến dịch tôi đã đăng ký</h3>
          <p>Bao gồm cả chiến dịch đã diễn ra trong quá khứ.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên chiến dịch</th>
              <th>Thời gian</th>
              <th>Đăng ký lúc</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in mn.paged.value" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ formatDate(row.time) }}</td>
              <td>{{ formatDate(row.registeredAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination :page="mn.page.value" :total-pages="mn.totalPages.value" :total="mn.total.value" @go="mn.goToPage" />
    </section>
  </section>
</template>
