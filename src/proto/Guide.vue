<script setup lang="ts">
// PROTOTYPE: everything the player reads is in one panel under the board, so the eyes go one way: the board, then
// the panel. The step's instruction is two short lines at most, the pieces it talks about lit on the board and the rest
// dimmed. The player makes every turn; the next one is always drawn on the board as pulsing arrows. The panel turns
// green when the step is done and red after a wrong turn, whose undo the arrows then show. It keeps one height, so the
// board never changes size. Rare actions live behind the "⋯" menu.
import { computed, shallowRef } from 'vue'
import Bar from './Bar.vue'
import Stage from './Stage.vue'
import { STEPS } from './script'
import type { Board } from 'flatcube/vue'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()
const s = g.current
const hasTurns = computed(() => s.value.turns.length > 0)
const menu = shallowRef(false)

const tone = computed(() => g.wrong.value.length ? 'bad' : g.stepDone.value && hasTurns.value ? 'ok' : '')
const text = computed(() => {
  if (g.finished.value) return '✓ The edge is home, and both layers are done.'
  if (g.wrong.value.length) return 'Not that one. Undo it the way the arrows show.'
  if (g.stepDone.value && hasTurns.value) return '✓ Done'
  return s.value.say
})
const arrow = computed(() => hasTurns.value && !g.stepDone.value ? g.next.value : null)

function restart() { menu.value = false; g.goTo(0) }
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" dim />

  <section class="panel" :class="tone">
    <div class="meta">
      <span>Step {{ g.step.value + 1 }} of {{ STEPS.length }} · {{ s.title }}</span>
      <button class="more" aria-label="More" :aria-expanded="menu" @click="menu = !menu">⋯</button>
    </div>
    <div class="body">
      <p class="say" aria-live="polite">{{ text }}</p>
      <button v-if="!hasTurns" class="btn primary" @click="g.advance()">Got it</button>
      <button v-else-if="g.finished.value" class="btn primary" @click="g.goTo(0)">Again</button>
      <button v-else-if="g.stepDone.value" class="btn primary" @click="g.advance()">Next</button>
    </div>
    <Bar v-if="hasTurns" :turns="s.turns" :done="g.done.value" />

    <div v-if="menu" class="scrim" @click="menu = false" />
    <nav v-if="menu" class="menu">
      <button @click="restart">Start again</button>
    </nav>
  </section>
</template>

<style scoped>
.panel { position: relative; z-index: 3; flex: none; height: 124px; box-sizing: border-box; display: grid; grid-template-rows: auto 1fr auto; gap: 6px; padding: 8px 14px 14px; border-radius: 18px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); transition: background-color 0.2s; }
.panel.ok { background: #e3f9d0; }
.panel.bad { background: #ffe3e3; }
.meta { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font: 600 13px var(--round); }
.more { appearance: none; border: 0; background: none; width: 36px; height: 28px; margin-right: -8px; border-radius: 8px; color: var(--muted); font: 700 18px var(--round); line-height: 1; cursor: pointer; }
.body { display: flex; align-items: center; gap: 12px; min-height: 0; }
.say { flex: 1; margin: 0; font-size: 17px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ok .say { color: #248a3d; font-weight: 600; }
.bad .say { color: #d70015; font-weight: 600; }
.scrim { position: fixed; inset: 0; z-index: 4; }
.menu { position: absolute; right: 8px; bottom: calc(100% - 4px); z-index: 5; min-width: 180px; padding: 6px; border-radius: 14px; background: var(--card); box-shadow: 0 2px 6px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.18); }
.menu button { display: block; width: 100%; text-align: left; padding: 10px 12px; border: 0; border-radius: 9px; background: none; color: var(--fg); font: 500 16px var(--sans); cursor: pointer; }
</style>
