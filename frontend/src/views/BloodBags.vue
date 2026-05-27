<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'donorId', label: 'Người hiến', optionsFrom: '/donors' },
  { key: 'campaignId', label: 'Chiến dịch', optionsFrom: '/campaigns' },
  { key: 'bloodGroup', label: 'Nhóm máu', optionsFrom: '/blood-groups', default: 'O+' },
  { key: 'volume', label: 'Thể tích (ml)', type: 'number', default: 350 },
  { key: 'staffId', label: 'Nhân viên thu nhận', optionsFrom: '/staff' },
  { key: 'testStatus', label: 'Trạng thái kiểm định', options: [
    { id: 'Chờ xét nghiệm', name: 'Chờ xét nghiệm' },
    { id: 'Đạt', name: 'Đạt' },
    { id: 'Không đạt', name: 'Không đạt' },
  ], default: 'Chờ xét nghiệm' },
]

const columns = [
  { key: 'id', label: 'Mã gói' },
  { key: 'donatedAt', label: 'Ngày hiến', type: 'datetime' },
  { key: 'volume', label: 'Thể tích (ml)' },
  { key: 'testStatus', label: 'Kiểm định' },
  { key: 'donorId', label: 'Người hiến', lookup: 'donorId' },
  { key: 'bloodGroup', label: 'Nhóm máu' },
  { key: 'campaignId', label: 'Chiến dịch', lookup: 'campaignId' },
  { key: 'staffId', label: 'Nhân viên', lookup: 'staffId' },
]
</script>

<template>
  <CrudPage
    title="Gói máu"
    description="Tạo đơn rút máu và lưu gói máu toàn phần."
    form-title="Phiếu tiếp nhận gói máu"
    endpoint="/blood-bags"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có gói máu."
  />
</template>
