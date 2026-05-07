<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'hospitalId', label: 'Mã bệnh viện', default: 'BV001' },
  { key: 'patientId', label: 'Mã bệnh nhân', default: 'BN001' },
  { key: 'bloodGroup', label: 'Nhóm máu', default: 'O+' },
  { key: 'componentType', label: 'Thành phần cần', default: 'Hồng cầu' },
  { key: 'volume', label: 'Số lượng cần ml', type: 'number', default: 250 },
  { key: 'status', label: 'Trạng thái', default: 'Chờ duyệt' },
]

const columns = [
  { key: 'id', label: 'Phiếu' },
  { key: 'requestedAt', label: 'Ngày yêu cầu', type: 'datetime' },
  { key: 'hospitalId', label: 'Bệnh viện' },
  { key: 'patientId', label: 'Bệnh nhân' },
  { key: 'componentType', label: 'Thành phần' },
  { key: 'volume', label: 'Số ml' },
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
