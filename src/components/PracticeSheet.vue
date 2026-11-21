<script setup lang="ts">
import { MAX_LEVEL, usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import { levelName } from '../text'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { drill, start, resetToSolved, currentLevel } = usePractice()
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'practice'" title="Practice" @close="sheets.close">
    <p>Short puzzles, each with one goal. Start at 1 and add one when it feels easy.</p>
    <div class="pick">
      <b>Undo the scramble</b>
      <p>The cube was turned a few times from solved. Turn it back.</p>
      <div class="chips">
        <button
          v-for="n in MAX_LEVEL.undo" :key="n" class="btn level"
          :aria-pressed="n === currentLevel('undo')" :aria-label="`Undo ${levelName('undo', n)}`"
          @click="start('undo', n)"
        >{{ n }}</button>
      </div>
    </div>
    <div class="pick">
      <b>Make the white lily</b>
      <p>The first step of solving: the four white edges around the yellow centre. Pick how many petals are missing, or start from a full scramble.</p>
      <div class="chips">
        <button
          v-for="n in MAX_LEVEL.lily" :key="n" class="btn level"
          :class="{ wide: n === MAX_LEVEL.lily }"
          :aria-pressed="n === currentLevel('lily')" :aria-label="`White lily, ${levelName('lily', n)}`"
          @click="start('lily', n)"
        >{{ n === MAX_LEVEL.lily ? 'Full scramble' : n }}</button>
      </div>
    </div>
    <div class="pick">
      <b>Make the white cross</b>
      <p>The petals drop onto the lid, each on the side of its own colour. Pick how many petals are still to drop, or start from a full scramble.</p>
      <div class="chips">
        <button
          v-for="n in MAX_LEVEL.cross" :key="n" class="btn level"
          :class="{ wide: n === MAX_LEVEL.cross }"
          :aria-pressed="n === currentLevel('cross')" :aria-label="`White cross, ${levelName('cross', n)}`"
          @click="start('cross', n)"
        >{{ n === MAX_LEVEL.cross ? 'Full scramble' : n }}</button>
      </div>
    </div>
    <div class="pick">
      <b>Put in the white corners</b>
      <p>With white in the middle, the corners go in between the cross's edges, which finishes the white face. Pick how many corners are still to place, or start from a full scramble.</p>
      <div class="chips">
        <button
          v-for="n in MAX_LEVEL.corners" :key="n" class="btn level"
          :class="{ wide: n === MAX_LEVEL.corners }"
          :aria-pressed="n === currentLevel('corners')" :aria-label="`White corners, ${levelName('corners', n)}`"
          @click="start('corners', n)"
        >{{ n === MAX_LEVEL.corners ? 'Full scramble' : n }}</button>
      </div>
    </div>
    <div class="pick">
      <b>Fill the middle layer</b>
      <p>With the white face done, the four edges with no yellow go into the middle row, each between the sides of its colours. Pick how many are still to place, or start from a full scramble.</p>
      <div class="chips">
        <button
          v-for="n in MAX_LEVEL.middle" :key="n" class="btn level"
          :class="{ wide: n === MAX_LEVEL.middle }"
          :aria-pressed="n === currentLevel('middle')" :aria-label="`Middle layer, ${levelName('middle', n)}`"
          @click="start('middle', n)"
        >{{ n === MAX_LEVEL.middle ? 'Full scramble' : n }}</button>
      </div>
    </div>
    <div class="pick">
      <b>Make the yellow cross</b>
      <p>With the first two layers done, the yellow edges turn so their yellow is on the yellow face. Six turns, done once, twice or three times. Pick the shape the yellow edges start in.</p>
      <div class="chips">
        <button
          v-for="n in MAX_LEVEL.yellow" :key="n" class="btn level"
          :class="{ wide: n === MAX_LEVEL.yellow }"
          :aria-pressed="n === currentLevel('yellow')" :aria-label="`Yellow cross, ${levelName('yellow', n)}`"
          @click="start('yellow', n)"
        >{{ n === MAX_LEVEL.yellow ? 'Any shape' : n }}</button>
      </div>
    </div>
    <button v-if="drill" class="btn plain" @click="resetToSolved">Stop practising</button>
  </BottomSheet>
</template>

<style scoped>
.pick { display: grid; gap: 8px; padding: 12px 14px; border-radius: 14px; background: var(--bg); }
.level { min-width: 44px; padding: 0; }
.level.wide { padding: 0 14px; }
.level[aria-pressed="true"] { background: var(--accent); color: #fff; }
</style>
