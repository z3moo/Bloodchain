<script setup>
import { onMounted, ref, computed } from 'vue'
import { Droplet, FlaskConical, Boxes, Truck } from 'lucide-vue-next'
import { api } from '../api'

const emit = defineEmits(['open-module'])
const inventory = ref([])
const expiring = ref([])
const requests = ref([])
const donors = ref([])
const intake = ref([])

async function loadDashboard() {
  const [inventoryRows, expiringRows, requestRows, donorRows, intakeRows] = await Promise.all([
    api.reports.inventory().catch(() => []),
    api.reports.expiring().catch(() => []),
    api.list('/requests').catch(() => []),
    api.list('/donors').catch(() => []),
    api.reports.intakeByDay(14).catch(() => []),
  ])
  inventory.value = inventoryRows
  expiring.value = expiringRows
  requests.value = requestRows
  donors.value = donorRows
  intake.value = intakeRows
}

onMounted(loadDashboard)

/* ---------- Biểu đồ tròn: nhóm máu trong kho (%) ---------- */
// Bảng màu cố định cho từng nhóm máu (tương phản tốt, không trùng nhau).
const GROUP_COLORS = {
  'A+': '#b70328', 'A-': '#e85d75',
  'B+': '#0369a1', 'B-': '#38bdf8',
  'AB+': '#b45309', 'AB-': '#f59e0b',
  'O+': '#15803d', 'O-': '#4ade80',
}
const FALLBACK_COLORS = ['#7c3aed', '#0891b2', '#db2777', '#65a30d', '#475569']

const PIE = { cx: 110, cy: 110, r: 96 }
const hoverGroup = ref(null)

function polarToCartesian(angleDeg, radius) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: PIE.cx + radius * Math.cos(a), y: PIE.cy + radius * Math.sin(a) }
}
function arcPath(startAngle, endAngle, radius) {
  const start = polarToCartesian(endAngle, radius)
  const end = polarToCartesian(startAngle, radius)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${PIE.cx} ${PIE.cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

const pieSlices = computed(() => {
  const rows = inventory.value
    .map((row) => ({ group: row.bloodGroup, value: Number(row.total || 0) }))
    .filter((row) => row.value > 0)
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  if (!total) return []
  let cursor = 0
  return rows.map((row, index) => {
    const startAngle = (cursor / total) * 360
    cursor += row.value
    const endAngle = (cursor / total) * 360
    const pct = Math.round((row.value / total) * 100)
    const mid = polarToCartesian((startAngle + endAngle) / 2, PIE.r * 0.62)
    return {
      group: row.group,
      value: row.value,
      pct,
      color: GROUP_COLORS[row.group] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      // Trường hợp 1 nhóm chiếm 100% thì vẽ hình tròn đầy thay vì cung tròn.
      isFull: endAngle - startAngle >= 359.999,
      path: arcPath(startAngle, endAngle, PIE.r),
      labelX: mid.x,
      labelY: mid.y,
    }
  })
})

/* ---------- Biểu đồ cột: số túi máu tiếp nhận theo ngày ---------- */
// height = vị trí đường nền (baseline). topPad chừa chỗ cho nhãn số trên đỉnh
// cột cao nhất, nếu không cột max sẽ chạm y=0 và nhãn bị cắt khỏi khung.
const BAR = { height: 170, gap: 14, barWidth: 26, padLeft: 8, topPad: 20 }

const barRows = computed(() => {
  const rows = intake.value.map((row) => ({
    day: row.day,
    bags: Number(row.bags || 0),
    volume: Number(row.volume || 0),
  }))
  const max = rows.reduce((m, row) => Math.max(m, row.bags), 0) || 1
  const step = BAR.barWidth + BAR.gap
  const plotHeight = BAR.height - BAR.topPad
  return rows.map((row, index) => {
    const h = Math.round((row.bags / max) * plotHeight)
    const [, mm, dd] = (row.day || '').split('-')
    return {
      ...row,
      label: dd && mm ? `${dd}/${mm}` : row.day,
      x: BAR.padLeft + index * step,
      y: BAR.height - h,
      h,
    }
  })
})
const barWidthTotal = computed(() =>
  Math.max(360, BAR.padLeft * 2 + barRows.value.length * (BAR.barWidth + BAR.gap)),
)
const barMax = computed(() => barRows.value.reduce((m, row) => Math.max(m, row.bags), 0))
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
      <section class="card chart-card">
        <div class="section-title">
          <div>
            <h3>Nh&#243;m m&#225;u trong kho</h3>
            <p>T&#7927; l&#7879; t&#250;i m&#225;u s&#7861;n s&#224;ng theo nh&#243;m. Di chu&#7897;t v&#224;o t&#7915;ng ph&#7847;n &#273;&#7875; xem chi ti&#7871;t.</p>
          </div>
        </div>

        <div v-if="pieSlices.length" class="pie-wrap">
          <svg class="pie-svg" viewBox="0 0 220 220" role="img" aria-label="Bi&#7875;u &#273;&#7891; tr&#242;n nh&#243;m m&#225;u trong kho">
            <g v-for="slice in pieSlices" :key="slice.group"
               class="pie-slice"
               :class="{ dim: hoverGroup && hoverGroup !== slice.group }"
               @mouseenter="hoverGroup = slice.group"
               @mouseleave="hoverGroup = null">
              <circle v-if="slice.isFull" :cx="PIE.cx" :cy="PIE.cy" :r="PIE.r" :fill="slice.color" />
              <path v-else :d="slice.path" :fill="slice.color" stroke="#fff" stroke-width="1.5" />
              <text v-if="slice.pct >= 8" :x="slice.labelX" :y="slice.labelY"
                    class="pie-pct" text-anchor="middle" dominant-baseline="central">{{ slice.pct }}%</text>
              <title>{{ slice.group }} — {{ slice.value }} túi ({{ slice.pct }}%)</title>
            </g>
          </svg>

          <ul class="pie-legend">
            <li v-for="slice in pieSlices" :key="slice.group"
                :class="{ active: hoverGroup === slice.group }"
                @mouseenter="hoverGroup = slice.group"
                @mouseleave="hoverGroup = null">
              <span class="legend-swatch" :style="{ background: slice.color }" aria-hidden="true"></span>
              <span class="legend-label">{{ slice.group }}</span>
              <span class="legend-value">{{ slice.value }} t&#250;i &#183; {{ slice.pct }}%</span>
            </li>
          </ul>
        </div>
        <div v-else class="empty-state">Ch&#432;a c&#243; t&#250;i m&#225;u s&#7861;n s&#224;ng trong kho.</div>
      </section>

      <section class="card chart-card">
        <div class="section-title">
          <div>
            <h3>L&#432;&#7907;ng m&#225;u nh&#7853;p theo ng&#224;y</h3>
            <p>S&#7889; t&#250;i m&#225;u ti&#7871;p nh&#7853;n trong 14 ng&#224;y g&#7847;n nh&#7845;t.</p>
          </div>
        </div>

        <div v-if="barRows.length" class="bar-wrap">
          <svg class="bar-svg" :viewBox="`0 0 ${barWidthTotal} 210`" role="img"
               aria-label="Bi&#7875;u &#273;&#7891; c&#7897;t s&#7889; t&#250;i m&#225;u nh&#7853;p theo ng&#224;y">
            <line x1="0" :y1="BAR.height" :x2="barWidthTotal" :y2="BAR.height" class="bar-axis" />
            <g v-for="bar in barRows" :key="bar.day">
              <rect class="bar-rect" :x="bar.x" :y="bar.y" :width="BAR.barWidth" :height="bar.h" rx="4">
                <title>{{ bar.label }} — {{ bar.bags }} túi ({{ bar.volume }} ml)</title>
              </rect>
              <text v-if="bar.bags > 0" :x="bar.x + BAR.barWidth / 2" :y="bar.y - 5"
                    class="bar-value" text-anchor="middle">{{ bar.bags }}</text>
              <text :x="bar.x + BAR.barWidth / 2" :y="BAR.height + 16"
                    class="bar-label" text-anchor="middle">{{ bar.label }}</text>
            </g>
          </svg>
          <p class="bar-note" v-if="barMax === 0">Ch&#432;a c&#243; t&#250;i m&#225;u n&#224;o &#273;&#432;&#7907;c nh&#7853;p trong kho&#7843;ng th&#7901;i gian n&#224;y.</p>
        </div>
        <div v-else class="empty-state">Ch&#432;a c&#243; d&#7919; li&#7879;u ti&#7871;p nh&#7853;n.</div>
      </section>
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
          <article class="timeline-item"><span class="timeline-dot step-receive"><Droplet :size="18" :stroke-width="2.2" aria-hidden="true" /></span><div><h4>Ti&#7871;p nh&#7853;n</h4><p>Ghi nh&#7853;n ng&#432;&#7901;i hi&#7871;n, chi&#7871;n d&#7883;ch v&#224; g&#243;i m&#225;u.</p></div></article>
          <article class="timeline-item"><span class="timeline-dot step-test"><FlaskConical :size="18" :stroke-width="2.2" aria-hidden="true" /></span><div><h4>X&#233;t nghi&#7879;m</h4><p>X&#225;c nh&#7853;n m&#225;u &#273;&#7841;t chu&#7849;n tr&#432;&#7899;c khi &#273;&#432;a v&#224;o kho.</p></div></article>
          <article class="timeline-item"><span class="timeline-dot step-store"><Boxes :size="18" :stroke-width="2.2" aria-hidden="true" /></span><div><h4>Kho m&#225;u</h4><p>T&#225;ch th&#224;nh ph&#7847;n, x&#7871;p v&#7883; tr&#237; v&#224; theo d&#245;i h&#7841;n s&#7917; d&#7909;ng.</p></div></article>
          <article class="timeline-item"><span class="timeline-dot step-export"><Truck :size="18" :stroke-width="2.2" aria-hidden="true" /></span><div><h4>Xu&#7845;t kho</h4><p>Ki&#7875;m tra ph&#249; h&#7907;p v&#224; l&#7853;p phi&#7871;u xu&#7845;t an to&#224;n.</p></div></article>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.chart-card { padding: 1.25rem; }
.pie-wrap { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 1.25rem; align-items: center; }
.pie-svg { width: 220px; height: 220px; }
.pie-slice { cursor: pointer; transition: opacity 0.18s ease; }
.pie-slice path, .pie-slice circle { transition: transform 0.18s ease; transform-origin: 110px 110px; }
.pie-slice:hover path, .pie-slice:hover circle { transform: scale(1.04); }
.pie-slice.dim { opacity: 0.35; }
.pie-pct { fill: #fff; font-size: 0.78rem; font-weight: 700; pointer-events: none; }
.pie-legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
.pie-legend li { display: flex; align-items: center; gap: 0.55rem; padding: 0.3rem 0.45rem; border-radius: var(--radius-sm); cursor: default; transition: background 0.15s ease; }
.pie-legend li.active { background: var(--primary-tint); }
.legend-swatch { width: 0.85rem; height: 0.85rem; border-radius: 4px; flex: 0 0 auto; }
.legend-label { font-weight: 700; color: var(--text); min-width: 2.4rem; }
.legend-value { color: var(--muted); font-size: 0.88rem; font-variant-numeric: tabular-nums; }

.bar-wrap { overflow-x: auto; }
.bar-svg { width: 100%; min-width: 360px; height: auto; }
.bar-axis { stroke: var(--border-strong); stroke-width: 1; }
.bar-rect { fill: var(--primary); transition: fill 0.15s ease; }
.bar-rect:hover { fill: var(--primary-strong); }
.bar-value { fill: var(--primary-strong); font-size: 0.72rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.bar-label { fill: var(--muted); font-size: 0.68rem; }
.bar-note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.88rem; }

@media (max-width: 560px) {
  .pie-wrap { grid-template-columns: 1fr; justify-items: center; }
}
</style>
