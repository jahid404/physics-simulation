<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  // Physics constants
  const g = ref(9.81) // m/s² (Earth gravity)
  const pxPerMeter = 5 // Scaling for visuals

  // Configurable parameters
  const launchAngle = ref(45) // degrees
  const launchVelocity = ref(50) // m/s
  const initialHeight = ref(0) // m
  const gravityMultiplier = ref(1) // Speed boost for visuals

  // State
  const posX = ref(0) // px
  const posY = ref(0) // px (0 = ground)
  const pathPoints = ref<{ x: number; y: number }[]>([])
  const isRunning = ref(false)
  let animationFrame: number
  let lastTime = 0

  // Canvas size
  const previewRef = ref<HTMLElement | null>(null)
  const previewWidth = ref(800)
  const previewHeight = ref(400)

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
    isRunning.value = true
    posX.value = 0
    posY.value = initialHeight.value * pxPerMeter
    pathPoints.value = []

    lastTime = performance.now()
    simulate(0, initialHeight.value, launchVelocity.value, launchAngle.value)
  }

  const simulate = (x0: number, y0: number, velocity: number, angleDeg: number) => {
    const angleRad = angleDeg * Math.PI / 180
    let t = 0
    const vx = velocity * Math.cos(angleRad)
    const vy0 = velocity * Math.sin(angleRad)

    const step = () => {
      const now = performance.now()
      const dt = ((now - lastTime) / 1000) * gravityMultiplier.value
      lastTime = now
      t += dt

      // Position in meters
      const x = x0 + vx * t
      const y = y0 + vy0 * t - 0.5 * g.value * t * t

      if (y < 0) {
        isRunning.value = false
        cancelAnimationFrame(animationFrame)
        return
      }

      posX.value = x * pxPerMeter
      posY.value = y * pxPerMeter
      pathPoints.value.push({ x: posX.value, y: posY.value })

      animationFrame = requestAnimationFrame(step)
    }

    animationFrame = requestAnimationFrame(step)
  }

  onMounted(() => {
    updatePreviewSize()
    window.addEventListener('resize', updatePreviewSize)
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

          <!-- Path -->
          <svg class="absolute inset-0 w-full h-full">
            <polyline :points="pathPoints.map(p => `${p.x},${previewHeight - p.y}`).join(' ')" fill="none" stroke="blue"
              stroke-width="2" />
          </svg>

          <!-- Projectile -->
          <div class="absolute bg-red-500 rounded-full" :style="{
            width: '15px',
            height: '15px',
            transform: `translate(${posX}px, ${previewHeight - posY - 7.5}px)`
          }"></div>
        </div>

        <!-- Stats -->
        <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <span class="text-sm text-gray-600">Flight Time</span>
            <div class="text-lg font-semibold">{{ totalFlightTime.toFixed(2) }} s</div>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <span class="text-sm text-gray-600">Max Height</span>
            <div class="text-lg font-semibold">{{ maxHeight.toFixed(2) }} m</div>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <span class="text-sm text-gray-600">Range</span>
            <div class="text-lg font-semibold">{{ horizontalRange.toFixed(2) }} m</div>
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
              <label class="block text-sm font-medium text-gray-700">Launch Angle (°)</label>
              <div class="relative rounded-md shadow-sm">
                <input type="number" v-model.number="launchAngle"
                  class="block w-full rounded-md border-gray-300 pl-3 pr-12 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="1.0" min="0.1" step="0.1">
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span class="text-gray-500 sm:text-sm">deg</span>
                </div>
              </div>
            </div>

            <!-- Launch Velocity -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700">Launch Velocity (m/s)</label>
              <div class="relative rounded-md shadow-sm">
                <input type="number" v-model.number="launchVelocity" class="w-full border-gray-300 rounded-md" min="1"
                  step="0.1">
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span class="text-gray-500 sm:text-sm">m/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">

          <!-- Launch Angle -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Launch Angle (°)</label>
            <input type="number" v-model.number="launchAngle" class="w-full border-gray-300 rounded-md" min="0" max="90"
              step="1">
          </div>

          <!-- Launch Velocity -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Launch Velocity (m/s)</label>
            <input type="number" v-model.number="launchVelocity" class="w-full border-gray-300 rounded-md" min="1"
              step="0.1">
          </div>

          <!-- Initial Height -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Initial Height (m)</label>
            <input type="number" v-model.number="initialHeight" class="w-full border-gray-300 rounded-md" min="0"
              step="0.1">
          </div>

          <!-- Gravity Multiplier -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Gravity Multiplier</label>
            <input type="number" v-model.number="gravityMultiplier" class="w-full border-gray-300 rounded-md" min="0.1"
              step="0.1">
          </div>

          <!-- Start Button -->
          <button @click="startSimulation"
            class="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all">
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
