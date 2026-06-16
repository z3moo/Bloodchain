<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../api'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  formTitle: { type: String, required: true },
  formDescription: { type: String, default: 'Nhập thông tin rồi bấm lưu để cập nhật dữ liệu.' },
  endpoint: { type: String, required: true },
  fields: { type: Array, required: true },
  columns: { type: Array, required: true },
  emptyText: { type: String, default: 'Chưa có dữ liệu.' },
  canCreate: { type: Boolean, default: true },
  canEdit: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: true },
  // Optional client-side row filter, e.g. for tenant scoping when the
  // backend hasn't been wired up yet for a given role.
  filterFn: { type: Function, default: null },
  // Extra per-row buttons. Each item: { label, variant?, visibleIf?(row), onClick(row, ctx) }.
  // ctx = { reload, startEdit, message: setMessage, error: setError }.
  customActions: { type: Array, default: () => [] },
  showRefresh: { type: Boolean, default: true },
  // Rows shown per page. The table paginates client-side to avoid rendering
  // thousands of rows at once (e.g. ~4600 components) which freezes the UI.
  pageSize: { type: Number, default: 25 },
})

const rows = ref([])
const loading = ref(false)
const message = ref('')
const error = ref('')
const editingId = ref(null)
const search = ref('')
// Per-column filter terms, keyed by column.key. AND-combined with each other
// and with the global search. Lets users narrow by a specific field (e.g. only
// blood group "A+") instead of one catch-all box.
const columnFilters = reactive({})
const showColumnFilters = ref(false)
const form = reactive({})
const lookups = reactive({})

const showActionsCol = computed(() => props.canEdit || props.canDelete || props.customActions.length > 0)

const hasActiveColumnFilter = computed(() =>
  props.columns.some((column) => String(columnFilters[column.key] || '').trim() !== ''),
)

// Per-tab filtering: a row passes when it matches the global search (against any
// visible column) AND every active per-column filter (against that column's
// rendered text). Case-insensitive, accent-sensitive. Uses display() so lookups,
// dates and ids all match what the user actually sees.
const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase()
  const active = props.columns
    .map((column) => [column, String(columnFilters[column.key] || '').trim().toLowerCase()])
    .filter(([, value]) => value !== '')
  if (!term && !active.length) return rows.value
  return rows.value.filter((row) => {
    if (term && !props.columns.some((column) => String(display(row, column)).toLowerCase().includes(term))) {
      return false
    }
    return active.every(([column, value]) => String(display(row, column)).toLowerCase().includes(value))
  })
})

function clearFilters() {
  search.value = ''
  props.columns.forEach((column) => { columnFilters[column.key] = '' })
}

// Client-side pagination: only the current page's rows are rendered, so big
// tables (e.g. ~4600 components) don't freeze the UI. Paginate the filtered set
// so search + column filters narrow the pages too.
const { page, totalPages, total, paged: pagedRows, goToPage } = usePagination(filteredRows, props.pageSize)

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
    const data = await api.list(props.endpoint)
    rows.value = props.filterFn ? props.filterFn(data) : data
    page.value = 1
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Manual refresh: re-pull lookups + rows so cross-page changes (e.g. a blood
// bag logged elsewhere bumping a campaign's actual count) show without a
// full navigation away and back.
async function refresh() {
  await loadLookups()
  await loadRows()
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
  if (!props.canEdit) return
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
  if (!props.canDelete) return
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

async function runCustomAction(action, row) {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await action.onClick(row, {
      reload: loadRows,
      startEdit,
      setMessage: (m) => { message.value = m },
      setError: (e) => { error.value = e },
    })
    await loadRows()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function isCustomActionVisible(action, row) {
  return typeof action.visibleIf === 'function' ? action.visibleIf(row) : true
}

function optionsFor(field) {
  if (field.optionsFrom) return lookups[field.key] || []
  return field.options || []
}

// Option/label text. Some lookup endpoints (e.g. /blood-bags, /components,
// /requests) don't return a `name`, so we fall back to a per-field labelFn,
// then labelKey, then the id — never the literal string "undefined".
function optionLabel(field, opt) {
  if (field.labelFn) return field.labelFn(opt)
  return opt[field.labelKey || 'name'] ?? opt.id
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
    if (match) {
      if (column.labelFn) return column.labelFn(match)
      const label = match[column.labelKey || 'name']
      // If the matched row has no usable label, show the raw id instead of
      // rendering "undefined (id)".
      return label == null ? value : `${label} (${value})`
    }
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

    <form v-if="canCreate || editingId" class="form-card" @submit.prevent="save">
      <div class="section-title">
        <div>
          <h3>{{ editingId ? `Chỉnh sửa ${editingId}` : formTitle }}</h3>
          <p>{{ formDescription }}</p>
        </div>
      </div>
      <div class="form-grid three">
        <label v-for="field in fields" :key="field.key" v-show="!field.hidden">
          {{ field.label }}
          <select
            v-if="isSelect(field)"
            v-model="form[field.key]"
            :disabled="field.readOnly"
          >
            <option v-for="opt in optionsFor(field)" :key="opt.id" :value="opt.id">{{ optionLabel(field, opt) }}</option>
          </select>
          <input
            v-else
            v-model="form[field.key]"
            :type="field.type || 'text'"
            :placeholder="field.placeholder || field.label"
            :readonly="field.readOnly"
            :disabled="field.readOnly"
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

    <p v-if="!canCreate && !editingId && error" class="login-error">{{ error }}</p>
    <p v-if="!canCreate && !editingId && message" class="login-success">{{ message }}</p>

    <section class="table-card">
      <div class="section-title">
        <div>
          <h3>Danh sách</h3>
          <p>Tổng hợp dữ liệu hiện tại trong hệ thống.</p>
        </div>
        <button v-if="showRefresh" class="btn ghost compact" type="button" :disabled="loading" @click="refresh">Tải lại</button>
      </div>
      <div class="filter-bar">
        <input
          v-model="search"
          type="search"
          placeholder="Tìm kiếm nhanh trong bảng..."
          aria-label="Tìm kiếm"
        />
        <button class="btn ghost compact" type="button" @click="showColumnFilters = !showColumnFilters">
          {{ showColumnFilters ? 'Ẩn lọc theo cột' : 'Lọc theo cột' }}
        </button>
        <button
          v-if="search || hasActiveColumnFilter"
          class="btn ghost compact"
          type="button"
          @click="clearFilters"
        >Xóa lọc</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
              <th v-if="showActionsCol">Thao tác</th>
            </tr>
            <tr v-if="showColumnFilters" class="filter-row">
              <th v-for="column in columns" :key="column.key">
                <input
                  v-model="columnFilters[column.key]"
                  type="search"
                  class="column-filter-input"
                  :placeholder="`Lọc ${column.label}`"
                  :aria-label="`Lọc theo ${column.label}`"
                />
              </th>
              <th v-if="showActionsCol"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td v-for="column in columns" :key="column.key">{{ display(row, column) }}</td>
              <td v-if="showActionsCol">
                <div class="inline-actions">
                  <template v-for="action in customActions" :key="action.label">
                    <button
                      v-if="isCustomActionVisible(action, row)"
                      :class="['btn', action.variant || 'secondary', 'compact']"
                      type="button"
                      :disabled="loading"
                      @click="runCustomAction(action, row)"
                    >{{ action.label }}</button>
                  </template>
                  <button v-if="canEdit" class="btn secondary compact" type="button" @click="startEdit(row)">Sửa</button>
                  <button v-if="canDelete" class="btn danger compact" type="button" @click="removeRow(row)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!loading && !rows.length" class="empty-state">{{ emptyText }}</div>
      <div v-else-if="!loading && !filteredRows.length" class="empty-state">Không tìm thấy kết quả phù hợp với "{{ search }}".</div>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>

      <Pagination :page="page" :total-pages="totalPages" :total="total" @go="goToPage" />
    </section>
  </section>
</template>
