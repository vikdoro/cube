<script setup lang="ts">
// A sheet that slides up from the bottom over the board, as a modal <dialog>. The owner decides when it is open;
// the sheet reports when the player closes it (✕, a tap on the dimmed backdrop, or Escape).
import { useId, useTemplateRef, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const headingId = useId()

// after rendering, so the content is in place when the browser focuses its autofocus button
watch(() => props.open, open => {
  const d = dialog.value
  if (open && d && !d.open) d.showModal()
  else if (!open && d?.open) d.close()
}, { flush: 'post' })

// the dialog closed itself (Escape, backdrop): tell the owner, unless the owner was the one closing it
function onClose() {
  if (props.open) emit('close')
}

// a tap on the backdrop lands on the dialog box itself, outside its content
function onClick(e: MouseEvent) {
  if (e.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="sheet" :aria-labelledby="headingId" @close="onClose" @click="onClick">
    <div class="inner">
      <div class="grab" aria-hidden="true" />
      <div class="head">
        <h2 :id="headingId">{{ title }}</h2>
        <button class="close" aria-label="Close" @click="emit('close')">✕</button>
      </div>
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.sheet { border: 0; padding: 0; margin: auto auto 0; width: 100%; max-width: 480px; max-height: min(88dvh, 680px); background: var(--card); color: var(--fg); border-radius: 20px 20px 0 0; box-shadow: 0 -8px 30px rgba(0,0,0,0.16); overscroll-behavior: contain; }
.sheet::backdrop { background: rgba(0,0,0,0.32); }
.sheet[open] { animation: sheet-in 0.24s ease-out; }
.sheet[open]::backdrop { animation: fade-in 0.24s ease-out; }
@keyframes sheet-in { from { transform: translateY(24px); opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .sheet[open], .sheet[open]::backdrop { animation: none; } }
.inner { padding: 8px 20px calc(20px + env(safe-area-inset-bottom, 0px)); display: grid; gap: 14px; font-size: 15px; line-height: 1.45; }
.grab { justify-self: center; width: 36px; height: 5px; border-radius: 3px; background: var(--fill-press); }
.head { display: flex; align-items: center; gap: 8px; }
h2 { flex: 1; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
.close { appearance: none; border: 0; width: 30px; height: 30px; border-radius: 50%; background: var(--fill); color: var(--muted); font: 600 17px var(--sans); cursor: pointer; display: grid; place-items: center; padding: 0; }
</style>
