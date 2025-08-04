<script lang="ts" setup>
  import { ref, computed, onUnmounted } from 'vue'

  // Simulation parameters
  const mass = ref(5) // kg (more realistic default)
  const gravity = ref(9.8) // m/s²
  const kineticFriction = ref(0.25) // Sliding friction coefficient (typical for wood on wood)
  const initialVelocity = ref(3) // m/s (more realistic speed)
  const objectWidth = ref(80) // px
  const objectHeight = ref(40) // px
  const airDensity = ref(1.225) // kg/m³
  const dragCoefficient = ref(1.05) // Typical for rectangular box

  // Conversion factors (100px = 1m)
  const pxToM = 0.01
  const mToPx = 100

  // Simulation state
  const positionX = ref(0)
  const velocity = ref(initialVelocity.value * mToPx) // px/s
  const isSliding = ref(false)
  const maxDistance = 700 // px
  let animationFrame: number
  let lastTime = 0

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
    lastTime = performance.now()
    console.log(`Starting slide at ${initialVelocity.value} m/s`)
    simulate()
  }

  const simulate = (timestamp = 0) => {
    if (!isSliding.value) return

    // Calculate delta time in seconds
    const now = performance.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    // Skip if time interval is too large (tab was inactive)
    if (dt > 0.1) {
      animationFrame = requestAnimationFrame(simulate)
      return
    }

    const velocityMs = velocity.value * pxToM // Current velocity in m/s

    // 1. Normal force (N = mg)
    const normalForce = mass.value * gravity.value

    // 2. Kinetic friction (F_friction = μ_k * N)
    const frictionForce = kineticFriction.value * normalForce

    // 3. Air resistance (F_drag = 0.5 * ρ * v² * C_d * A)
    const frontalArea = (objectHeight.value * pxToM) * (objectWidth.value * pxToM) // m²
    const dragForce = 0.5 * airDensity.value * Math.pow(velocityMs, 2) *
      dragCoefficient.value * frontalArea

    // 4. Total deceleration force (always opposes motion)
    const totalForce = frictionForce + dragForce
    const direction = velocityMs > 0 ? -1 : 1 // Force opposes motion

    // 5. Calculate acceleration (a = F/m)
    const acceleration = (totalForce * direction) / mass.value

    // Update velocity (convert back to px/s)
    const newVelocityMs = velocityMs + acceleration * dt
    velocity.value = newVelocityMs * mToPx

    // Update position (using average velocity during this timestep)
    positionX.value += ((velocityMs + newVelocityMs) / 2) * dt * mToPx

    // Boundary check - right edge of box reaches end
    const rightEdge = positionX.value + objectWidth.value
    if (rightEdge >= maxDistance) {
      positionX.value = maxDistance - (objectWidth.value / 2)
      isSliding.value = false
      const finalDistance = (positionX.value * pxToM).toFixed(2)
      console.log(`Box reached end at ${finalDistance} m`)
      return
    }

    // Stop condition (when velocity becomes negligible)
    if (Math.abs(newVelocityMs) <= 0.01) { // ~0.01 m/s threshold
      velocity.value = 0
      isSliding.value = false
      const finalDistance = (positionX.value * pxToM).toFixed(2)
      console.log(`Stopped after ${finalDistance} m`)
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
        <h2 class="text-xl font-bold mb-4 text-center">Box Sliding Simulation</h2>
        <div class="relative w-full h-[150px] bg-orange-50 border border-orange-200 rounded overflow-hidden">
          <!-- Ground surface -->
          <div class="absolute bottom-0 w-full h-[5px] bg-gray-700"></div>

          <!-- Sliding box -->
          <div class="absolute bottom-[5px] left-0 bg-orange-500 border border-orange-600 rounded" :style="objectStyle">
            <!-- Center indicator -->
            <div
              class="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            </div>
          </div>

          <!-- End wall -->
          <div class="absolute bottom-0 right-0 w-2 h-[150px] bg-gray-800"></div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block font-medium mb-1">Mass (kg)</label>
            <input type="range" v-model.number="mass" min="0.1" max="50" step="0.1" class="w-full">
            <span class="text-sm text-gray-600">{{ mass }} kg</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Initial Velocity (m/s)</label>
            <input type="range" v-model.number="initialVelocity" min="0.1" max="10" step="0.1" class="w-full">
            <span class="text-sm text-gray-600">{{ initialVelocity }} m/s</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Friction Coefficient</label>
            <input type="range" v-model.number="kineticFriction" min="0.01" max="1" step="0.01" class="w-full">
            <span class="text-sm text-gray-600">{{ kineticFriction.toFixed(2) }}</span>
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
