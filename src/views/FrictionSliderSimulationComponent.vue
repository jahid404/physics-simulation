<script lang="ts" setup>
  import { ref, computed, onUnmounted } from 'vue'

  const mass = ref(1) // kg
  const gravity = ref(9.8) // m/s^2
  const frictionCoefficient = ref(0.3)
  const initialVelocity = ref(10) // px/s
  const objectWidth = ref(80) // px
  const objectHeight = ref(40) // px
  const pxToM = 0.01
  const mToPx = 100

  const positionX = ref(0)
  const velocity = ref(initialVelocity.value)
  const isSliding = ref(false)
  const maxDistance = 700
  let animationFrame: number

  const objectStyle = computed(() => ({
    width: `${objectWidth.value}px`,
    height: `${objectHeight.value}px`,
    transform: `translateX(${positionX.value}px)`
  }))

  const startSlide = () => {
    cancelAnimationFrame(animationFrame)
    positionX.value = 0
    velocity.value = initialVelocity.value
    isSliding.value = true

    console.log(`Slide started with velocity: ${velocity.value * pxToM} m/s`)
    simulate()
  }

  const simulate = () => {
    if (!isSliding.value) return

    const dt = 0.016 // ~60fps

    // Friction force: F_friction = µ * N (N = mg)
    const frictionForce = frictionCoefficient.value * mass.value * gravity.value
    const acceleration = -frictionForce / mass.value

    velocity.value += acceleration * dt * mToPx
    console.log('velocity', velocity.value);

    // stop when velocity nearly zero
    if (velocity.value <= 0) {
      velocity.value = 0
      isSliding.value = false
      console.log(`Object stopped at ${(positionX.value * pxToM).toFixed(2)} m`)
      return
    }

    positionX.value += velocity.value * dt

    if (positionX.value >= maxDistance) {
      positionX.value = maxDistance
      isSliding.value = false
      console.log(`Object reached end at ${(positionX.value * pxToM).toFixed(2)} m`)
      return
    }

    animationFrame = requestAnimationFrame(simulate)
  }

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">

      <!-- Simulation Preview Box -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Friction Slider Simulation</h2>

        <div class="relative w-full h-[150px] bg-orange-50 border border-orange-200 rounded overflow-hidden">
          <div class="absolute bottom-0 w-full h-[5px] bg-gray-700"></div>
          <div class="absolute bottom-[5px] left-0 bg-orange-500 border border-orange-600 rounded" :style="objectStyle">
          </div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>

        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block font-medium mb-1">Mass (kg)</label>
            <input type="number" v-model.number="mass" min="0.1" step="0.1" class="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label class="block font-medium mb-1">Gravity (m/s²)</label>
            <input type="number" v-model.number="gravity" min="0" max="50" step="0.1"
              class="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label class="block font-medium mb-1">Friction Coefficient (μ)</label>
            <input type="number" v-model.number="frictionCoefficient" min="0" max="1" step="0.01"
              class="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label class="block font-medium mb-1">Initial Velocity (px/s)</label>
            <input type="number" v-model.number="initialVelocity" min="1" step="1"
              class="w-full border px-3 py-2 rounded" />
          </div>

          <button @click="startSlide" class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 w-full">
            Start Slide
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .ball {
    transition: transform 0.05s linear;
  }
</style>