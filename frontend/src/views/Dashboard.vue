<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'

const emit = defineEmits(['open-module'])
const inventory = ref([])
const expiring = ref([])
const requests = ref([])
const donors = ref([])

async function loadDashboard() {
  const [inventoryRows, expiringRows, requestRows, donorRows] = await Promise.all([
    api.reports.inventory().catch(() => []),
    api.reports.expiring().catch(() => []),
    api.list('/requests').catch(() => []),
    api.list('/donors').catch(() => []),
  ])
  inventory.value = inventoryRows
  expiring.value = expiringRows
  requests.value = requestRows
  donors.value = donorRows
}

onMounted(loadDashboard)
</script>

<template>
  <section class="page">
    <div class="page-hero">
      <div>
        <p class="eyebrow">BLOODCHAIN</p>
        <h2>T&#7893;ng quan h&#7879; th&#7889;ng</h2>
        <p>Theo d&#245;i nhanh t&#236;nh h&#236;nh ti&#7871;p nh&#7853;n, x&#233;t nghi&#7879;m, kho m&#225;u v&#224; xu&#7845;t kho trong ng&#224;y.</p>
      </div>
      <div class="hero-actions">
        <button class="btn primary" type="button" @click="emit('open-module', 'requests')">T&#7841;o phi&#7871;u nhanh</button>
        <button class="btn ghost" type="button" @click="emit('open-module', 'reports')">Xem b&#225;o c&#225;o</button>
        <button class="btn ghost" type="button" @click="loadDashboard">T&#7843;i l&#7841;i</button>
      </div>
    </div>

    <div class="card-grid">
      <article class="card">
        <p class="card-title">T&#250;i m&#225;u s&#7861;n s&#224;ng</p>
        <p class="metric">{{ inventory.reduce((sum, row) => sum + Number(row.total || 0), 0) }}</p>
        <p class="metric-note">Ch&#7901; c&#7853;p nh&#7853;t t&#7915; kho m&#225;u</p>
      </article>
      <article class="card">
        <p class="card-title">S&#7855;p h&#7871;t h&#7841;n</p>
        <p class="metric">{{ expiring.length }}</p>
        <p class="metric-note">C&#7847;n &#432;u ti&#234;n x&#7917; l&#253;</p>
      </article>
      <article class="card">
        <p class="card-title">Phi&#7871;u ch&#7901; duy&#7879;t</p>
        <p class="metric">{{ requests.filter((item) => String(item.status || '').trim() === 'Chờ duyệt').length }}</p>
        <p class="metric-note">Y&#234;u c&#7847;u &#273;ang ch&#7901; x&#7917; l&#253;</p>
      </article>
      <article class="card">
        <p class="card-title">&#272;&#259;ng k&#253; hi&#7871;n m&#225;u</p>
        <p class="metric">{{ donors.length }}</p>
        <p class="metric-note">H&#7891; s&#417; ch&#7901; x&#225;c nh&#7853;n</p>
      </article>
    </div>

    <div class="card-grid two">
      <section class="table-card">
        <div class="section-title">
          <div>
            <h3>T&#7891;n kho nhanh</h3>
            <p>T&#7893;ng h&#7907;p s&#7889; l&#432;&#7907;ng t&#250;i m&#225;u theo nh&#243;m m&#225;u v&#224; th&#224;nh ph&#7847;n.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nh&#243;m m&#225;u</th>
                <th>H&#7891;ng c&#7847;u</th>
                <th>Huy&#7871;t t&#432;&#417;ng</th>
                <th>Ti&#7875;u c&#7847;u</th>
                <th>Tr&#7841;ng th&#225;i</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in inventory" :key="row.bloodGroup">
                <td>{{ row.bloodGroup }}</td>
                <td>{{ row.redCells }}</td>
                <td>{{ row.plasma }}</td>
                <td>{{ row.platelets }}</td>
                <td>{{ row.total > 0 ? 'Sẵn sàng' : 'Trống' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!inventory.length" class="empty-state">Ch&#432;a c&#243; th&#244;ng tin t&#7891;n kho.</div>
      </section>

      <section class="card">
        <div class="section-title">
          <div>
            <h3>Lu&#7891;ng ch&#237;nh</h3>
            <p>C&#225;c b&#432;&#7899;c nghi&#7879;p v&#7909; t&#7915; ti&#7871;p nh&#7853;n &#273;&#7871;n xu&#7845;t kho.</p>
          </div>
        </div>
        <div class="timeline">
          <article class="timeline-item"><span class="timeline-dot">1</span><div><h4>Ti&#7871;p nh&#7853;n</h4><p>Ghi nh&#7853;n ng&#432;&#7901;i hi&#7871;n, chi&#7871;n d&#7883;ch v&#224; g&#243;i m&#225;u.</p></div></article>
          <article class="timeline-item"><span class="timeline-dot">2</span><div><h4>X&#233;t nghi&#7879;m</h4><p>X&#225;c nh&#7853;n m&#225;u &#273;&#7841;t chu&#7849;n tr&#432;&#7899;c khi &#273;&#432;a v&#224;o kho.</p></div></article>
          <article class="timeline-item"><span class="timeline-dot">3</span><div><h4>Kho m&#225;u</h4><p>T&#225;ch th&#224;nh ph&#7847;n, x&#7871;p v&#7883; tr&#237; v&#224; theo d&#245;i h&#7841;n s&#7917; d&#7909;ng.</p></div></article>
          <article class="timeline-item"><span class="timeline-dot">4</span><div><h4>Xu&#7845;t kho</h4><p>Ki&#7875;m tra ph&#249; h&#7907;p v&#224; l&#7853;p phi&#7871;u xu&#7845;t an to&#224;n.</p></div></article>
        </div>
      </section>
    </div>
  </section>
</template>
