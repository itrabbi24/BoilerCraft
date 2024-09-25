<script setup>
import { ref } from 'vue';

defineProps({
  appName: String,
  description: String,
  author: String,
  features: Array
});

const isModalOpen = ref(false);
const isDrawerOpen = ref(false);
</script>

<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-8">
    <div class="max-w-4xl mx-auto text-center">
      <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary)] text-white text-3xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-primary)]/20">
        {{ appName ? appName.charAt(0) : 'L' }}
      </div>
      
      <h1 class="text-4xl font-extrabold mb-2 tracking-tight">{{ appName }}</h1>
      <p class="text-lg text-[var(--color-text-muted)] mb-6">{{ description }}</p>
      
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold mb-8">
        <span>Laravel 11 + Vue 3 + MySQL</span>
        <span class="text-[var(--color-primary)] font-bold">● Active</span>
      </div>

      <!-- Action Buttons for Modal and Drawer -->
      <div class="flex gap-4 justify-center mb-8">
        <button @click="isModalOpen = true" class="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:opacity-90 transition">
          Open Demo Modal
        </button>
        <button @click="isDrawerOpen = true" class="px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] font-semibold hover:bg-[var(--color-surface-hover)] transition">
          Open Offcanvas Drawer
        </button>
      </div>

      <!-- Feature Card -->
      <div class="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-left shadow-xl">
        <h3 class="text-lg font-bold mb-4">Included Architectures:</h3>
        <ul class="space-y-2">
          <li v-for="(feat, idx) in features" :key="idx" class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span class="text-emerald-500 font-bold">✓</span> {{ feat }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Modal Component -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl max-w-md w-full shadow-2xl">
        <h3 class="text-lg font-bold mb-2">Enterprise Modal</h3>
        <p class="text-sm text-[var(--color-text-muted)] mb-4">This Vue modal component is pre-wired to BoilerCraft design tokens.</p>
        <button @click="isModalOpen = false" class="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg font-semibold">Close</button>
      </div>
    </div>

    <!-- Drawer Component -->
    <div v-if="isDrawerOpen" class="fixed inset-0 z-50 bg-black/40" @click="isDrawerOpen = false"></div>
    <div :class="['fixed top-0 left-0 bottom-0 w-80 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-6 z-50 transition-transform duration-300', isDrawerOpen ? 'translate-x-0' : '-translate-x-full']">
      <div class="flex justify-between items-center mb-6">
        <h4 class="font-bold">Navigation Drawer</h4>
        <button @click="isDrawerOpen = false" class="text-xl">&times;</button>
      </div>
      <p class="text-sm text-[var(--color-text-muted)]">Vue 3 composition offcanvas drawer ready for your menu links.</p>
    </div>
  </div>
</template>
