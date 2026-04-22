<script setup>
import { computed, nextTick, ref } from 'vue'

import WeatherGlyph from '@/components/weather/WeatherGlyph.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useCitySearch } from '@/composables/useCitySearch'
import { weatherApi } from '@/services/weatherApi'

const quickCities = [
  { label: 'Casablanca', note: 'Atlantic edge' },
  { label: 'Seoul', note: 'Night signal' },
  { label: 'Reykjavik', note: 'Cold horizon' },
  { label: 'Sao Paulo', note: 'Warm current' },
]

const { query, setQuery, results, isLoading, error, clearResults } = useCitySearch({
  minChars: 2,
  debounceMs: 160,
  limit: 8,
})

const activeIndex = ref(-1)
const viewMode = ref('search')
const weekPage = ref(0)
const weatherData = ref(null)
const weatherError = ref('')
const isWeatherLoading = ref(false)

let weatherAbortController

const isOpen = computed(() => results.value.length > 0 || isLoading.value || !!error.value)

const selectedLocation = computed(() => weatherData.value?.location ?? null)
const selectedToday = computed(() => weatherData.value?.forecast?.forecastday?.[0] ?? null)
const selectedCurrent = computed(() => weatherData.value?.current ?? null)

const locationLabel = computed(() => formatLocation(selectedLocation.value))
const locationRegion = computed(() => {
  if (!selectedLocation.value) return 'Choose a city to reveal the forecast.'
  return [selectedLocation.value.region, selectedLocation.value.country].filter(Boolean).join(' • ')
})
const localDateLabel = computed(() => formatLongDate(selectedLocation.value?.localtime))
const localTimeLabel = computed(() => formatTime(selectedLocation.value?.localtime))
const currentCondition = computed(
  () => selectedCurrent.value?.condition?.text ?? 'Weather dashboard',
)
const currentTemp = computed(() => {
  if (!selectedCurrent.value) return '--'
  return Math.round(selectedCurrent.value.temp_c)
})
const currentTempDisplay = computed(() => `${currentTemp.value}°`)
const dayRange = computed(() => {
  if (!selectedToday.value?.day) return 'Waiting for the daily range'
  return `High ${Math.round(selectedToday.value.day.maxtemp_c)}° · Low ${Math.round(selectedToday.value.day.mintemp_c)}°`
})
const feelsLikeDisplay = computed(() => {
  if (!selectedCurrent.value) return '--'
  return `${Math.round(selectedCurrent.value.feelslike_c)}°C`
})
const focusNote = computed(() => buildFocusNote(weatherData.value))
const timezoneLabel = computed(() => {
  if (!selectedLocation.value?.tz_id) return 'Local time'
  return selectedLocation.value.tz_id.split('/').slice(-1)[0].replace(/_/g, ' ')
})

const highlightStats = computed(() => {
  if (!selectedToday.value || !selectedCurrent.value || !selectedLocation.value) return []

  return [
    {
      label: 'Feels like',
      value: feelsLikeDisplay.value,
      icon: 'thermometer',
    },
    {
      label: 'Sunrise',
      value: selectedToday.value.astro?.sunrise ?? '--',
      icon: 'sunrise',
    },
    {
      label: 'Timezone',
      value: timezoneLabel.value,
      icon: 'clock',
    },
  ]
})

const metrics = computed(() => {
  if (!selectedCurrent.value || !selectedToday.value) return []

  return [
    {
      label: 'Humidity',
      value: `${selectedCurrent.value.humidity}%`,
      note: 'Air moisture',
      icon: 'humidity',
    },
    {
      label: 'Wind',
      value: `${Math.round(selectedCurrent.value.wind_kph)} km/h`,
      note: selectedCurrent.value.wind_dir,
      icon: 'wind',
    },
    {
      label: 'Visibility',
      value: `${Math.round(selectedCurrent.value.vis_km)} km`,
      note: 'Sightline',
      icon: 'visibility',
    },
    {
      label: 'Pressure',
      value: `${Math.round(selectedCurrent.value.pressure_mb)} mb`,
      note: 'Sea level',
      icon: 'pressure',
    },
    {
      label: 'Rain chance',
      value: `${selectedToday.value.day.daily_chance_of_rain}%`,
      note: 'Next 24 hours',
      icon: 'spark',
    },
    {
      label: 'Condition',
      value: currentCondition.value,
      note: `UV ${Math.round(selectedToday.value.day.uv)}`,
      icon: 'calendar',
    },
  ]
})

const hourlyPreview = computed(() => {
  const hours = selectedToday.value?.hour ?? []
  if (!hours.length) return []

  const localHour = toLocalDate(selectedLocation.value?.localtime)?.getHours() ?? 0
  const window = hours.slice(localHour, localHour + 6)
  const upcoming = window.length >= 6 ? window : [...window, ...hours.slice(0, 6 - window.length)]

  const temperatures = upcoming.map((item) => item.temp_c)
  const minTemp = Math.min(...temperatures)
  const maxTemp = Math.max(...temperatures)

  return upcoming.map((item, index) => {
    const relativeHeight =
      maxTemp === minTemp ? 62 : 36 + ((item.temp_c - minTemp) / (maxTemp - minTemp)) * 44

    return {
      label: formatHour(item.time, index === 0),
      temperature: `${Math.round(item.temp_c)}°`,
      icon: normalizeIcon(item.condition?.icon),
      condition: item.condition?.text ?? '',
      barHeight: `${relativeHeight}%`,
    }
  })
})

const weekDays = computed(() => {
  return (weatherData.value?.forecast?.forecastday ?? []).map((entry, index) => ({
    key: entry.date_epoch ?? `${entry.date}-${index}`,
    label: index === 0 ? 'Today' : formatShortWeekday(entry.date),
    fullLabel: formatLongWeekday(entry.date),
    shortDate: formatMonthDay(entry.date),
    icon: normalizeIcon(entry.day?.condition?.icon),
    condition: entry.day?.condition?.text ?? '',
    high: `${Math.round(entry.day?.maxtemp_c ?? 0)}°`,
    low: `${Math.round(entry.day?.mintemp_c ?? 0)}°`,
    rain: `${entry.day?.daily_chance_of_rain ?? 0}% rain`,
    wind: `${Math.round(entry.day?.maxwind_kph ?? 0)} km/h`,
    humidity: `${entry.day?.avghumidity ?? 0}% humidity`,
    isToday: index === 0,
  }))
})

const weekPages = computed(() => Math.max(1, Math.ceil(weekDays.value.length / 7)))
const displayedWeekDays = computed(() =>
  weekDays.value.slice(weekPage.value * 7, weekPage.value * 7 + 7),
)
const weekRangeLabel = computed(() => {
  if (!displayedWeekDays.value.length) return 'Weekly forecast'
  const first = displayedWeekDays.value[0]
  const last = displayedWeekDays.value[displayedWeekDays.value.length - 1]
  return `${first.shortDate} - ${last.shortDate}`
})
const canSeeNextWeek = computed(() => weekPage.value < weekPages.value - 1)
const canSeePreviousWeek = computed(() => weekPage.value > 0)
const weekHeading = computed(() => (weekPage.value === 0 ? 'This week' : 'Next week'))

function formatLine(item) {
  const region = item?.region ? `, ${item.region}` : ''
  const country = item?.country ? ` — ${item.country}` : ''
  return `${item?.name ?? ''}${region}${country}`
}

function formatLocation(location) {
  if (!location) return 'No city selected'
  const region = location.region ? `, ${location.region}` : ''
  return `${location.name ?? ''}${region}`
}

function normalizeIcon(iconPath) {
  if (!iconPath) return ''
  return iconPath.replace(/^\/\//, 'https://')
}

function toLocalDate(value) {
  if (!value) return null
  return new Date(value.replace(' ', 'T'))
}

function formatLongDate(value) {
  const localDate = toLocalDate(value)
  if (!localDate) return 'Pick a city to begin'

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(localDate)
}

function formatTime(value) {
  const localDate = toLocalDate(value)
  if (!localDate) return '--:--'

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(localDate)
}

function formatHour(value, isCurrent) {
  if (isCurrent) return 'Now'

  const localDate = toLocalDate(value)
  if (!localDate) return '--'

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
  }).format(localDate)
}

function formatShortWeekday(value) {
  const localDate = toLocalDate(`${value} 12:00`)
  if (!localDate) return '--'

  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(localDate)
}

function formatLongWeekday(value) {
  const localDate = toLocalDate(`${value} 12:00`)
  if (!localDate) return '--'

  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(localDate)
}

function formatMonthDay(value) {
  const localDate = toLocalDate(`${value} 12:00`)
  if (!localDate) return '--'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(localDate)
}

function buildFocusNote(payload) {
  if (!payload?.current || !payload?.forecast?.forecastday?.[0]) {
    return 'Search a city to load live weather, today’s details, and the week ahead.'
  }

  const humidityTone = payload.current.humidity >= 70 ? 'denser air' : 'lighter air'
  const windTone = payload.current.wind_kph >= 24 ? 'active wind' : 'calmer wind'
  const visibility = Math.round(payload.current.vis_km)
  return `${payload.current.condition.text}, with ${humidityTone}, ${windTone}, and visibility around ${visibility} km.`
}

async function move(delta) {
  if (!results.value.length) return
  await nextTick()
  const next = Math.max(0, Math.min(results.value.length - 1, activeIndex.value + delta))
  activeIndex.value = next
}

async function selectSuggestion(item) {
  if (!item) return
  setQuery(formatLine(item), { skipSearch: true })
  clearResults()
  activeIndex.value = -1
  await loadWeather(`${item.lat},${item.lon}`)
}

async function submitSearch() {
  if (activeIndex.value >= 0 && results.value[activeIndex.value]) {
    await selectSuggestion(results.value[activeIndex.value])
    return
  }

  const trimmed = query.value.trim()
  if (!trimmed) {
    weatherError.value = 'Enter a city to load the forecast.'
    return
  }

  await loadWeather(trimmed)
}

function onKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  }

  if (event.key === 'Escape') {
    activeIndex.value = -1
    clearResults()
  }
}

async function loadWeather(target) {
  const targetQuery = target?.trim?.()
  if (!targetQuery) return

  weatherError.value = ''

  if (weatherAbortController) weatherAbortController.abort()
  weatherAbortController = new AbortController()
  isWeatherLoading.value = true

  try {
    const { data } = await weatherApi.get('/forecast.json', {
      params: {
        q: targetQuery,
        days: 14,
        aqi: 'no',
        alerts: 'no',
      },
      signal: weatherAbortController.signal,
    })

    weatherData.value = data
    setQuery(formatLocation(data.location), { skipSearch: true })
    clearResults()
    activeIndex.value = -1
    weekPage.value = 0
    viewMode.value = 'today'
  } catch (requestError) {
    if (requestError?.name === 'CanceledError' || requestError?.code === 'ERR_CANCELED') return
    weatherError.value = 'Unable to load weather for that city.'
  } finally {
    isWeatherLoading.value = false
  }
}

async function useQuickCity(city) {
  setQuery(city.label, { skipSearch: true })
  clearResults()
  activeIndex.value = -1
  await loadWeather(city.label)
}

function openSearchView() {
  setQuery('', { skipSearch: true })
  clearResults()
  activeIndex.value = -1
  weatherError.value = ''
  viewMode.value = 'search'
}

function openTodayView() {
  if (!weatherData.value) return
  viewMode.value = 'today'
}

function openWeekView(page = 0) {
  if (!weekDays.value.length) return
  weekPage.value = page
  viewMode.value = 'week'
}

function showNextWeek() {
  if (canSeeNextWeek.value) {
    weekPage.value += 1
  }
}

function showPreviousWeek() {
  if (canSeePreviousWeek.value) {
    weekPage.value -= 1
  }
}

function isQuickCityActive(city) {
  return selectedLocation.value?.name?.toLowerCase() === city.label.toLowerCase()
}
</script>

<template>
  <main class="dashboard">
    <header class="topbar">
      <div class="topbar__brand">
        <span>Meteon</span>
        <p>Search first. Today second. Week third.</p>
      </div>

      <div v-if="selectedLocation" class="topbar__status">
        <strong>{{ locationLabel }}</strong>
        <span>{{ localDateLabel }} · {{ localTimeLabel }}</span>
      </div>
    </header>

    <section v-if="viewMode === 'search'" class="search-view">
      <div class="search-view__intro">
        <p class="search-view__eyebrow">Search view</p>
        <h1>Pick the city before you open the forecast.</h1>
        <p class="search-view__copy">
          This first screen is only for finding the place. Once you select a city, the dashboard
          opens directly into today’s weather.
        </p>

        <div v-if="selectedLocation" class="search-view__resume">
          <span>Last selected</span>
          <strong>{{ locationLabel }}</strong>
          <small>{{ locationRegion }}</small>
          <BaseButton type="button" variant="secondary" size="sm" @click="openTodayView">
            Reopen today
          </BaseButton>
        </div>
      </div>

      <section class="search-console">
        <div class="search-console__head">
          <div>
            <p class="search-console__label">City search</p>
            <h2>Find a location</h2>
          </div>
          <span>Live suggestions</span>
        </div>

        <form class="search-console__form" @submit.prevent="submitSearch" @keydown="onKeydown">
          <div class="search-console__field">
            <BaseInput
              v-model="query"
              label="Search city"
              name="city"
              placeholder="Type a city, zip, or coordinates"
              hint="Selecting a city opens the today view."
            >
              <template #icon>
                <WeatherGlyph name="search" :size="18" />
              </template>
            </BaseInput>

            <div v-if="isOpen" class="suggestions" role="listbox" aria-label="City suggestions">
              <div v-if="isLoading" class="suggestions__meta">Searching locations...</div>
              <div v-else-if="error" class="suggestions__meta suggestions__meta--error">
                {{ error }}
              </div>

              <button
                v-for="(item, index) in results"
                :key="`${item?.id ?? index}-${item?.name}`"
                class="suggestions__item"
                :class="activeIndex === index ? 'is-active' : null"
                type="button"
                role="option"
                :aria-selected="activeIndex === index ? 'true' : 'false'"
                @mouseenter="activeIndex = index"
                @mouseleave="activeIndex = -1"
                @click="selectSuggestion(item)"
              >
                <div>
                  <strong>{{ item.name }}</strong>
                  <span>{{ item.region || 'Region not listed' }}</span>
                </div>
                <small>{{ item.country }}</small>
              </button>
            </div>
          </div>

          <BaseButton size="lg" :disabled="isWeatherLoading">
            {{ isWeatherLoading ? 'Loading...' : 'Open today' }}
          </BaseButton>
        </form>

        <div class="search-console__quick">
          <p>Quick picks</p>
          <div class="quick-links">
            <button
              v-for="city in quickCities"
              :key="city.label"
              class="quick-link"
              :class="isQuickCityActive(city) ? 'is-active' : null"
              type="button"
              @click="useQuickCity(city)"
            >
              <strong>{{ city.label }}</strong>
              <span>{{ city.note }}</span>
            </button>
          </div>
        </div>
      </section>
    </section>

    <p v-if="weatherError" class="dashboard__error">{{ weatherError }}</p>

    <section v-if="viewMode === 'today' && weatherData" class="today-view">
      <div class="stage-bar">
        <div class="stage-bar__copy">
          <p>Today view</p>
          <h2>{{ selectedLocation?.name }}</h2>
          <span>{{ locationRegion }}</span>
        </div>

        <div class="stage-bar__actions">
          <BaseButton type="button" variant="ghost" size="sm" @click="openSearchView">
            Change city
          </BaseButton>
          <BaseButton type="button" variant="secondary" size="sm" @click="openWeekView(0)">
            See week
          </BaseButton>
        </div>
      </div>

      <div class="today-layout">
        <article class="today-hero">
          <div class="today-hero__head">
            <div>
              <p class="today-hero__stamp">{{ currentCondition }}</p>
              <h3>{{ selectedLocation?.name }}</h3>
              <span>{{ localDateLabel }}</span>
            </div>
            <img :src="normalizeIcon(selectedCurrent?.condition?.icon)" :alt="currentCondition" />
          </div>

          <div class="today-hero__body">
            <div class="today-hero__temperature">
              <strong>{{ currentTempDisplay }}</strong>
              <span>{{ dayRange }}</span>
              <p>{{ focusNote }}</p>
            </div>

            <div class="today-facts">
              <article v-for="stat in highlightStats" :key="stat.label" class="today-facts__item">
                <span>
                  <WeatherGlyph :name="stat.icon" :size="16" />
                  {{ stat.label }}
                </span>
                <strong>{{ stat.value }}</strong>
              </article>
            </div>
          </div>

          <div class="today-rhythm">
            <div class="today-rhythm__head">
              <div>
                <h4>Today's rhythm</h4>
                <p>From the current hour forward.</p>
              </div>
              <span>{{ localTimeLabel }}</span>
            </div>

            <div class="rhythm-grid">
              <article v-for="hour in hourlyPreview" :key="hour.label" class="rhythm-grid__item">
                <p>{{ hour.label }}</p>
                <img :src="hour.icon" :alt="hour.condition" />
                <strong>{{ hour.temperature }}</strong>
                <span class="rhythm-grid__bar">
                  <i :style="{ height: hour.barHeight }"></i>
                </span>
                <small>{{ hour.condition }}</small>
              </article>
            </div>
          </div>
        </article>

        <aside class="today-rail">
          <div class="today-rail__head">
            <div>
              <p>Observations</p>
              <span>{{ timezoneLabel }}</span>
            </div>
            <WeatherGlyph name="location" :size="18" />
          </div>

          <ul class="reading-list">
            <li v-for="metric in metrics" :key="metric.label" class="reading-list__item">
              <div class="reading-list__meta">
                <span class="reading-list__label">
                  <WeatherGlyph :name="metric.icon" :size="16" />
                  {{ metric.label }}
                </span>
                <small>{{ metric.note }}</small>
              </div>
              <strong>{{ metric.value }}</strong>
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <section v-if="viewMode === 'week' && weatherData" class="week-view">
      <div class="stage-bar">
        <div class="stage-bar__copy">
          <p>Week view</p>
          <h2>{{ selectedLocation?.name }}</h2>
          <span>{{ weekHeading }} · {{ weekRangeLabel }}</span>
        </div>

        <div class="stage-bar__actions">
          <BaseButton type="button" variant="ghost" size="sm" @click="openSearchView">
            Change city
          </BaseButton>
          <BaseButton type="button" variant="secondary" size="sm" @click="openTodayView">
            Back to today
          </BaseButton>
        </div>
      </div>

      <section class="week-board">
        <aside class="week-board__summary">
          <p class="week-board__eyebrow">{{ weekHeading }}</p>
          <h3>{{ locationLabel }}</h3>
          <span>{{ weekRangeLabel }}</span>
          <strong>{{ currentTempDisplay }}</strong>
          <small>{{ currentCondition }}</small>
          <p>{{ focusNote }}</p>

          <div class="week-board__nav">
            <BaseButton
              v-if="canSeePreviousWeek"
              type="button"
              variant="ghost"
              size="sm"
              @click="showPreviousWeek"
            >
              Previous week
            </BaseButton>

            <BaseButton
              v-if="canSeeNextWeek"
              type="button"
              variant="secondary"
              size="sm"
              @click="showNextWeek"
            >
              Next week
            </BaseButton>
          </div>
        </aside>

        <div class="week-board__days">
          <article
            v-for="day in displayedWeekDays"
            :key="`${day.key}-${weekPage}`"
            class="week-column"
            :class="day.isToday ? 'is-today' : null"
          >
            <div class="week-column__head">
              <div>
                <p>{{ day.label }}</p>
                <small>{{ day.shortDate }}</small>
              </div>
              <img :src="day.icon" :alt="day.condition" />
            </div>

            <strong>{{ day.condition }}</strong>
            <div class="week-column__temps">
              <span>{{ day.high }}</span>
              <small>{{ day.low }}</small>
            </div>

            <ul>
              <li>{{ day.rain }}</li>
              <li>{{ day.wind }}</li>
              <li>{{ day.humidity }}</li>
            </ul>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.dashboard {
  position: relative;
  z-index: 1;
  width: min(1720px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 1.35rem 0 2.8rem;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.topbar__brand span {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
}

.topbar__brand p {
  margin-top: 0.3rem;
  color: var(--color-text-soft);
}

.topbar__status {
  display: grid;
  justify-items: end;
  gap: 0.18rem;
}

.topbar__status strong {
  color: var(--color-heading);
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.topbar__status span {
  color: var(--color-text-soft);
  font-size: 0.88rem;
}

.search-view {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(620px, 1.45fr);
  gap: 1.2rem;
  min-height: clamp(580px, 76vh, 860px);
  margin-top: 1.3rem;
}

.search-view__intro,
.search-console,
.today-hero,
.today-rail,
.week-board {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.search-view__intro {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.3rem 1.25rem 1.1rem;
  border-radius: 22px 14px 22px 10px;
}

.search-view__eyebrow,
.week-board__eyebrow,
.today-hero__stamp,
.stage-bar__copy p,
.search-console__label {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.search-view__intro h1 {
  max-width: 12ch;
  margin-top: 0.55rem;
  font-family: var(--font-display);
  font-size: clamp(3.4rem, 7vw, 6.6rem);
  line-height: 0.9;
  letter-spacing: -0.08em;
  color: var(--color-heading);
}

.search-view__copy {
  max-width: 36ch;
  margin-top: 0.95rem;
  color: var(--color-text);
  font-size: 1rem;
}

.search-view__resume {
  display: grid;
  gap: 0.35rem;
  padding-top: 1.1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.search-view__resume span,
.search-view__resume small {
  color: var(--color-text-soft);
}

.search-view__resume strong {
  font-family: var(--font-display);
  font-size: 1.55rem;
  color: var(--color-heading);
}

.search-console {
  display: grid;
  grid-template-rows: auto auto 1fr;
  padding: 1.2rem 1.3rem 1.1rem;
  border-radius: 14px 22px 22px 14px;
}

.search-console__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.search-console__head h2 {
  margin-top: 0.35rem;
  font-family: var(--font-display);
  font-size: 2rem;
  letter-spacing: -0.05em;
  color: var(--color-heading);
}

.search-console__head span {
  color: var(--color-text-soft);
  font-size: 0.88rem;
}

.search-console__form {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: end;
  margin-top: 1rem;
}

.search-console__field {
  position: relative;
}

.search-console__quick {
  display: grid;
  align-content: end;
  gap: 0.7rem;
  margin-top: 1.15rem;
}

.search-console__quick > p {
  color: var(--color-text-soft);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.quick-link {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 0.8rem 0.9rem;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.quick-link strong,
.quick-link span {
  display: block;
}

.quick-link strong {
  color: var(--color-heading);
  font-weight: 700;
}

.quick-link span {
  margin-top: 0.2rem;
  color: var(--color-text-soft);
}

.quick-link:hover,
.quick-link.is-active {
  transform: translateY(-2px);
  border-color: var(--color-border-hover);
}

.suggestions {
  position: absolute;
  top: calc(100% + 0.6rem);
  left: 0;
  right: 0;
  padding: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #12161d;
  box-shadow: var(--shadow-panel);
  z-index: 5;
}

.suggestions__meta {
  padding: 0.8rem 0.9rem;
  color: var(--color-text-soft);
  font-weight: 600;
}

.suggestions__meta--error {
  color: #ff9b9b;
}

.suggestions__item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0.85rem 0.9rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease;
}

.suggestions__item strong,
.suggestions__item span,
.suggestions__item small {
  display: block;
}

.suggestions__item strong {
  color: var(--color-heading);
}

.suggestions__item span,
.suggestions__item small {
  color: var(--color-text-soft);
}

.suggestions__item:hover,
.suggestions__item.is-active {
  background: rgba(255, 255, 255, 0.045);
}

.dashboard__error {
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-left: 3px solid #d46f5f;
  background: rgba(106, 31, 19, 0.22);
  color: #ffd5d0;
}

.today-view,
.week-view {
  margin-top: 1.25rem;
}

.stage-bar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.stage-bar__copy h2 {
  margin-top: 0.35rem;
  font-family: var(--font-display);
  font-size: 2.4rem;
  letter-spacing: -0.06em;
  color: var(--color-heading);
}

.stage-bar__copy span {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-text-soft);
}

.stage-bar__actions {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.today-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.7fr);
  gap: 1rem;
  margin-top: 0.95rem;
}

.today-hero {
  padding: 1.25rem 1.35rem 1.2rem;
  border-radius: 24px 14px 24px 12px;
  box-shadow: var(--shadow-panel);
}

.today-hero__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.today-hero__head h3 {
  margin-top: 0.35rem;
  font-family: var(--font-display);
  font-size: clamp(4.4rem, 9vw, 8.5rem);
  line-height: 0.88;
  letter-spacing: -0.09em;
  color: var(--color-heading);
}

.today-hero__head span {
  display: block;
  margin-top: 0.35rem;
  color: var(--color-text-soft);
}

.today-hero__head img {
  width: 82px;
  height: 82px;
}

.today-hero__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.2rem;
  align-items: end;
  margin-top: 1rem;
}

.today-hero__temperature strong {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(7rem, 16vw, 12rem);
  line-height: 0.82;
  letter-spacing: -0.1em;
  color: var(--color-heading);
}

.today-hero__temperature span {
  display: block;
  margin-top: 0.95rem;
  color: rgba(245, 240, 231, 0.86);
}

.today-hero__temperature p {
  max-width: 38ch;
  margin-top: 0.8rem;
  color: var(--color-text);
}

.today-facts {
  display: grid;
  gap: 0.75rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.today-facts__item {
  display: grid;
  gap: 0.3rem;
}

.today-facts__item span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-text-soft);
}

.today-facts__item strong {
  color: var(--color-heading);
  font-size: 1.05rem;
}

.today-rhythm {
  margin-top: 1.4rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.today-rhythm__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.today-rhythm__head h4 {
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: -0.04em;
  color: var(--color-heading);
}

.today-rhythm__head p,
.today-rhythm__head span {
  color: var(--color-text-soft);
}

.rhythm-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.95rem;
}

.rhythm-grid__item {
  padding: 0.6rem 0.5rem 0.8rem;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.rhythm-grid__item:first-child {
  border-left: 0;
}

.rhythm-grid__item p {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.rhythm-grid__item img {
  width: 38px;
  height: 38px;
  margin-top: 0.4rem;
}

.rhythm-grid__item strong {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-heading);
}

.rhythm-grid__bar {
  display: flex;
  align-items: flex-end;
  height: 70px;
  margin-top: 0.65rem;
}

.rhythm-grid__bar i {
  display: block;
  width: 10px;
  background: linear-gradient(180deg, rgba(159, 197, 206, 0.9), rgba(245, 182, 122, 0.42));
}

.rhythm-grid__item small {
  display: block;
  margin-top: 0.6rem;
  color: rgba(215, 217, 222, 0.74);
  line-height: 1.28;
}

.today-rail {
  padding: 1rem;
  border-radius: 12px 22px 22px 12px;
}

.today-rail__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.today-rail__head p {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--color-heading);
}

.today-rail__head span {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-text-soft);
}

.reading-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}

.reading-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.95rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.reading-list__item:last-child {
  border-bottom: 0;
}

.reading-list__label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-heading);
  font-weight: 600;
}

.reading-list__meta small {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-text-soft);
}

.reading-list__item strong {
  color: var(--color-heading);
  font-size: 1.02rem;
}

.week-board {
  display: grid;
  grid-template-columns: minmax(260px, 0.65fr) minmax(0, 1.75fr);
  gap: 0;
  margin-top: 0.95rem;
  box-shadow: var(--shadow-panel);
}

.week-board__summary {
  padding: 1.15rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.week-board__summary h3 {
  margin-top: 0.45rem;
  font-family: var(--font-display);
  font-size: 2.2rem;
  letter-spacing: -0.05em;
  color: var(--color-heading);
}

.week-board__summary span,
.week-board__summary small {
  display: block;
  color: var(--color-text-soft);
}

.week-board__summary strong {
  display: block;
  margin-top: 1.1rem;
  font-family: var(--font-display);
  font-size: 5.4rem;
  line-height: 0.9;
  letter-spacing: -0.08em;
  color: var(--color-heading);
}

.week-board__summary p:last-of-type {
  margin-top: 0.85rem;
  color: var(--color-text);
}

.week-board__nav {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  margin-top: 1.2rem;
}

.week-board__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(120px, 1fr));
}

.week-column {
  min-height: 100%;
  padding: 1rem 0.85rem;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.week-column:first-child {
  border-left: 0;
}

.week-column.is-today {
  background: rgba(245, 182, 122, 0.05);
}

.week-column__head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}

.week-column__head p {
  color: var(--color-heading);
  font-weight: 700;
}

.week-column__head small {
  color: var(--color-text-soft);
}

.week-column__head img {
  width: 34px;
  height: 34px;
}

.week-column > strong {
  display: block;
  min-height: 2.8em;
  margin-top: 0.85rem;
  color: var(--color-heading);
}

.week-column__temps {
  display: flex;
  gap: 0.45rem;
  align-items: baseline;
  margin-top: 0.7rem;
}

.week-column__temps span {
  color: var(--color-heading);
  font-size: 1.22rem;
  font-weight: 800;
}

.week-column__temps small {
  color: rgba(215, 217, 222, 0.68);
}

.week-column ul {
  list-style: none;
  padding: 0;
  margin: 0.85rem 0 0;
  display: grid;
  gap: 0.35rem;
  color: var(--color-text-soft);
}

@media (max-width: 1180px) {
  .search-view {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .quick-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .today-layout,
  .week-board {
    grid-template-columns: 1fr;
  }

  .week-board__summary {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .week-board__days {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .dashboard {
    width: calc(100vw - 24px);
    padding-top: 1rem;
  }

  .topbar,
  .stage-bar,
  .today-rhythm__head,
  .search-console__head {
    display: grid;
  }

  .search-console__form,
  .stage-bar__actions {
    grid-template-columns: 1fr;
    display: grid;
  }

  .stage-bar__actions {
    justify-items: start;
  }

  .today-hero__body {
    grid-template-columns: 1fr;
  }

  .today-facts {
    padding-left: 0;
    border-left: 0;
  }

  .rhythm-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rhythm-grid__item {
    border-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-left: 0;
  }

  .rhythm-grid__item:nth-child(-n + 3) {
    border-top: 0;
  }

  .week-board__days {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .search-view__intro h1,
  .today-hero__head h3 {
    font-size: clamp(3rem, 18vw, 4.6rem);
  }

  .today-hero__temperature strong,
  .week-board__summary strong {
    font-size: clamp(4.5rem, 22vw, 6.4rem);
  }

  .quick-links,
  .rhythm-grid,
  .week-board__days {
    grid-template-columns: 1fr;
  }

  .search-view__intro,
  .search-console,
  .today-hero,
  .today-rail {
    padding: 1rem 0.95rem;
  }
}
</style>
