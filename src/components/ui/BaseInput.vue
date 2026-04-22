<script setup>
import { computed, useId, useSlots } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  name: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input'])

const autoId = useId()
const inputId = computed(() => `input-${autoId}`)
const slots = useSlots()
const hasIcon = computed(() => !!slots.icon)

function onInput(event) {
  emit('update:modelValue', event.target.value)
  emit('input', event)
}
</script>

<template>
  <div class="field">
    <label v-if="props.label" class="field__label" :for="inputId">{{ props.label }}</label>

    <div
      class="field__control-wrap"
      :class="[hasIcon ? 'has-icon' : null, props.error ? 'has-error' : null]"
    >
      <span v-if="hasIcon" class="field__icon">
        <slot name="icon" />
      </span>

      <input
        class="field__control"
        :id="inputId"
        :name="props.name"
        :type="props.type"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :value="props.modelValue"
        :aria-invalid="props.error ? 'true' : 'false'"
        :aria-describedby="props.hint || props.error ? `${inputId}-help` : undefined"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
    </div>

    <p v-if="props.hint || props.error" class="field__help" :id="`${inputId}-help`">
      <span v-if="props.error" class="field__error">{{ props.error }}</span>
      <span v-else>{{ props.hint }}</span>
    </p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.5rem;
}

.field__label {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.field__control-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 58px;
  padding: 0 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: #0f1319;

  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.field__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
}

.field__control {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-text);
  min-height: 44px;
}

.field__control-wrap.has-icon .field__control {
  padding-left: 0.8rem;
}

.field__control::placeholder {
  color: color-mix(in srgb, var(--color-text) 55%, transparent);
}

.field__control-wrap:hover {
  border-color: var(--color-border-hover);
}

.field__control-wrap:focus-within {
  box-shadow: var(--focus-ring);
  border-color: var(--color-border-hover);
}

.field__control:focus-visible {
  outline: none;
}

.field__control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.has-error {
  border-color: #dc2626;
}

.field__help {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-text-soft);
}

.field__error {
  color: #dc2626;
  font-weight: 600;
}
</style>
