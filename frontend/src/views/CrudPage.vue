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
const editingId = ref(null)
const form = reactive({})
const lookups = reactive({})

function defaultFor(field) {
  return field.default ?? (field.options && field.options[0]?.id) ?? ''
}

function resetForm() {
  props.fields.forEach((field) => {
    form[field.key] = defaultFor(field)
  })
  editingId.value = null
  message.value = ''
  error.value = ''
}

async function loadLookups() {
  await Promise.all(props.fields.filter((f) => f.optionsFrom).map(async (field) => {
    try {
      lookups[field.key] = await api.list(field.optionsFrom)
    } catch {
      lookups[field.key] = []
    }
  }))
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
    const payload = { ...form }
    if (editingId.value) {
      await api.update(props.endpoint, editingId.value, payload)
      message.value = 'Đã cập nhật thông tin.'
    } else {
      await api.create(props.endpoint, payload)
      message.value = 'Đã thêm mới thành công.'
    }
    resetForm()
    await loadRows()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function startEdit(row) {
  props.fields.forEach((field) => {
    let value = row[field.key]
    if (value === null || value === undefined) value = defaultFor(field)
    if (field.type === 'date' && value) value = String(value).slice(0, 10)
    if (field.type === 'datetime-local' && value) value = String(value).slice(0, 16)
    form[field.key] = value
  })
  editingId.value = row.id
  message.value = ''
  error.value = ''
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function removeRow(row) {
  const confirmed = window.confirm(`Xóa mục "${row.id}"? Hành động này không thể hoàn tác.`)
  if (!confirmed) return
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await api.remove(props.endpoint, row.id)
    message.value = 'Đã xóa thành công.'
    if (editingId.value === row.id) resetForm()
    await loadRows()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function optionsFor(field) {
  if (field.optionsFrom) return lookups[field.key] || []
  return field.options || []
}

function isSelect(field) {
  return Boolean(field.optionsFrom) || (Array.isArray(field.options) && field.options.length > 0)
}

function display(row, column) {
  const value = row[column.key]
  if (value === null || value === undefined || value === '') return '--'
  if (column.type === 'date') return new Date(value).toLocaleDateString('vi-VN')
  if (column.type === 'datetime') return new Date(value).toLocaleString('vi-VN')
  if (column.lookup && lookups[column.lookup]) {
    const match = lookups[column.lookup].find((item) => item.id === value)
    if (match) return `${match.name} (${value})`
  }
  return value
}

onMounted(async () => {
  await loadLookups()
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
          <h3>{{ editingId ? `Chỉnh sửa ${editingId}` : formTitle }}</h3>
          <p>{{ formDescription }}</p>
        </div>
      </div>
      <div class="form-grid three">
        <label v-for="field in fields" :key="field.key">
          {{ field.label }}
          <select v-if="isSelect(field)" v-model="form[field.key]">
            <option v-for="opt in optionsFor(field)" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
          </select>
          <input
            v-else
            v-model="form[field.key]"
            :type="field.type || 'text'"
            :placeholder="field.placeholder || field.label"
          />
        </label>
      </div>
      <p v-if="error" class="login-error">{{ error }}</p>
      <p v-if="message" class="login-success">{{ message }}</p>
      <div class="form-actions">
        <button class="btn primary" type="submit" :disabled="loading">{{ editingId ? 'Cập nhật' : 'Lưu thông tin' }}</button>
        <button class="btn ghost" type="button" :disabled="loading" @click="resetForm">{{ editingId ? 'Hủy chỉnh sửa' : 'Làm mới' }}</button>
      </div>
    </form>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Danh sách</h3>
          <p>Tổng hợp dữ liệu hiện tại trong hệ thống.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td v-for="column in columns" :key="column.key">{{ display(row, column) }}</td>
              <td>
                <div class="inline-actions">
                  <button class="btn secondary compact" type="button" @click="startEdit(row)">Sửa</button>
                  <button class="btn danger compact" type="button" @click="removeRow(row)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!rows.length && !loading" class="empty-state">{{ emptyText }}</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
    </section>
  </section>
</template>
