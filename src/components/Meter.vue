<script setup lang="ts">
// A stage's mastery meter: SOLID bars, filled from the left.
import { SOLID } from '../composables/useCourse'

defineProps<{ bars: number }>()
</script>

<template>
  <span class="meter" role="img" :aria-label="`${bars} of ${SOLID} bars`">
    <span v-for="i in SOLID" :key="i" class="seg" :class="{ on: i <= bars }" />
  </span>
</template>

<style scoped>
.meter { display: inline-flex; gap: 3px; }
.seg { width: 14px; height: 6px; border-radius: 3px; background: var(--fill-press); }
.seg.on { background: var(--accent); }
</style>
