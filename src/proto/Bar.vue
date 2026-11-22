<script setup lang="ts">
// PROTOTYPE: how far through the step's turns: a segment per turn, filling as each one is made.
import type { Move } from 'flatcube'
import { LAYER_COLOUR } from './script'

defineProps<{ turns: Move[]; done: number; dots?: boolean }>()
</script>

<template>
  <div class="bar" :class="{ dots }" role="progressbar" :aria-valuemax="turns.length" :aria-valuenow="done">
    <span v-for="(m, i) in turns" :key="i" class="seg" :class="{ on: i < done, now: i === done }">
      <i v-if="dots" :style="{ background: LAYER_COLOUR[m.layer] }" />
      <b />
    </span>
  </div>
</template>

<style scoped>
.bar { display: flex; gap: 4px; }
.seg { position: relative; flex: 1; height: 6px; border-radius: 3px; background: var(--fill); overflow: hidden; }
.seg b { position: absolute; inset: 0; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform 0.34s ease-in-out; }
.seg.on b { transform: scaleX(1); }
.dots .seg { height: 30px; border-radius: 9px; display: grid; place-items: center; }
.dots .seg b { opacity: 0.25; }
.dots .seg i { position: relative; z-index: 1; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); }
.dots .seg.now { outline: 2px solid var(--accent); outline-offset: -2px; }
</style>
