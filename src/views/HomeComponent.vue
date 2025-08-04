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
      name: "Spring Oscillation",
      description: "Explore a spring-mass oscillating system",
      link: "/spring-oscillation",
    },
    {
      id: 5,
      name: "Friction Slider",
      description: "Box sliding on a surface with friction",
      link: "/friction-slider",
    },
    {
      id: 6,
      name: "Circular Motion",
      description: "Object moving in a circle at constant speed",
      link: "/circular-motion",
    },
    {
      id: 7,
      name: "Collision Demo",
      description: "Simulate elastic collisions between balls",
      link: "/collision-demo",
    },
    {
      id: 8,
      name: "Gravity Attraction",
      description: "Two-body gravitational attraction",
      link: "/gravity-attraction",
    },
  ]
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center">
    <h1 class="text-3xl font-bold mb-5">Physics Simulations</h1>

    <div class="grid gap-4 w-full max-w-6xl
             grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <router-link v-for="sim in simulations" :key="sim.id" :to="sim.link"
        class="block bg-white rounded-lg shadow-md hover:shadow-2xs transition p-6 cursor-pointer">
        <span class="badge"></span>
        <h2 class="text-xl font-semibold mb-2">{{ sim.name }}</h2>
        <p class="text-gray-600">{{ sim.description }}</p>
      </router-link>
    </div>
  </div>
</template>
