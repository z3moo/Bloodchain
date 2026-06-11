<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'bloodBagId', label: 'Gói máu', optionsFrom: '/blood-bags' },
  { key: 'type', label: 'Loại xét nghiệm', options: [
    { id: 'HIV', name: 'HIV' },
    { id: 'Viêm gan B', name: 'Viêm gan B' },
    { id: 'Viêm gan C', name: 'Viêm gan C' },
    { id: 'Giang mai', name: 'Giang mai' },
    { id: 'Sốt rét', name: 'Sốt rét' },
  ], default: 'HIV' },
  { key: 'result', label: 'Kết quả', options: [
    { id: 'Âm tính', name: 'Âm tính' },
    { id: 'Dương tính', name: 'Dương tính' },
  ], default: 'Âm tính' },
  { key: 'testedAt', label: 'Ngày xét nghiệm', type: 'datetime-local' },
  { key: 'staffId', label: 'Người thực hiện', optionsFrom: '/staff' },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'bloodBagId', label: 'Gói máu', lookup: 'bloodBagId' },
  { key: 'type', label: 'Loại' },
  { key: 'result', label: 'Kết quả' },
  { key: 'testedAt', label: 'Ngày xét nghiệm', type: 'datetime' },
  { key: 'staffId', label: 'Nhân viên', lookup: 'staffId' },
]
</script>

<template>
  <CrudPage
    title="Xét nghiệm"
    description="Lưu kết quả xét nghiệm cho từng gói máu."
    form-title="Kết quả xét nghiệm"
    endpoint="/lab-tests"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có kết quả xét nghiệm."
  />
</template>
