<script setup>
import { computed } from 'vue'
import CrudPage from './CrudPage.vue'
import { api } from '../api'

const currentUser = (() => {
  try {
    return JSON.parse(window.localStorage.getItem('bloodchain.currentUser') || 'null')
  } catch {
    return null
  }
})()

const role = currentUser?.role || ''
const isHospital = role === 'hospital'

const fields = computed(() => [
  { key: 'name', label: 'Họ tên bệnh nhân', placeholder: 'Nguyễn Văn A' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date', default: '1990-01-01' },
  { key: 'bloodGroup', label: 'Nhóm máu', optionsFrom: '/blood-groups', default: 'O+' },
  { key: 'medicalRecord', label: 'Bệnh án', placeholder: 'Tóm tắt bệnh án' },
  isHospital
    ? {
        key: 'hospitalId',
        label: 'Bệnh viện',
        optionsFrom: '/hospitals',
        default: currentUser?.hospitalId || '',
        readOnly: true,
      }
    : { key: 'hospitalId', label: 'Bệnh viện', optionsFrom: '/hospitals' },
])

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'name', label: 'Họ tên' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date' },
  { key: 'bloodGroup', label: 'Nhóm máu' },
  { key: 'medicalRecord', label: 'Bệnh án' },
  { key: 'hospitalId', label: 'Bệnh viện', lookup: 'hospitalId' },
]

// Defence-in-depth: even if a hospital somehow receives rows from other
// tenants (proxy quirk, future API change), filter on the client too.
function filterFn(rows) {
  if (!isHospital || !currentUser?.hospitalId) return rows
  return rows.filter((row) => row.hospitalId === currentUser.hospitalId)
}
</script>

<template>
  <CrudPage
    title="Hồ sơ bệnh nhân"
    description="Lưu thông tin bệnh nhân cần nhận máu."
    form-title="Thông tin bệnh nhân"
    endpoint="/patients"
    :fields="fields"
    :columns="columns"
    :filter-fn="filterFn"
    empty-text="Chưa có hồ sơ bệnh nhân."
  />
</template>
