<script lang="ts" setup>
  const simulations = [
    {
      id: 1,
      name: "Drop Simulation",
      description: "Simulate a bouncing ball under gravity",
      link: "/drop-simulation",
    },
    {
      id: 2,
      name: "Projectile Motion",
      description: "See how objects fly through the air",
      link: "/projectile-motion",
    },
    {
      id: 3,
      name: "Pendulum Swing",
      description: "Visualize a swinging pendulum",
      link: "/pendulum",
    },
    {
      id: 4,
      name: "Pendulum Swing",
      description: "Visualize a swinging pendulum",
      link: "/pendulum",
    },

  ]
</script>

<template>
  <div class="min-h-screen p-6 pt-0 bg-gray-100 flex flex-col items-center">
    <h1 class="text-3xl font-bold mb-8">Physics Simulations</h1>

    <div class="grid gap-6 w-full max-w-6xl
             grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <router-link v-for="sim in simulations" :key="sim.id" :to="sim.link"
        class="block bg-white rounded-lg shadow-md hover:shadow-2xs transition p-6 cursor-pointer">
        <h2 class="text-xl font-semibold mb-2">{{ sim.name }}</h2>
        <p class="text-gray-600">{{ sim.description }}</p>
      </router-link>
    </div>
  </div>
</template>
