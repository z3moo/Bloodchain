<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'bloodBagId', label: 'Mã gói máu', default: 'GM001' },
  { key: 'type', label: 'Loại xét nghiệm', default: 'HIV' },
  { key: 'result', label: 'Kết quả', default: 'Âm tính' },
  { key: 'testedAt', label: 'Ngày xét nghiệm', type: 'datetime-local' },
  { key: 'staffId', label: 'Người thực hiện', default: 'NV002' },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'bloodBagId', label: 'Gói máu' },
  { key: 'type', label: 'Loại' },
  { key: 'result', label: 'Kết quả' },
  { key: 'testedAt', label: 'Ngày xét nghiệm', type: 'datetime' },
  { key: 'staffId', label: 'Nhân viên' },
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
