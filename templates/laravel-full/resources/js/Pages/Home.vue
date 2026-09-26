<script setup>
import { ref } from 'vue';

defineProps({
  appName: String,
  description: String,
  author: String,
  framework: String,
  frontend: String,
  database: String
});

const isModalOpen = ref(false);
const isDrawerOpen = ref(false);
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 p-8">
    <div class="max-w-4xl mx-auto text-center">
      <div class="w-16 h-16 rounded-2xl bg-sky-600 text-white text-3xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-md">
        {{ appName ? appName.charAt(0) : 'L' }}
      </div>
      
      <h1 class="text-4xl font-extrabold mb-2 tracking-tight text-slate-900">{{ appName }}</h1>
      <p class="text-lg text-slate-600 mb-6">{{ description }}</p>
      
      <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold mb-8 shadow-sm">
        <span class="text-red-500 font-bold">🔴 {{ framework }}</span>
        <span>•</span>
        <span class="text-emerald-600 font-bold">🟢 {{ frontend }}</span>
        <span>•</span>
        <span class="text-sky-600 font-bold">🗄️ {{ database.toUpperCase() }}</span>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 justify-center mb-8">
        <button @click="isModalOpen = true" class="px-5 py-2.5 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition">
          Open Demo Modal
        </button>
        <button @click="isDrawerOpen = true" class="px-5 py-2.5 rounded-lg border border-slate-300 bg-white font-semibold hover:bg-slate-100 transition">
          Open Offcanvas Drawer
        </button>
      </div>

      <!-- System Architecture Details -->
      <div class="p-6 rounded-xl bg-white border border-slate-200 text-left shadow-sm">
        <h3 class="text-lg font-bold mb-3">Included Architecture:</h3>
        <ul class="space-y-2 text-sm text-slate-600">
          <li class="flex items-center gap-2">✓ <strong>Artisan CLI:</strong> Full <code>php artisan</code> support included.</li>
          <li class="flex items-center gap-2">✓ <strong>Database:</strong> Native Eloquent ORM & Migrations configured for {{ database.toUpperCase() }}.</li>
          <li class="flex items-center gap-2">✓ <strong>Frontend:</strong> Vue 3 Composition API with Inertia.js & Vite HMR.</li>
          <li class="flex items-center gap-2">✓ <strong>Maintainer:</strong> Built with BoilerCraft by {{ author }}.</li>
        </ul>
      </div>
    </div>

    <!-- Modal Dialog -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div class="bg-white border border-slate-200 p-6 rounded-xl max-w-md w-full shadow-2xl">
        <h3 class="text-lg font-bold mb-2">Action Modal</h3>
        <p class="text-sm text-slate-600 mb-4">This Vue component is pre-wired and ready for your forms.</p>
        <button @click="isModalOpen = false" class="w-full py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700">Close</button>
      </div>
    </div>

    <!-- Offcanvas Drawer -->
    <div v-if="isDrawerOpen" class="fixed inset-0 z-50 bg-black/30" @click="isDrawerOpen = false"></div>
    <div :class="['fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-slate-200 p-6 z-50 transition-transform duration-300', isDrawerOpen ? 'translate-x-0' : '-translate-x-full']">
      <div class="flex justify-between items-center mb-6">
        <h4 class="font-bold">Navigation Drawer</h4>
        <button @click="isDrawerOpen = false" class="text-xl">&times;</button>
      </div>
      <p class="text-sm text-slate-600">Vue 3 offcanvas drawer with clean responsive layout.</p>
    </div>
  </div>
</template>
