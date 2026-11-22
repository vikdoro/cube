<script setup lang="ts">
// PROTOTYPE: the guide's bar under the board: one line, its buttons and the progress. It is always the same height,
// so the board never changes size; the words go in a bubble over the board. Tapping the line can bring them back.
import type { Move } from 'flatcube'
import Bar from './Bar.vue'

defineProps<{ turns: Move[]; done: number; dots?: boolean; tone?: 'ok' | 'bad' | ''; colour?: string; expandable?: boolean }>()
defineEmits<{ expand: [] }>()
</script>

<template>
  <section class="mini" :class="tone">
    <div class="line">
      <button class="label" :class="tone" :disabled="!expandable" :aria-label="expandable ? 'Show the instructions' : undefined" @click="$emit('expand')">
        <i v-if="colour" :style="{ background: colour }" />
        <span aria-live="polite"><slot /></span>
        <svg v-if="expandable" class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 8 L6 4 L10 8" /></svg>
      </button>
      <slot name="actions" />
    </div>
    <Bar v-if="turns.length" :turns="turns" :done="done" :dots="dots" />
  </section>
</template>

<style scoped>
.mini { position: relative; z-index: 3; flex: none; height: 98px; box-sizing: border-box; display: grid; align-content: center; gap: 8px; padding: 10px 12px; border-radius: 16px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); }
.line { display: flex; align-items: center; gap: 6px; min-height: 40px; }
.label { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; appearance: none; border: 0; background: none; padding: 0; text-align: left; color: var(--fg); font: 700 18px var(--round); cursor: pointer; }
.label:disabled { cursor: default; opacity: 1; }
.label span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini { transition: background-color 0.2s; }
.mini.ok { background: #e3f9d0; }
.mini.bad { background: #ffe3e3; }
.label.bad { color: #d70015; }
.label.ok { color: #248a3d; }
.label i { flex: none; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); }
.chev { flex: none; width: 12px; height: 12px; fill: none; stroke: var(--muted); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
