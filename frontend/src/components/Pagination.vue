<script setup>
// Reusable pagination bar. Renders nothing when everything fits on one page,
// so small tables stay clean and only long ones get controls.
defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['go'])
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="btn ghost compact" type="button" :disabled="page <= 1" @click="emit('go', 1)">«</button>
    <button class="btn ghost compact" type="button" :disabled="page <= 1" @click="emit('go', page - 1)">‹ Trước</button>
    <span class="pagination-info">Trang {{ page }} / {{ totalPages }}<template v-if="total"> ({{ total }} dòng)</template></span>
    <button class="btn ghost compact" type="button" :disabled="page >= totalPages" @click="emit('go', page + 1)">Sau ›</button>
    <button class="btn ghost compact" type="button" :disabled="page >= totalPages" @click="emit('go', totalPages)">»</button>
  </div>
</template>
