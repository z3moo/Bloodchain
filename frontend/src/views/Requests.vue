<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'hospitalId', label: 'Bệnh viện', optionsFrom: '/hospitals' },
  { key: 'patientId', label: 'Bệnh nhân', optionsFrom: '/patients' },
  { key: 'bloodGroup', label: 'Nhóm máu', optionsFrom: '/blood-groups', default: 'O+' },
  { key: 'componentType', label: 'Thành phần cần', options: [
    { id: 'Hồng cầu', name: 'Hồng cầu' },
    { id: 'Huyết tương', name: 'Huyết tương' },
    { id: 'Tiểu cầu', name: 'Tiểu cầu' },
  ], default: 'Hồng cầu' },
  { key: 'volume', label: 'Thể tích cần (ml)', type: 'number', default: 250 },
  { key: 'approverId', label: 'Người duyệt', optionsFrom: '/staff' },
  { key: 'status', label: 'Trạng thái', options: [
    { id: 'Chờ duyệt', name: 'Chờ duyệt' },
    { id: 'Đã duyệt', name: 'Đã duyệt' },
    { id: 'Từ chối', name: 'Từ chối' },
  ], default: 'Chờ duyệt' },
]

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
</script>

<template>
  <CrudPage
    title="Phiếu yêu cầu máu"
    description="Tạo và theo dõi yêu cầu máu từ bệnh viện."
    form-title="Tạo phiếu yêu cầu"
    endpoint="/requests"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có phiếu yêu cầu."
  />
</template>
