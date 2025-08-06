<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  // Simulation parameters
  const mass = ref(1) // kg
  const gravity = ref(9.8) // m/s²
  const kineticFriction = ref(0.25) // Coefficient of kinetic friction
  const initialVelocity = ref(1) // m/s
  const objectWidth = ref(80) // px
  const objectHeight = ref(40) // px
  const airDensity = ref(1.225) // kg/m³
  const dragCoefficient = ref(1.05) // Drag coefficient for a box

  // Conversion constants
  const pxToM = 0.01
  const mToPx = 100

  // Simulation state
  const positionX = ref(0)
  const velocity = ref(initialVelocity.value * mToPx)
  const isSliding = ref(false)
  const restitution = 0.5 // Bounciness factor (0 = no bounce, 1 = full bounce)

  const previewRef = ref<HTMLElement | null>(null)
  const maxDistance = ref(700)

  let animationFrame: number
  let lastTime = 0
  let totalBounces = 0

  // Box style
  const objectStyle = computed(() => ({
    width: `${objectWidth.value}px`,
    height: `${objectHeight.value}px`,
    transform: `translateX(${positionX.value}px)`
  }))

  const updateMaxDistance = () => {
    if (previewRef.value) {
      maxDistance.value = previewRef.value.clientWidth
    }
  }

  const startSlide = () => {
    cancelAnimationFrame(animationFrame)
    positionX.value = 0
    velocity.value = initialVelocity.value * mToPx
    isSliding.value = true
    lastTime = performance.now()
    totalBounces = 0

    console.log(`Starting slide at ${initialVelocity.value} m/s`)
    console.log('Current mass', mass.value)
    simulate()
  }

  const simulate = (timestamp = 0) => {
    if (!isSliding.value) return

    const now = performance.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    if (dt > 0.1) {
      animationFrame = requestAnimationFrame(simulate)
      return
    }

    const velocityMs = velocity.value * pxToM

    // Forces
    const normalForce = mass.value * gravity.value
    const frictionForce = kineticFriction.value * normalForce
    const frontalArea = (objectHeight.value * pxToM) * (objectWidth.value * pxToM)
    const dragForce = 0.5 * airDensity.value * velocityMs ** 2 * dragCoefficient.value * frontalArea
    const totalForce = frictionForce + dragForce
    const direction = velocityMs > 0 ? -1 : 1
    const acceleration = (totalForce * direction) / mass.value

    const newVelocityMs = velocityMs + acceleration * dt
    velocity.value = newVelocityMs * mToPx

    positionX.value += ((velocityMs + newVelocityMs) / 2) * dt * mToPx

    const rightEdge = positionX.value + objectWidth.value
    const leftEdge = positionX.value

    if (rightEdge >= maxDistance.value) {
      positionX.value = maxDistance.value - objectWidth.value
      velocity.value = -Math.abs(velocity.value) * restitution
      console.log('Bounce at right edge')
      totalBounces++
    } else if (leftEdge <= 0) {
      positionX.value = 0
      velocity.value = Math.abs(velocity.value) * restitution
      console.log('Bounce at left edge')
      totalBounces++
    }

    if (Math.abs(newVelocityMs) <= 0.01) {
      velocity.value = 0
      isSliding.value = false

      const finalDistance = (positionX.value * pxToM).toFixed(2)
      console.log(`Stopped after ${finalDistance} m`)

      return
    }

    animationFrame = requestAnimationFrame(simulate)
  }

  onMounted(() => {
    updateMaxDistance()
    window.addEventListener('resize', updateMaxDistance)
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
    window.removeEventListener('resize', updateMaxDistance)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">
      <!-- Simulation Preview -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Box Sliding Simulation</h2>
        <div ref="previewRef"
          class="relative w-full h-[150px] bg-orange-50 border border-blue-200 rounded overflow-hidden">
          <!-- Ground surface -->
          <div class="absolute bottom-0 w-full h-[5px] bg-gray-700"></div>

          <!-- Sliding box -->
          <div class="absolute bottom-[5px] left-0 bg-blue-500 border border-blue-500 rounded" :style="objectStyle">
            <!-- Center indicator -->
            <div
              class="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2">
            </div>
          </div>

          <!-- End wall -->
          <div class="absolute bottom-0 right-0 w-1 h-[150px] bg-gray-800"></div>
        </div>

        <div class="mt-5">
          <div class="flex justify-between">
            <span class="text-md font-semibold">Mass</span>
            <span class="text-md font-medium">{{ mass }} kg</span>
          </div>

          <div class="flex justify-between">
            <span class="text-md font-semibold">Initial Velocity</span>
            <span class="text-md font-medium">{{ initialVelocity }} m/s</span>
          </div>

          <div class="flex justify-between">
            <span class="text-md font-semibold">Friction Coefficient</span>
            <span class="text-md font-medium">{{ kineticFriction }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-md font-semibold">Air Density</span>
            <span class="text-md font-medium">{{ airDensity }} kg/m³</span>
          </div>

          <div class="flex justify-between">
            <span class="text-md font-semibold">Drag Coefficient</span>
            <span class="text-md font-medium">{{ dragCoefficient }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-md font-semibold">Final Distance</span>
            <span class="text-md font-medium">{{ (positionX * pxToM).toFixed(2) }} m</span>
          </div>

          <div class="flex justify-between">
            <span class="text-md font-semibold">Total Bounces</span>
            <span class="text-md font-medium">{{ totalBounces }}</span>
          </div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>
        <div class="space-y-6">
          <!-- Mass Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Mass</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ mass }} kg</span>
            </div>
            <input type="range" v-model.number="mass" min="0.5" max="50" step="0.5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors">
            <div class="flex justify-between text-xs text-gray-500">
              <span>0.5 kg</span>
              <span>50 kg</span>
            </div>
          </div>

          <!-- Initial Velocity Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Initial Velocity</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ initialVelocity }} m/s</span>
            </div>
            <input type="range" v-model.number="initialVelocity" min="0.1" max="10" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors">
            <div class="flex justify-between text-xs text-gray-500">
              <span>0.1 m/s</span>
              <span>10 m/s</span>
            </div>
          </div>

          <!-- Friction Coefficient Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Friction Coefficient</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ kineticFriction.toFixed(2) }}</span>
            </div>
            <input type="range" v-model.number="kineticFriction" min="0.01" max="1" step="0.01"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors">
            <div class="flex justify-between text-xs text-gray-500">
              <span>0.01</span>
              <span>1.00</span>
            </div>
          </div>

          <!-- Air Density Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Air Density</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ airDensity.toFixed(2) }} kg/m³</span>
            </div>
            <input type="range" v-model.number="airDensity" min="0" max="2" step="0.01"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors">
            <div class="flex justify-between text-xs text-gray-500">
              <span>0 kg/m³</span>
              <span>2 kg/m³</span>
            </div>
          </div>

          <!-- Simulation Button -->
          <button @click="startSlide"
            class="w-full px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clip-rule="evenodd" />
            </svg>
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
