<script setup>
import CrudPage from './CrudPage.vue'

const fields = [
  { key: 'name', label: 'Họ tên', placeholder: 'Nguyễn Văn A' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date', default: '2000-01-01' },
  { key: 'phone', label: 'Số điện thoại', placeholder: '0912345678' },
  { key: 'bloodGroup', label: 'Nhóm máu', default: 'O+' },
  { key: 'gender', label: 'Giới tính', default: 'Khác' },
  { key: 'medicalHistory', label: 'Tiền sử bệnh lý', default: 'Không' },
]

const columns = [
  { key: 'id', label: 'Mã' },
  { key: 'name', label: 'Họ tên' },
  { key: 'birthDate', label: 'Ngày sinh', type: 'date' },
  { key: 'phone', label: 'SĐT' },
  { key: 'bloodGroup', label: 'Nhóm máu' },
  { key: 'medicalHistory', label: 'Bệnh lý' },
]
</script>

<template>
  <CrudPage
    title="Đăng ký hiến máu"
    description="Ghi nhận người hiến mới và thông tin sức khỏe ban đầu."
    form-title="Phiếu đăng ký hiến máu"
    endpoint="/donors"
    :fields="fields"
    :columns="columns"
    empty-text="Chưa có người hiến."
  />
</template>
