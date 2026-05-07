<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'name', label: 'Họ tên bệnh nhân', placeholder: 'Nguyễn Văn A' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date', default: '1990-01-01' },
  { key: 'bloodGroup', label: 'Nhóm máu', default: 'O+' },
  { key: 'medicalRecord', label: 'Bệnh án', placeholder: 'Tóm tắt bệnh án' },
  { key: 'hospitalId', label: 'Mã bệnh viện', default: 'BV001' },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'name', label: 'Họ tên' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date' },
  { key: 'bloodGroup', label: 'Nhóm máu' },
  { key: 'medicalRecord', label: 'Bệnh án' },
  { key: 'hospitalId', label: 'Bệnh viện' },
]
</script>

<template>
  <CrudPage
    title="Hồ sơ bệnh nhân"
    description="Lưu thông tin bệnh nhân cần nhận máu."
    form-title="Thông tin bệnh nhân"
    endpoint="/patients"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có hồ sơ bệnh nhân."
  />
</template>
