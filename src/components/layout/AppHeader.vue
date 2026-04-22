<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'WEATHER',
  },
  timeLabel: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__left">
        <h1 class="app-header__title">{{ props.title }}</h1>
        <div class="app-header__units" aria-label="temperature units">
          <button type="button" class="is-active">degC</button>
          <span>/</span>
          <button type="button">degF</button>
        </div>
      </div>

      <p class="app-header__time">{{ props.timeLabel }}</p>

      <div class="app-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  padding-top: 0.35rem;
}

.app-header__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.2rem 1.5rem 0.55rem;

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
}

.app-header__left {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.6rem;
}

.app-header__title {
  font-weight: 700;
  letter-spacing: 1.2px;
  font-size: 2.5rem;
  color: var(--color-heading);
}

.app-header__units {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(223, 233, 255, 0.86);
  font-size: 2rem;
}

.app-header__units button {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: 0.4px;
  cursor: default;
  opacity: 0.54;
}

.app-header__units button.is-active {
  opacity: 1;
}

.app-header__time {
  text-align: center;
  font-size: 2rem;
  letter-spacing: 0.8px;
  color: rgba(236, 241, 255, 0.9);
}

.app-header__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .app-header__inner {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .app-header__actions {
    justify-content: flex-end;
  }

  .app-header__title {
    font-size: 1.6rem;
  }

  .app-header__units,
  .app-header__time {
    font-size: 1.15rem;
  }
}
</style>
