<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'donorId', label: 'Mã người hiến', default: 'NH001' },
  { key: 'campaignId', label: 'Mã chiến dịch', default: 'CD001' },
  { key: 'bloodGroup', label: 'Nhóm máu', default: 'O+' },
  { key: 'volume', label: 'Thể tích ml', type: 'number', default: 350 },
  { key: 'staffId', label: 'Nhân viên thu nhận', default: 'NV004' },
  { key: 'testStatus', label: 'Trạng thái kiểm định', default: 'Chờ xét nghiệm' },
]

const columns = [
  { key: 'id', label: 'Mã gói' },
  { key: 'donatedAt', label: 'Ngày hiến', type: 'datetime' },
  { key: 'volume', label: 'Thể tích' },
  { key: 'testStatus', label: 'Kiểm định' },
  { key: 'donorId', label: 'Người hiến' },
  { key: 'bloodGroup', label: 'Nhóm máu' },
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
