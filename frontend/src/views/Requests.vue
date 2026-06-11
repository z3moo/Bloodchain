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
const isStaff = role === 'admin' || role === 'staff'

const fields = computed(() => [
  isHospital
    ? {
        key: 'hospitalId',
        label: 'Bệnh viện',
        optionsFrom: '/hospitals',
        default: currentUser?.hospitalId || '',
        readOnly: true,
      }
    : { key: 'hospitalId', label: 'Bệnh viện', optionsFrom: '/hospitals' },
  { key: 'patientId', label: 'Bệnh nhân', optionsFrom: '/patients' },
  { key: 'bloodGroup', label: 'Nhóm máu', optionsFrom: '/blood-groups', default: 'O+' },
  { key: 'componentType', label: 'Thành phần cần', options: [
    { id: 'Hồng cầu', name: 'Hồng cầu' },
    { id: 'Huyết tương', name: 'Huyết tương' },
    { id: 'Tiểu cầu', name: 'Tiểu cầu' },
  ], default: 'Hồng cầu' },
  { key: 'volume', label: 'Thể tích cần (ml)', type: 'number', default: 250 },
  isHospital
    ? { key: 'approverId', label: 'Người duyệt', optionsFrom: '/staff', readOnly: true, default: '', hidden: true }
    : { key: 'approverId', label: 'Người duyệt', optionsFrom: '/staff' },
  isHospital
    ? {
        key: 'status',
        label: 'Trạng thái',
        options: [{ id: 'Chờ duyệt', name: 'Chờ duyệt' }],
        default: 'Chờ duyệt',
        readOnly: true,
      }
    : {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { id: 'Chờ duyệt', name: 'Chờ duyệt' },
          { id: 'Đã duyệt', name: 'Đã duyệt' },
          { id: 'Từ chối', name: 'Từ chối' },
        ],
        default: 'Chờ duyệt',
      },
])

const columns = [
  { key: 'id', label: 'Phiếu' },
  { key: 'requestedAt', label: 'Ngày yêu cầu', type: 'datetime' },
  { key: 'hospitalId', label: 'Bệnh viện', lookup: 'hospitalId' },
  { key: 'patientId', label: 'Bệnh nhân', lookup: 'patientId' },
  { key: 'componentType', label: 'Thành phần' },
  { key: 'bloodGroup', label: 'Nhóm máu' },
  { key: 'volume', label: 'Thể tích (ml)' },
  { key: 'status', label: 'Trạng thái' },
]

function filterFn(rows) {
  if (!isHospital || !currentUser?.hospitalId) return rows
  return rows.filter((row) => row.hospitalId === currentUser.hospitalId)
}

const customActions = isStaff
  ? [
      {
        label: 'Duyệt',
        variant: 'primary',
        visibleIf: (row) => String(row.status || '').trim() === 'Chờ duyệt',
        onClick: (row) => api.patch('/requests', `${row.id}/approve`, { approve: true }),
      },
      {
        label: 'Từ chối',
        variant: 'ghost',
        visibleIf: (row) => String(row.status || '').trim() === 'Chờ duyệt',
        onClick: (row) => api.patch('/requests', `${row.id}/approve`, { approve: false }),
      },
    ]
  : []
</script>

<template>
  <CrudPage
    title="Phiếu yêu cầu máu"
    description="Tạo và theo dõi yêu cầu máu từ bệnh viện."
    form-title="Tạo phiếu yêu cầu"
    endpoint="/requests"
    :fields="fields"
    :columns="columns"
    :filter-fn="filterFn"
    :custom-actions="customActions"
    empty-text="Chưa có phiếu yêu cầu."
  />
</template>
