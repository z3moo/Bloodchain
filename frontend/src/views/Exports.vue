<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'requestId', label: 'Phiếu yêu cầu', optionsFrom: '/requests', labelFn: (r) => `${r.id} · ${r.componentType || '?'} · ${r.volume || 0}ml` },
  { key: 'componentId', label: 'Thành phần xuất', optionsFrom: '/components', labelFn: (c) => `${c.id} · ${c.type || '?'}` },
  { key: 'totalVolume', label: 'Tổng thể tích (ml)', type: 'number', default: 250 },
  { key: 'crossMatch', label: 'Phản ứng chéo', options: [
    { id: 'Hòa hợp', name: 'Hòa hợp' },
    { id: 'Không hòa hợp', name: 'Không hòa hợp' },
  ], default: 'Hòa hợp' },
  { key: 'staffId', label: 'Nhân viên xuất', optionsFrom: '/staff' },
]

const columns = [
  { key: 'id', label: 'Phiếu xuất' },
  { key: 'exportedAt', label: 'Ngày xuất', type: 'datetime' },
  { key: 'requestId', label: 'Phiếu yêu cầu' },
  { key: 'componentId', label: 'Thành phần' },
  { key: 'totalVolume', label: 'Thể tích (ml)' },
  { key: 'crossMatch', label: 'Phản ứng chéo' },
  { key: 'staffId', label: 'Nhân viên', lookup: 'staffId' },
]
</script>

<template>
  <CrudPage
    title="Xuất kho FIFO"
    description="Lập phiếu xuất kho và ghi nhận phản ứng chéo."
    form-title="Lập phiếu xuất kho"
    endpoint="/exports"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có phiếu xuất kho."
  />
</template>
