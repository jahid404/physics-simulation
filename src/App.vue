<script setup></script>

<template>
  <header class="text-gray-600 bg-white body-font fixed top-0 left-0 right-0 z-10">
    <div class="mx-auto flex flex-wrap items-center justify-between p-3 shadow rounded-[8px]">
      <a class="flex title-font font-medium items-center text-gray-900" href="/">
        <span class="ml-3 text-xl font-bold">Physics Simulation</span>
      </a>

      <nav class="flex items-center text-base">
        <router-link to="/" class="mr-5 hover:text-gray-900">Home</router-link>
      </nav>
    </div>
  </header>

  <div class="mt-15 md:mt-20 mb-10">
    <router-view />
  </div>
</template>

<style scoped></style>
