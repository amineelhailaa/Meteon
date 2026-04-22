<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% 0%, rgba(245, 182, 122, 0.08), transparent 30%),
    radial-gradient(circle at 100% 18%, rgba(159, 197, 206, 0.06), transparent 24%),
    linear-gradient(180deg, #090b10 0%, #0b0f15 34%, #10141a 100%);
}
</style>
