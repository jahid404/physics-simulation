<script lang="ts" setup>
  import { ref, computed, onUnmounted } from 'vue'

  // Simulation parameters
  const mass = ref(1) // kg
  const gravity = ref(9.8) // m/s²
  const kineticFriction = ref(0.3) // Sliding friction coefficient
  const rollingResistance = ref(0.02) // Rolling resistance coefficient
  const initialVelocity = ref(5) // m/s
  const objectWidth = ref(80) // px
  const objectHeight = ref(40) // px
  const airDensity = ref(1.225) // kg/m³
  const dragCoefficient = ref(0.8) // Depends on object shape

  // Conversion factors (100px = 1m)
  const pxToM = 0.01
  const mToPx = 100

  // Simulation state
  const positionX = ref(0)
  const velocity = ref(initialVelocity.value * mToPx) // px/s
  const isSliding = ref(false)
  const maxDistance = 700 // px
  let animationFrame: number

  // Object style
  const objectStyle = computed(() => ({
    width: `${objectWidth.value}px`,
    height: `${objectHeight.value}px`,
    transform: `translateX(${positionX.value}px)`
  }))

  const startSlide = () => {
    cancelAnimationFrame(animationFrame)
    positionX.value = 0
    velocity.value = initialVelocity.value * mToPx
    isSliding.value = true
    console.log(`Starting slide at ${initialVelocity.value} m/s (${velocity.value} px/s)`)
    simulate()
  }

  const simulate = () => {
    if (!isSliding.value) return

    const dt = 0.016 // ~60fps
    const velocityMs = velocity.value * pxToM // Convert to m/s for physics

    // 1. Normal force (N = mg)
    const normalForce = mass.value * gravity.value

    // 2. Rolling resistance (F_rolling = C_rr * N)
    const rollingForce = rollingResistance.value * normalForce

    // 3. Air resistance (F_drag = 0.5 * ρ * v² * C_d * A)
    const frontalArea = (objectHeight.value * pxToM) * (objectWidth.value * pxToM) // m²
    const dragForce = 0.5 * airDensity.value * Math.pow(velocityMs, 2) *
      dragCoefficient.value * frontalArea

    // 4. Total deceleration force
    const totalForce = rollingForce + dragForce

    // 5. Calculate acceleration (a = F/m)
    const acceleration = -totalForce / mass.value

    // Update velocity (convert back to px/s)
    const newVelocityMs = velocityMs + acceleration * dt
    velocity.value = newVelocityMs * mToPx

    // Stop condition
    if (newVelocityMs <= 0.01) { // ~0.01 m/s threshold
      velocity.value = 0
      isSliding.value = false
      const finalDistance = (positionX.value * pxToM).toFixed(2)
      console.log(`Stopped after ${finalDistance} m`)
      return
    }

    // Update position
    positionX.value += velocity.value * dt

    // Boundary check
    if (positionX.value >= maxDistance) {
      positionX.value = maxDistance
      isSliding.value = false
      console.log(`Reached end of track at ${(maxDistance * pxToM).toFixed(2)} m`)
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
      <!-- Simulation Preview -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Realistic Friction Simulation</h2>
        <div class="relative w-full h-[150px] bg-orange-50 border border-orange-200 rounded overflow-hidden">
          <div class="absolute bottom-0 w-full h-[5px] bg-gray-700"></div>
          <div class="absolute bottom-[5px] left-0 bg-orange-500 border border-orange-600 rounded" :style="objectStyle">
            <div
              class="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block font-medium mb-1">Mass (kg)</label>
            <input type="range" v-model.number="mass" min="0.1" max="100" step="0.1" class="w-full">
            <span class="text-sm text-gray-600">{{ mass }} kg</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Initial Velocity (m/s)</label>
            <input type="range" v-model.number="initialVelocity" min="1" max="20" step="0.1" class="w-full">
            <span class="text-sm text-gray-600">{{ initialVelocity }} m/s</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Rolling Resistance</label>
            <input type="range" v-model.number="rollingResistance" min="0.001" max="0.1" step="0.001" class="w-full">
            <span class="text-sm text-gray-600">{{ rollingResistance.toFixed(3) }}</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Air Density (kg/m³)</label>
            <input type="range" v-model.number="airDensity" min="0" max="2" step="0.01" class="w-full">
            <span class="text-sm text-gray-600">{{ airDensity.toFixed(2) }} kg/m³</span>
          </div>

          <button @click="startSlide" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
