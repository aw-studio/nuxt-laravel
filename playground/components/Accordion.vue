<template>
    <div class="bg-gray-100 px-2 text-sm">
        <span
            class="flex text-sm items-center w-full"
            @click.prevent="show = !show"
        >
            <slot name="button">
                <template v-if="!show">Show</template>
                <template v-else>Hide</template>
            </slot>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-chevron-down-icon lucide-chevron-down w-4 h-4"
            >
                <path d="m6 9 6 6 6-6" />
            </svg>
        </span>
        <div v-if="show">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
const show = ref(false)
</script>
