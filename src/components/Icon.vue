<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    :fill="name === 'play' ? 'currentColor' : 'none'"
    stroke="currentColor"
    :stroke-width="name === 'play' ? 0 : 2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path v-if="name === 'play'" d="M8 5.5v13l11-6.5z" />
    <path v-else-if="name === 'left'" d="M15 6l-6 6 6 6" />
    <path v-else-if="name === 'right'" d="M9 6l6 6-6 6" />
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </template>
    <path v-else-if="name === 'spinner'" d="M21 12a9 9 0 1 1-9-9" />
    <path v-else-if="name === 'close'" d="M6 6l12 12M18 6L6 18" />
    <template v-else-if="name === 'grid'">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </template>
  </svg>
</template>
