<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'bloodBagId', label: 'Gói máu đạt chuẩn', optionsFrom: '/blood-bags', labelFn: (b) => `${b.id} · ${b.bloodGroup || '?'} · ${b.volume || 0}ml` },
  { key: 'type', label: 'Loại thành phần', options: [
    { id: 'Hồng cầu', name: 'Hồng cầu' },
    { id: 'Huyết tương', name: 'Huyết tương' },
    { id: 'Tiểu cầu', name: 'Tiểu cầu' },
  ], default: 'Hồng cầu' },
  { key: 'volume', label: 'Thể tích thực tế (ml)', type: 'number', default: 250 },
  { key: 'expiresAt', label: 'Hạn sử dụng', type: 'date', placeholder: 'Bỏ trống để hệ thống tự tính' },
  { key: 'storageId', label: 'Vị trí kho', optionsFrom: '/storages' },
  { key: 'status', label: 'Trạng thái', options: [
    { id: 'Sẵn sàng', name: 'Sẵn sàng' },
    { id: 'Đã xuất', name: 'Đã xuất' },
    { id: 'Hết hạn', name: 'Hết hạn' },
  ], default: 'Sẵn sàng' },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'type', label: 'Loại' },
  { key: 'volume', label: 'Thể tích (ml)' },
  { key: 'expiresAt', label: 'Hạn dùng', type: 'date' },
  { key: 'bloodBagId', label: 'Gói máu', lookup: 'bloodBagId', labelFn: (b) => `${b.id} · ${b.bloodGroup || '?'}` },
  { key: 'storageId', label: 'Vị trí', lookup: 'storageId' },
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
    empty-text="Chưa có thành phần máu trong kho."
  />
</template>
