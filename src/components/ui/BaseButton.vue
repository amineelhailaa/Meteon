<script setup>
import { computed } from 'vue'

const props = defineProps({
  as: {
    type: String,
    default: 'button',
  },
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  props.disabled ? 'is-disabled' : null,
])

function onClick(event) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <component
    :is="props.as"
    :class="classes"
    :type="props.as === 'button' ? props.type : undefined"
    :disabled="props.as === 'button' ? props.disabled : undefined"
    :aria-disabled="props.disabled ? 'true' : undefined"
    @click="onClick"
  >
    <slot />
  </component>
</template>

<style scoped>
.btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  font: inherit;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;

  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    transform 120ms ease,
    opacity 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.btn--sm {
  min-height: 38px;
  padding: 0 0.9rem;
  font-size: 0.9rem;
}

.btn--md {
  min-height: 44px;
  padding: 0 1rem;
}

.btn--lg {
  min-height: 54px;
  padding: 0 1.2rem;
  font-size: 1rem;
}

.btn--primary {
  background: var(--color-accent);
  color: #20140c;
}

.btn--primary:hover {
  box-shadow: 0 10px 22px rgba(245, 182, 122, 0.16);
  transform: translateY(-1px);
}

.btn--primary:active {
  transform: translateY(1px);
}

.btn--secondary {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-heading);
}

.btn--secondary:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}

.btn--secondary:active {
  transform: translateY(1px);
}

.btn--ghost {
  padding-left: 0;
  padding-right: 0;
  background: transparent;
  border-color: transparent;
  color: var(--color-text-soft);
  border-radius: 0;
}

.btn--ghost:hover {
  color: var(--color-accent);
}

.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
