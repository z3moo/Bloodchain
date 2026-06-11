<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'name', label: 'Họ tên', placeholder: 'Nguyễn Văn A' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date', default: '2000-01-01' },
  { key: 'phone', label: 'Số điện thoại', placeholder: '0912345678' },
  { key: 'bloodGroup', label: 'Nhóm máu', optionsFrom: '/blood-groups', default: 'O+' },
  { key: 'gender', label: 'Giới tính', options: [
    { id: 'Nam', name: 'Nam' },
    { id: 'Nữ', name: 'Nữ' },
    { id: 'Khác', name: 'Khác' },
  ], default: 'Khác' },
  { key: 'medicalHistory', label: 'Tiền sử bệnh lý', default: 'Không' },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'name', label: 'Họ tên' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date' },
  { key: 'gender', label: 'Giới tính' },
  { key: 'phone', label: 'SĐT' },
  { key: 'bloodGroup', label: 'Nhóm máu' },
  { key: 'medicalHistory', label: 'Bệnh lý' },
]
</script>

<template>
  <CrudPage
    title="Người hiến máu"
    description="Quản lý hồ sơ người hiến máu của trung tâm."
    form-title="Hồ sơ người hiến"
    endpoint="/donors"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có người hiến."
  />
</template>
