<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'name', label: 'Tên chiến dịch', placeholder: 'Ngày hội hiến máu' },
  { key: 'location', label: 'Địa điểm', placeholder: 'Hà Nội' },
  { key: 'time', label: 'Thời gian', type: 'datetime-local' },
  { key: 'expected', label: 'Số lượng dự kiến', type: 'number', default: 100 },
  { key: 'actual', label: 'Số lượng thực tế', type: 'number', default: 0 },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'name', label: 'Tên chiến dịch' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'time', label: 'Thời gian', type: 'datetime' },
  { key: 'expected', label: 'Dự kiến' },
  { key: 'actual', label: 'Thực tế' },
]
</script>

<template>
  <CrudPage
    title="Chiến dịch"
    description="Tạo và theo dõi các đợt tiếp nhận máu."
    form-title="Thông tin chiến dịch"
    endpoint="/campaigns"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có chiến dịch."
  />
</template>
