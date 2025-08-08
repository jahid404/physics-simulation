<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

  // Physics constants
  const g = ref(9.81) // m/s²
  const pxPerMeter = 5

  // Configurable parameters
  const launchAngle = ref(45) // degrees
  const launchVelocity = ref(30) // m/s
  const initialHeight = ref(0) // m
  const gravityMultiplier = ref(1) // visual speed boost

  // State
  const posX = ref(0) // px
  const posY = ref(0) // px
  const pathPoints = ref<{ x: number; y: number }[]>([])
  const isRunning = ref(false)
  let animationFrame: number
  let startTime = 0

  // Canvas size
  const previewRef = ref<HTMLElement | null>(null)
  const previewWidth = ref(800)
  const previewHeight = ref(400)

  // Calculated landing position
  const landingX = computed(() => horizontalRange.value * pxPerMeter)
  const landingY = computed(() => 0) // Ground level

  const updatePreviewSize = () => {
    if (previewRef.value) {
      previewWidth.value = previewRef.value.clientWidth
      previewHeight.value = previewRef.value.clientHeight
    }
  }

  // Flight time (theoretical)
  const totalFlightTime = computed(() => {
    const vy = launchVelocity.value * Math.sin(launchAngle.value * Math.PI / 180)
    return (vy + Math.sqrt(vy * vy + 2 * g.value * initialHeight.value)) / g.value
  })

  // Maximum height (theoretical)
  const maxHeight = computed(() => {
    const vy = launchVelocity.value * Math.sin(launchAngle.value * Math.PI / 180)
    return initialHeight.value + (vy * vy) / (2 * g.value)
  })

  // Range (theoretical)
  const horizontalRange = computed(() => {
    const vx = launchVelocity.value * Math.cos(launchAngle.value * Math.PI / 180)
    return vx * totalFlightTime.value
  })

  // Simulation start
  const startSimulation = () => {
    if (isRunning.value) {
      cancelAnimationFrame(animationFrame)
    }

    isRunning.value = true
    posX.value = 0
    posY.value = initialHeight.value * pxPerMeter
    pathPoints.value = [{ x: posX.value, y: posY.value }]

    startTime = performance.now()
    simulate()
  }

  const simulate = () => {
    const angleRad = launchAngle.value * Math.PI / 180
    const vx = launchVelocity.value * Math.cos(angleRad)
    const vy0 = launchVelocity.value * Math.sin(angleRad)

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsedTime = Math.min((timestamp - startTime) / 1000 * gravityMultiplier.value, totalFlightTime.value)

      // Calculate position using projectile motion equations
      const x = vx * elapsedTime
      const y = initialHeight.value + vy0 * elapsedTime - 0.5 * g.value * elapsedTime * elapsedTime

      // Update positions
      posX.value = x * pxPerMeter
      posY.value = Math.max(y, 0) * pxPerMeter // Ensure we don't go below ground

      // Add point to path (with some optimization to not store every frame)
      if (pathPoints.value.length < 2 ||
        Math.abs(posX.value - pathPoints.value[pathPoints.value.length - 1].x) > 5 ||
        Math.abs(posY.value - pathPoints.value[pathPoints.value.length - 1].y) > 5) {
        pathPoints.value.push({ x: posX.value, y: posY.value })
      }

      // Ensure the last point is exactly at the landing position
      if (elapsedTime >= totalFlightTime.value) {
        posX.value = landingX.value
        posY.value = landingY.value
        pathPoints.value.push({ x: posX.value, y: posY.value })
        isRunning.value = false
        return
      }

      // Continue animation if projectile is still in the air
      if (isRunning.value) {
        animationFrame = requestAnimationFrame(step)
      }
    }

    animationFrame = requestAnimationFrame(step)
  }

  // Reset simulation when parameters change
  watch([launchAngle, launchVelocity, initialHeight], (newVal, oldVal) => {
    if (isRunning.value) {
      startSimulation()
    }

    // if initial height is changed, update the landing position
    if (newVal[2] !== oldVal[2]) {
      posY.value = newVal[2] * pxPerMeter
    }
  })

  onMounted(() => {
    updatePreviewSize()
    window.addEventListener('resize', updatePreviewSize)
    posY.value = initialHeight.value * pxPerMeter
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
    window.removeEventListener('resize', updatePreviewSize)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">

      <!-- Simulation Preview -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Projectile Motion Simulation</h2>
        <div ref="previewRef"
          class="relative w-full h-[400px] bg-gray-50 border border-gray-300 rounded overflow-hidden">

          <!-- Ground line -->
          <div class="absolute bottom-0 left-0 right-0 h-px bg-green-700"></div>
          <div class="absolute bottom-0 left-0 right-0 h-2 bg-green-600 opacity-20"></div>

          <!-- Path -->
          <svg class="absolute inset-0 w-full h-full">
            <polyline :points="pathPoints.map(p => `${p.x},${previewHeight - p.y}`).join(' ')" fill="none" stroke="blue"
              stroke-width="2" />
          </svg>

          <!-- Projectile -->
          <div class="absolute bg-blue-600 rounded-full transition-transform duration-100 ease-linear" :style="{
            width: '15px',
            height: '15px',
            transform: `translate(${posX}px, ${previewHeight - posY - 7.5}px)`
          }"></div>

          <!-- Landing marker (small dot at calculated landing position) -->
          <div class="absolute bg-green-600 rounded-full w-2 h-2" :style="{
            transform: `translate(${landingX}px, ${previewHeight - landingY - 1}px)`
          }"></div>
        </div>

        <!-- Stats -->
        <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-violet-50 p-3 rounded-lg shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Flight Time</span>
              <span class="text-lg font-semibold">{{ totalFlightTime.toFixed(2) }} <span
                  class="text-sm font-normal text-gray-400">s</span></span>
            </div>
          </div>
          <div class="bg-violet-50 p-3 rounded-lg shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Max Height</span>
              <span class="text-lg font-semibold">{{ maxHeight.toFixed(2) }} <span
                  class="text-sm font-normal text-gray-400">m</span></span>
            </div>
          </div>
          <div class="bg-violet-50 p-3 rounded-lg shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Range</span>
              <span class="text-lg font-semibold">{{ horizontalRange.toFixed(2) }} <span
                  class="text-sm font-normal text-gray-400">m</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>

        <div class="grid gap-2">
          <div class="space-y-4">
            <!-- Launch Angle -->
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">Launch Angle</label>
                <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ launchAngle
                  }}°</span>
              </div>
              <input type="range" v-model.number="launchAngle" min="0" max="90" step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>0°</span>
                <span>90°</span>
              </div>
            </div>

            <!-- Launch Velocity -->
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">Launch Velocity (m/s)</label>
                <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ launchVelocity
                  }} m/s</span>
              </div>
              <input type="range" v-model.number="launchVelocity" min="1" max="100" step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 m/s</span>
                <span>100 m/s</span>
              </div>
            </div>

            <!-- Initial Height (as range) -->
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">Initial Height (m)</label>
                <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ initialHeight
                  }} m</span>
              </div>
              <input type="range" v-model.number="initialHeight" min="0" max="50" step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 m</span>
                <span>50 m</span>
              </div>
            </div>

            <!-- Gravity Multiplier -->
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">Gravity Multiplier</label>
                <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ gravityMultiplier
                  }}×</span>
              </div>
              <input type="range" v-model.number="gravityMultiplier" min="0.5" max="10" step="0.5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5×</span>
                <span>10×</span>
              </div>
            </div>
          </div>

          <button @click="startSimulation"
            class="w-full px-4 py-2 mt-4 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clip-rule="evenodd" />
            </svg>
            {{ isRunning ? 'Restart' : 'Start' }} Simulation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>