<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  formTitle: { type: String, required: true },
  formDescription: { type: String, default: 'Nhập thông tin rồi bấm lưu để cập nhật dữ liệu.' },
  endpoint: { type: String, required: true },
  fields: { type: Array, required: true },
  columns: { type: Array, required: true },
  emptyText: { type: String, default: 'Chưa có dữ liệu.' },
})

const rows = ref([])
const loading = ref(false)
const message = ref('')
const error = ref('')
const form = reactive({})

function resetForm() {
  props.fields.forEach((field) => {
    form[field.key] = field.default ?? ''
  })
  message.value = ''
  error.value = ''
}

async function loadRows() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await api.list(props.endpoint)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function save() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await api.create(props.endpoint, { ...form })
    message.value = 'Đã lưu thông tin thành công.'
    resetForm()
    await loadRows()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function display(row, column) {
  const value = row[column.key]
  if (value === null || value === undefined || value === '') return '--'
  if (column.type === 'date') return new Date(value).toLocaleDateString('vi-VN')
  if (column.type === 'datetime') return new Date(value).toLocaleString('vi-VN')
  return value
}

onMounted(() => {
  resetForm()
  loadRows()
})
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
    </div>

    <form class="form-card" @submit.prevent="save">
      <div class="section-title">
        <div>
          <h3>{{ formTitle }}</h3>
          <p>{{ formDescription }}</p>
        </div>
      </div>
      <div class="form-grid three">
        <label v-for="field in fields" :key="field.key">
          {{ field.label }}
          <input v-model="form[field.key]" :type="field.type || 'text'" :placeholder="field.placeholder || field.label" />
        </label>
      </div>
      <p v-if="error" class="login-error">{{ error }}</p>
      <p v-if="message" class="login-success">{{ message }}</p>
      <div class="form-actions">
        <button class="btn primary" type="submit" :disabled="loading">Lưu thông tin</button>
        <button class="btn ghost" type="button" :disabled="loading" @click="resetForm">Làm mới</button>
      </div>
    </form>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Danh sách</h3>
          <p>Dữ liệu đang được đọc trực tiếp từ SQL Server.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td v-for="column in columns" :key="column.key">{{ display(row, column) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!rows.length && !loading" class="empty-state">{{ emptyText }}</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
    </section>
  </section>
</template>
