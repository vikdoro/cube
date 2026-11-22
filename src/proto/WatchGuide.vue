<script setup lang="ts">
// PROTOTYPE C, "Watch, then try": each step first plays on the board like a short clip, its caption changing with
// every turn, with controls to pause and step through it. Then it turns back to the start and the player copies it.
// Arrows only show up after a wrong turn or a long pause.
import { computed, shallowRef, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Bar from './Bar.vue'
import Stage from './Stage.vue'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()
const s = g.current
const trying = shallowRef(false)
const hasTurns = computed(() => s.value.turns.length > 0)

watch(() => g.step.value, () => { trying.value = false })

const caption = computed(() => {
  if (g.wrong.value.length) return 'Not that one. Undo it.'
  if (trying.value) return g.stepDone.value ? '✓ You did it' : `Your turn: ${s.value.turns.length - g.done.value} to go`
  if (g.playing.value || g.done.value) return s.value.captions[Math.max(0, g.done.value - 1)]
  return s.value.say.join(' ')
})
const arrow = computed(() => {
  if (g.wrong.value.length) return g.next.value
  if (trying.value && !g.stepDone.value && g.idle.value > 5000) return g.next.value
  return null
})

async function tryIt() {
  await g.rewind()
  trying.value = true
}
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" dim />
  <section class="card">
    <div class="head">
      <span class="title">{{ s.title }}</span>
      <span v-if="hasTurns" class="tag" :class="{ you: trying }">{{ trying ? 'You' : 'Watch' }}</span>
    </div>

    <template v-if="!hasTurns">
      <p class="say" aria-live="polite">{{ s.say.join(' ') }}</p>
      <div class="row"><button class="btn primary" @click="g.advance()">Got it</button></div>
    </template>

    <template v-else>
      <p class="say" :class="{ big: g.playing.value || g.done.value || trying, bad: g.wrong.value.length }" aria-live="polite">{{ caption }}</p>
      <Bar :turns="s.turns" :done="g.done.value" />
      <div v-if="!trying" class="row">
        <button class="btn icon" aria-label="Back to the start of the step" :disabled="g.playing.value || !g.done.value" @click="g.rewind()">⏮</button>
        <button class="btn icon" aria-label="One turn back" :disabled="g.playing.value || !g.done.value" @click="g.back()">◀</button>
        <button v-if="!g.playing.value" class="btn icon primary" aria-label="Play" :disabled="g.stepDone.value" @click="g.play(Infinity, 700)">▶</button>
        <button v-else class="btn icon primary" aria-label="Pause" @click="g.stop()">❚❚</button>
        <button class="btn icon" aria-label="One turn on" :disabled="g.playing.value || g.stepDone.value" @click="g.play(1)">▶|</button>
        <span class="grow" />
        <button v-if="g.stepDone.value" class="btn primary" @click="tryIt">Now you</button>
      </div>
      <div v-else class="row">
        <button class="btn" :disabled="g.playing.value" @click="trying = false; g.rewind()">Watch again</button>
        <span class="grow" />
        <button v-if="g.finished.value" class="btn primary" @click="g.goTo(0)">Again</button>
        <button v-else-if="g.stepDone.value" class="btn primary" @click="g.advance()">Next step</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.card { display: grid; gap: 12px; padding: 14px 16px; border-radius: 18px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); min-height: 196px; align-content: start; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font: 700 15px var(--round); }
.tag { font: 700 12px var(--round); text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 8px; border-radius: 999px; background: var(--fill); color: var(--muted); }
.tag.you { background: var(--accent); color: #fff; }
.say { margin: 0; font-size: 16px; line-height: 1.35; min-height: 44px; }
.say.big { font: 700 21px var(--round); }
.say.bad { color: #d70015; }
.row { display: flex; align-items: center; gap: 8px; min-height: 40px; }
.grow { flex: 1; }
</style>
