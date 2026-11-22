<script setup lang="ts">
// PROTOTYPE C, "Watch, then try": each step first plays on the board like a short clip, its caption changing with
// every turn, with controls to pause and step through it. Then it turns back to the start and the player copies it.
// Arrows only show up after a wrong turn or a long pause. Once the clip starts the card folds to one line with the
// controls under the board; tapping the line shows the step's explanation. Cards float over the board, so it keeps
// its size throughout.
import { computed, shallowRef, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Mini from './Mini.vue'
import Stage from './Stage.vue'
import { STEPS } from './script'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()
const s = g.current
const trying = shallowRef(false)
const hasTurns = computed(() => s.value.turns.length > 0)

/** The step's explanation shown over the folded card. */
const why = shallowRef(false)
watch(() => g.step.value, () => { trying.value = false; why.value = false })
board.onTurnApplied(() => { why.value = false })
/** Turning the step back to its start, which shouldn't open the card on the way. */
const rewinding = shallowRef(false)
const folded = computed(() => hasTurns.value && (trying.value || rewinding.value || g.playing.value || g.done.value > 0 || g.wrong.value.length > 0))

const caption = computed(() => {
  if (g.wrong.value.length) return 'Not that one. Undo it.'
  if (trying.value) return g.stepDone.value ? '✓ You did it' : `Your turn: ${s.value.turns.length - g.done.value} to go`
  if (g.stepDone.value) return '✓ Done'
  return s.value.captions[Math.max(0, g.done.value - 1)]
})
const arrow = computed(() => {
  if (g.wrong.value.length) return g.next.value
  if (trying.value && !g.stepDone.value && g.idle.value > 5000) return g.next.value
  return null
})

async function tryIt() {
  why.value = false
  rewinding.value = true
  await g.rewind()
  rewinding.value = false
  trying.value = true
}

async function watchAgain() {
  trying.value = false
  rewinding.value = true
  await g.rewind()
  rewinding.value = false
  g.play(Infinity, 700)
}
</script>

<template>
  <Stage :board="board" :pieces="s.pieces" :targets="s.targets" :arrow="arrow" dim>
    <template v-if="!folded || why" #bubble>
      <div class="head">
        <span class="title">{{ s.title }}</span>
        <button v-if="why" class="link" @click="why = false">Hide</button>
      </div>
      <p class="say" aria-live="polite">{{ s.say.join(' ') }}</p>
    </template>
  </Stage>

  <Mini :turns="s.turns" :done="g.done.value" :expandable="folded"
    :tone="g.wrong.value.length ? 'bad' : g.stepDone.value && hasTurns ? 'ok' : ''" @expand="why = !why">
    <span v-if="!folded" class="muted">Step {{ g.step.value + 1 }} of {{ STEPS.length }}</span>
    <template v-else><span class="tag" :class="{ you: trying }">{{ trying ? 'You' : 'Watch' }}</span> {{ caption }}</template>
    <template #actions>
      <button v-if="!hasTurns" class="btn primary" @click="g.advance()">Got it</button>
      <template v-else-if="!folded">
        <button class="btn" @click="trying = true">Skip</button>
        <button class="btn primary" @click="g.play(Infinity, 700)">▶ Watch</button>
      </template>
      <template v-else-if="!trying">
        <template v-if="!g.stepDone.value">
          <button class="btn icon" aria-label="One turn back" :disabled="g.playing.value || !g.done.value" @click="g.back()">◀</button>
          <button v-if="!g.playing.value" class="btn icon primary" aria-label="Play" @click="g.play(Infinity, 700)">▶</button>
          <button v-else class="btn icon primary" aria-label="Pause" @click="g.stop()">❚❚</button>
          <button class="btn icon" aria-label="One turn on" :disabled="g.playing.value" @click="g.play(1)">▶|</button>
        </template>
        <template v-else>
          <button class="btn icon" aria-label="Watch again" @click="watchAgain">↺</button>
          <button class="btn primary" @click="tryIt">Now you</button>
        </template>
      </template>
      <template v-else>
        <button class="btn icon" aria-label="Watch again" :disabled="g.playing.value" @click="watchAgain">↺</button>
        <button v-if="g.finished.value" class="btn primary" @click="g.goTo(0)">Again</button>
        <button v-else-if="g.stepDone.value" class="btn primary" @click="g.advance()">Next step</button>
      </template>
    </template>
  </Mini>
</template>

<style scoped>
.muted { color: var(--muted); font-weight: 600; font-size: 16px; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font: 700 15px var(--round); }
.link { margin-left: auto; appearance: none; border: 0; background: none; color: var(--accent); font: 500 15px var(--sans); cursor: pointer; padding: 4px; }
.tag { font: 700 11px var(--round); text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 7px; border-radius: 999px; background: var(--fill); color: var(--muted); vertical-align: 2px; }
.tag.you { background: var(--accent); color: #fff; }
.say { margin: 0; font-size: 17px; line-height: 1.35; }
.row { display: flex; align-items: center; gap: 10px; min-height: 40px; }
@keyframes rise { from { opacity: 0; transform: translateY(6px) } }
</style>
