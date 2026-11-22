<script setup lang="ts">
// PROTOTYPE: the guide folded down to one line and a progress bar while the player turns, so the board gets the room.
// Tapping the line opens the full card again.
import type { Move } from 'flatcube'
import Bar from './Bar.vue'

defineProps<{ turns: Move[]; done: number; dots?: boolean; tone?: 'ok' | 'bad' | ''; colour?: string; expandable?: boolean }>()
defineEmits<{ expand: [] }>()
</script>

<template>
  <section class="mini">
    <div class="line">
      <button class="label" :class="tone" :disabled="!expandable" :aria-label="expandable ? 'Show the instructions' : undefined" @click="$emit('expand')">
        <i v-if="colour" :style="{ background: colour }" />
        <span aria-live="polite"><slot /></span>
        <svg v-if="expandable" class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 8 L6 4 L10 8" /></svg>
      </button>
      <slot name="actions" />
    </div>
    <Bar :turns="turns" :done="done" :dots="dots" />
  </section>
</template>

<style scoped>
.mini { display: grid; gap: 8px; padding: 10px 12px; border-radius: 16px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); }
.line { display: flex; align-items: center; gap: 6px; min-height: 40px; }
.label { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; appearance: none; border: 0; background: none; padding: 0; text-align: left; color: var(--fg); font: 700 18px var(--round); cursor: pointer; }
.label:disabled { cursor: default; opacity: 1; }
.label span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.label.bad { color: #d70015; }
.label.ok { color: #248a3d; }
.label i { flex: none; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); }
.chev { flex: none; width: 12px; height: 12px; fill: none; stroke: var(--muted); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
