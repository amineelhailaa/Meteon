import { computed, ref, watch } from 'vue'
import { weatherApi } from '@/services/weatherApi'

/**
 * Live city search based on WeatherAPI search endpoint.
 * Docs: https://www.weatherapi.com/docs/
 */
export function useCitySearch(options = {}) {
  const { minChars = 2, debounceMs = 180, limit = 8 } = options

  const query = ref('')
  const results = ref([])
  const isLoading = ref(false)
  const error = ref('')

  const trimmedQuery = computed(() => query.value.trim())
  const canSearch = computed(() => trimmedQuery.value.length >= minChars)

  let debounceHandle
  let abortController
  let skipNextSearch = false

  async function runSearch() {
    error.value = ''

    if (!canSearch.value) {
      results.value = []
      isLoading.value = false
      return
    }

    // Cancel previous request (Axios supports AbortController via signal)
    if (abortController) abortController.abort()
    abortController = new AbortController()

    isLoading.value = true

    try {
      const { data } = await weatherApi.get('/search.json', {
        params: {
          q: trimmedQuery.value,
        },
        signal: abortController.signal,
      })

      const arr = Array.isArray(data) ? data : []
      results.value = arr.slice(0, limit)
    } catch (e) {
      // Ignore abort errors
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return
      results.value = []
      error.value = 'Unable to load suggestions.'
    } finally {
      isLoading.value = false
    }
  }

  watch(
    trimmedQuery,
    () => {
      clearTimeout(debounceHandle)
      if (skipNextSearch) {
        skipNextSearch = false
        results.value = []
        isLoading.value = false
        error.value = ''
        return
      }

      if (!canSearch.value) {
        results.value = []
        isLoading.value = false
        error.value = ''
        return
      }
      debounceHandle = setTimeout(runSearch, debounceMs)
    },
    { immediate: false },
  )

  function setQuery(value, options = {}) {
    skipNextSearch = !!options.skipSearch
    query.value = value
  }

  function clearResults() {
    clearTimeout(debounceHandle)
    if (abortController) abortController.abort()
    results.value = []
    isLoading.value = false
    error.value = ''
  }

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearResults,
  }
}
