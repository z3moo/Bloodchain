import { computed, ref, watch } from 'vue'

// Shared client-side pagination. Pass a ref/computed array of rows; get back
// the current page slice plus controls. Used by every table view so large
// datasets (donors, components, lab tests, expiring bags...) don't render
// thousands of <tr> at once and freeze the UI.
export function usePagination(source, pageSize = 25) {
  const page = ref(1)
  const size = ref(pageSize)

  const total = computed(() => (source.value ? source.value.length : 0))
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))

  const paged = computed(() => {
    const start = (page.value - 1) * size.value
    return (source.value || []).slice(start, start + size.value)
  })

  function goToPage(target) {
    page.value = Math.min(Math.max(1, target), totalPages.value)
  }

  // Reset to first page when the dataset changes size (reload, search filter,
  // delete). Clamp so we never sit on a now-empty page.
  watch(total, () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  })

  return { page, pageSize: size, total, totalPages, paged, goToPage }
}
