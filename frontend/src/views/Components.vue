<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'bloodBagId', label: 'Gói máu đạt chuẩn', default: 'GM001' },
  { key: 'type', label: 'Loại thành phần', default: 'Hồng cầu' },
  { key: 'volume', label: 'Thể tích thực tế', type: 'number', default: 250 },
  { key: 'expiresAt', label: 'Hạn sử dụng', type: 'date' },
  { key: 'storageId', label: 'Vị trí kho', default: 'VT001' },
  { key: 'status', label: 'Trạng thái', default: 'Sẵn sàng' },
]

const columns = [
  { key: 'id', label: 'Túi máu' },
  { key: 'type', label: 'Loại' },
  { key: 'volume', label: 'Thể tích' },
  { key: 'expiresAt', label: 'Hạn dùng', type: 'date' },
  { key: 'storageId', label: 'Vị trí' },
  { key: 'status', label: 'Trạng thái' },
]
</script>

<template>
  <CrudPage
    title="Kho máu và thành phần máu"
    description="Tách thành phần, xếp kho và theo dõi hạn sử dụng."
    form-title="Tách thành phần và xếp kho"
    endpoint="/components"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có túi máu trong kho."
  />
</template>
