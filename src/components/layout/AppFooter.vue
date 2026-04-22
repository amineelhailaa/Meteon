<script setup>
const props = defineProps({
  company: {
    type: String,
    default: 'Meteon',
  },
  year: {
    type: [String, Number],
    default: () => new Date().getFullYear(),
  },
})
</script>

<template>
  <footer class="app-footer">
    <nav class="app-footer__tabs" aria-label="Main dashboard sections">
      <button type="button">Dashboard</button>
      <button type="button" class="is-active">Weather</button>
      <button type="button">Climate</button>
      <button type="button">Security</button>
      <button type="button">Lights</button>
      <button type="button">Energy</button>
      <button type="button">More</button>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 1rem;
  padding: 0.8rem 0 0;
}

.app-footer__tabs {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 1.2rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--color-border);
  background: rgba(7, 11, 32, 0.72);
}

.app-footer__tabs button {
  appearance: none;
  border: 0;
  border-right: 1px solid var(--color-border);
  background: transparent;
  color: rgba(216, 224, 255, 0.72);
  text-transform: uppercase;
  font-size: 0.87rem;
  letter-spacing: 0.32px;
  min-height: 62px;
}

.app-footer__tabs button:last-child {
  border-right: 0;
}

.app-footer__tabs button.is-active {
  background: color-mix(in srgb, var(--color-accent) 36%, transparent);
  color: #f4f7ff;
}

@media (max-width: 640px) {
  .app-footer__tabs {
    padding: 0 1rem 1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
