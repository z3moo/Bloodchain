<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'requestId', label: 'Phiếu yêu cầu', default: 'YC001' },
  { key: 'componentId', label: 'Túi máu đề xuất', default: 'TP001' },
  { key: 'totalVolume', label: 'Tổng thể tích', type: 'number', default: 250 },
  { key: 'crossMatch', label: 'Phản ứng chéo', default: 'Hòa hợp' },
  { key: 'staffId', label: 'Nhân viên xuất', default: 'NV003' },
]

const columns = [
  { key: 'id', label: 'Phiếu xuất' },
  { key: 'exportedAt', label: 'Ngày xuất', type: 'datetime' },
  { key: 'requestId', label: 'Phiếu yêu cầu' },
  { key: 'componentId', label: 'Túi máu' },
  { key: 'totalVolume', label: 'Thể tích' },
  { key: 'crossMatch', label: 'Phản ứng chéo' },
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
