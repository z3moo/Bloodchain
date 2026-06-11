<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api'

const profile = ref(null)
const bloodGroups = ref([])
const loading = ref(false)
const message = ref('')
const error = ref('')

const form = reactive({
  name: '',
  birthDate: '',
  gender: 'Khác',
  phone: '',
  bloodGroup: 'O+',
  medicalHistory: 'Không',
})

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const [me, groups] = await Promise.all([
      api.me.profile().catch(() => null),
      api.list('/blood-groups').catch(() => []),
    ])
    bloodGroups.value = groups
    profile.value = me
    if (me) {
      form.name = me.name || ''
      form.birthDate = me.birthDate ? String(me.birthDate).slice(0, 10) : ''
      form.gender = me.gender || 'Khác'
      form.phone = me.phone || ''
      form.bloodGroup = me.bloodGroup || 'O+'
      form.medicalHistory = me.medicalHistory || 'Không'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function save() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await api.me.saveProfile(form)
    message.value = 'Đã lưu hồ sơ.'
    await loadProfile()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>Hồ sơ của tôi</h2>
        <p>Thông tin cá nhân của người hiến. Bạn chỉ thấy và chỉnh sửa hồ sơ của chính mình.</p>
      </div>
    </div>

    <form class="form-card" @submit.prevent="save">
      <div class="section-title">
        <div>
          <h3>{{ profile ? `Chỉnh sửa hồ sơ ${profile.id}` : 'Hoàn tất hồ sơ' }}</h3>
          <p>Cập nhật thông tin để trung tâm liên hệ và đối chiếu nhóm máu khi tiếp nhận.</p>
        </div>
      </div>
      <div class="form-grid three">
        <label>
          Họ tên
          <input v-model="form.name" type="text" placeholder="Nguyễn Văn A" />
        </label>
        <label>
          Ngày sinh
          <input v-model="form.birthDate" type="date" />
        </label>
        <label>
          Giới tính
          <select v-model="form.gender">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </label>
        <label>
          Số điện thoại
          <input v-model="form.phone" type="text" placeholder="0912345678" />
        </label>
        <label>
          Nhóm máu
          <select v-model="form.bloodGroup">
            <option v-for="g in bloodGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </label>
        <label>
          Tiền sử bệnh lý
          <input v-model="form.medicalHistory" type="text" placeholder="Không" />
        </label>
      </div>
      <p v-if="error" class="login-error">{{ error }}</p>
      <p v-if="message" class="login-success">{{ message }}</p>
      <div class="form-actions">
        <button class="btn primary" type="submit" :disabled="loading">Lưu hồ sơ</button>
      </div>
    </form>

    <section v-if="profile" class="card">
      <div class="section-title">
        <div>
          <h3>Tóm tắt nhanh</h3>
          <p>Thông tin tổng quan của tài khoản người hiến.</p>
        </div>
      </div>
      <div class="card-grid">
        <article class="card">
          <p class="card-title">Mã người hiến</p>
          <p class="metric">{{ profile.id }}</p>
        </article>
        <article class="card">
          <p class="card-title">Nhóm máu</p>
          <p class="metric">{{ profile.bloodGroup || '--' }}</p>
        </article>
        <article class="card">
          <p class="card-title">Điểm tích lũy</p>
          <p class="metric">{{ profile.points ?? 0 }}</p>
        </article>
        <article class="card">
          <p class="card-title">Hạng thành viên</p>
          <p class="metric">{{ profile.memberRank || '--' }}</p>
        </article>
      </div>
    </section>
  </section>
</template>
