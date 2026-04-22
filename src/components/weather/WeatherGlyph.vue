<script setup>
const props = defineProps({
  name: {
    type: String,
    default: 'spark',
  },
  size: {
    type: [Number, String],
    default: 20,
  },
  strokeWidth: {
    type: [Number, String],
    default: 1.8,
  },
})
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="props.name === 'search'">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.25 4.25" />
    </template>

    <template v-else-if="props.name === 'location'">
      <path d="M12 21s6-4.8 6-10.2A6 6 0 1 0 6 10.8C6 16.2 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.1" />
    </template>

    <template v-else-if="props.name === 'humidity'">
      <path d="M12 3.5C9.3 7.1 6.8 9.8 6.8 13a5.2 5.2 0 0 0 10.4 0c0-3.2-2.5-5.9-5.2-9.5Z" />
      <path d="M9.5 15.2c.4 1.4 1.6 2.4 3.1 2.6" />
    </template>

    <template v-else-if="props.name === 'wind'">
      <path d="M4 8.5h9.5c1.8 0 3-1.1 3-2.6S15.4 3 14.2 3c-1 0-1.9.5-2.3 1.4" />
      <path d="M3 12.2h15.3c1.6 0 2.7 1 2.7 2.4S19.8 17 18.3 17c-1 0-1.9-.5-2.3-1.3" />
      <path d="M5 16.8h7.5c1.7 0 2.8 1 2.8 2.3 0 1-.8 1.9-1.9 1.9" />
    </template>

    <template v-else-if="props.name === 'visibility'">
      <path d="M2.5 12s3.3-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.3 5.5-9.5 5.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.7" />
    </template>

    <template v-else-if="props.name === 'pressure'">
      <path d="M4.8 15.6a7.2 7.2 0 1 1 14.4 0" />
      <path d="M12 8.5v4.1l3.2 1.8" />
      <path d="M3 18.5h18" />
    </template>

    <template v-else-if="props.name === 'thermometer'">
      <path d="M10 5.3a2 2 0 1 1 4 0v8a4 4 0 1 1-4 0v-8Z" />
      <path d="M12 10v6" />
    </template>

    <template v-else-if="props.name === 'calendar'">
      <path d="M6 4v3M18 4v3" />
      <rect x="4" y="5.5" width="16" height="14" rx="3" />
      <path d="M4 9.5h16" />
    </template>

    <template v-else-if="props.name === 'clock'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.4 2" />
    </template>

    <template v-else-if="props.name === 'sunrise'">
      <path d="M5 17h14" />
      <path d="M7.2 17a4.8 4.8 0 0 1 9.6 0" />
      <path d="M12 7.5V4" />
      <path d="M8.8 10.1 7 8.4" />
      <path d="M15.2 10.1 17 8.4" />
    </template>

    <template v-else-if="props.name === 'chevron'">
      <path d="m6 9 6 6 6-6" />
    </template>

    <template v-else>
      <path
        d="M12 3.5 13.8 9l5.7.3-4.5 3.5 1.6 5.4-4.6-3.1-4.6 3.1 1.6-5.4L4.5 9.3 10.2 9 12 3.5Z"
      />
    </template>
  </svg>
</template>
