<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'name', label: 'Tên bệnh viện', placeholder: 'Bệnh viện mới' },
  { key: 'address', label: 'Địa chỉ', placeholder: 'Hà Nội' },
  { key: 'phone', label: 'Số điện thoại', placeholder: '024...' },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'name', label: 'Tên' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'phone', label: 'SĐT' },
]
</script>

<template>
  <CrudPage
    title="Bệnh viện đối tác"
    description="Quản lý thông tin bệnh viện liên kết."
    form-title="Thông tin bệnh viện"
    endpoint="/hospitals"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có bệnh viện đối tác."
  />
</template>
