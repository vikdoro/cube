<script setup lang="ts">
// PROTOTYPE (throwaway, ?proto in the URL): three ways of guiding the player through one hardcoded middle layer
// puzzle, to pin down the UX before building it into the drills. Nothing here touches the real app's state.
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { attachKeyboard, createBoard } from 'flatcube/vue'
import ArrowGuide from './ArrowGuide.vue'
import CardGuide from './CardGuide.vue'
import WatchGuide from './WatchGuide.vue'
import { START, STEPS } from './script'
import { useGuide } from './useGuide'

const VARIANTS = {
  a: { name: 'Coach card', blurb: 'The explanation a sentence at a time, the pieces it mentions lit up. Then “Show me” plays the step, or you turn it.', view: CardGuide },
  b: { name: 'Follow the arrows', blurb: 'The next turn is always drawn on the board, and the card names just that turn. The reasons are behind “Why?”.', view: ArrowGuide },
  c: { name: 'Watch, then try', blurb: 'Each step plays first like a short clip you can pause and step through, then turns back for you to copy.', view: WatchGuide },
} as const
type Key = keyof typeof VARIANTS

const pick = new URLSearchParams(location.search).get('proto') as Key | null
const variant = pick && pick in VARIANTS ? VARIANTS[pick] : null

const board = createBoard({ state: START })
const guide = useGuide(board)
const menu = shallowRef(false)

/** How far through the whole puzzle, for the bar along the top, lesson-app style. */
const progress = computed(() => {
  const s = guide.current.value
  const part = s.turns.length ? guide.done.value / s.turns.length : guide.stepDone.value ? 1 : 0
  return guide.finished.value ? 1 : (guide.step.value + part) / STEPS.length
})

let detach: (() => void) | undefined
onMounted(() => {
  detach = attachKeyboard({
    getView: () => board.view.value,
    onAction: a => a.type === 'turn' ? board.turn(a.move, true) : a.type === 'roll' ? board.roll(a.towards) : guide.back(),
  })
})
onBeforeUnmount(() => detach?.())
</script>

<template>
  <div class="app">
    <template v-if="variant">
      <div class="progress" role="progressbar" aria-label="Progress" :aria-valuenow="Math.round(progress * 100)">
        <b :style="{ transform: `scaleX(${progress})` }" />
      </div>
      <div class="play">
        <component :is="variant.view" :board="board" :guide="guide" />
        <button class="picker" :aria-expanded="menu" aria-label="Switch prototype" @click="menu = !menu">{{ pick!.toUpperCase() }}</button>
        <div v-if="menu" class="scrim" @click="menu = false" />
        <nav v-if="menu" class="menu">
          <a v-for="(v, k) in VARIANTS" :key="k" :href="`./?proto=${k}`" :class="{ on: k === pick }"><b>{{ k.toUpperCase() }}</b> {{ v.name }}</a>
          <button @click="guide.goTo(0); menu = false">Restart</button>
          <a href="./?proto">All prototypes</a>
        </nav>
      </div>
    </template>

    <section v-else class="index">
      <h1>Guided steps</h1>
      <p>Three throwaway takes on helping the player follow a routine, all on the same puzzle: one middle layer edge to put in.</p>
      <a v-for="(v, k) in VARIANTS" :key="k" class="pick" :href="`./?proto=${k}`">
        <b>{{ k.toUpperCase() }} · {{ v.name }}</b>
        <span>{{ v.blurb }}</span>
      </a>
      <a class="pick plain" href="./">Back to the app</a>
    </section>
  </div>
</template>

<style scoped>
.app { height: 100%; touch-action: none; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; padding-inline: 12px; padding-block: calc(10px + env(safe-area-inset-top, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)); }
.progress { flex: none; height: 8px; border-radius: 4px; background: var(--fill); overflow: hidden; margin-right: 52px; margin-top: 14px; }
.progress b { display: block; height: 100%; background: #58cc02; border-radius: 4px; transform-origin: left; transition: transform 0.4s ease-out; }
.play { flex: 1; min-height: 0; position: relative; display: flex; flex-direction: column; gap: 8px; }
.picker { position: absolute; top: -32px; right: 0; z-index: 4; width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--card); color: var(--accent); font: 700 16px var(--round); box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; }
.scrim { position: fixed; inset: 0; z-index: 4; }
.menu { position: absolute; top: 14px; right: 0; z-index: 5; display: grid; min-width: 220px; padding: 6px; border-radius: 14px; background: var(--card); box-shadow: 0 2px 6px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.18); }
.menu a, .menu button { display: block; text-align: left; padding: 10px 12px; border-radius: 9px; border: 0; background: none; color: var(--fg); text-decoration: none; font: 500 16px var(--sans); cursor: pointer; }
.menu a b { display: inline-block; width: 22px; color: var(--accent); font-family: var(--round); }
.menu a.on { background: var(--fill); }
.menu button { color: var(--accent); border-top: 1px solid var(--fill); border-radius: 0; }
.menu a:last-child { color: var(--accent); }
.index { display: grid; gap: 10px; overflow: auto; touch-action: pan-y; }
.index h1 { margin: 0; font-size: 26px; }
.index p { margin: 0 0 6px; color: var(--muted); }
.pick { display: grid; gap: 4px; padding: 14px 16px; border-radius: 14px; background: var(--card); color: var(--fg); text-decoration: none; }
.pick span { color: var(--muted); font-size: 15px; }
.pick.plain { background: none; color: var(--accent); }
</style>
