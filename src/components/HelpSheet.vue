<script setup lang="ts">
import { usePractice } from '../composables/usePractice'
import { useSheets } from '../composables/useSheets'
import BottomSheet from './BottomSheet.vue'

const sheets = useSheets()
const { resetToSolved } = usePractice()
</script>

<template>
  <BottomSheet :open="sheets.current.value === 'help'" title="Reading the board" @close="sheets.close">
    <p><b>An open box.</b> The middle is the face you are looking at. The four sides fold out around it, three rows deep, and the face on the far side hangs open above like a lid, hinged on the top edge, so all six faces are in view.</p>
    <p><b>Tap any side</b> to roll the cube towards you so that side is in the middle. Tap the lid to turn the cube all the way over.</p>
    <p><b>Drag a sticker</b> to turn. As soon as you move, the row or ring that will turn lights up with its arrows; let go to turn it. To cancel, drag back to where you started or drag off the board. The middle row and column don't turn, only the outer ones.</p>
    <p><b>Practice</b> turns the cube a few times from solved for you to turn back, so every puzzle ends with a solved cube.</p>
    <button class="link" @click="resetToSolved">Reset to solved</button>
  </BottomSheet>
</template>

<style scoped>
.link { justify-self: start; appearance: none; border: 0; background: none; color: var(--accent); font: 500 15px var(--sans); padding: 0; cursor: pointer; }
</style>
