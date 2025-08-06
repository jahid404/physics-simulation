<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  // Physics constants
  const G = 6.67430e-11 // Gravitational constant (m³·kg⁻¹·s⁻²)
  const pxToM = 1e6      // Scale: 1px = 1,000,000 meters (1,000 km)
  const mToPx = 1 / pxToM

  // Configurable simulation parameters
  const mass1 = ref(5.97e24) // Earth mass (kg)
  const mass2 = ref(7.35e22) // Moon mass (kg)
  const radius1 = ref(30)    // px
  const radius2 = ref(15)    // px
  const gravityMultiplier = ref(5e7) // Boost factor for visual speed
  const initialVelocity = ref(0) // m/s (for each body)
  const initialDistance = ref(300) // px (scaled distance)
  const distanceMin = ref(100)
  const distanceMax = ref(600)

  // Simulation state
  const pos1X = ref(0)
  const pos2X = ref(0)
  const vel1X = ref(initialVelocity.value)
  const vel2X = ref(-initialVelocity.value)
  const isRunning = ref(false)
  const collisionTime = ref<number | null>(null) // seconds
  let startTime = 0

  let animationFrame: number
  let lastTime = 0

  // Distance in meters (computed each frame)
  const distanceMeters = computed(() => Math.abs(pos2X.value - pos1X.value) * pxToM)

  // Force in Newtons
  const gravitationalForce = computed(() => {
    const r = distanceMeters.value
    if (r <= 0) return 0
    return G * mass1.value * mass2.value / (r * r)
  })

  // Body styles
  const body1Style = computed(() => ({
    width: `${radius1.value * 2}px`,
    height: `${radius1.value * 2}px`,
    transform: `translateX(${pos1X.value}px)`,
    backgroundColor: 'blue',
    borderRadius: '50%'
  }))

  const body2Style = computed(() => ({
    width: `${radius2.value * 2}px`,
    height: `${radius2.value * 2}px`,
    transform: `translateX(${pos2X.value}px)`,
    backgroundColor: 'orange',
    borderRadius: '50%'
  }))

  // Preview box width (dynamic)
  const previewRef = ref<HTMLElement | null>(null)
  const previewWidth = ref(600)

  const updatePreviewWidth = () => {
    if (previewRef.value) {
      previewWidth.value = previewRef.value.clientWidth

      // Dynamic range based on screen size
      distanceMin.value = previewWidth.value * 0.1
      distanceMax.value = previewWidth.value * 0.8

      // If current distance is out of range after resize, clamp it
      if (initialDistance.value < distanceMin.value) {
        initialDistance.value = distanceMin.value
      } else if (initialDistance.value > distanceMax.value) {
        initialDistance.value = distanceMax.value
      }

      setInitialPositions()
    }
  }

  // Position bodies based on current width
  const setInitialPositions = () => {
    pos1X.value = previewWidth.value / 2 - initialDistance.value / 2 - radius1.value
    pos2X.value = previewWidth.value / 2 + initialDistance.value / 2 - radius2.value
  }

  // Start simulation
  const startSimulation = () => {
    cancelAnimationFrame(animationFrame)
    updatePreviewWidth()

    // Initial velocities (m/s)
    vel1X.value = initialVelocity.value
    vel2X.value = -initialVelocity.value

    lastTime = performance.now()
    isRunning.value = true

    collisionTime.value = null
    startTime = performance.now()

    simulate()
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0 s"

    const years = Math.floor(seconds / (365 * 24 * 3600))
    seconds %= (365 * 24 * 3600)

    const months = Math.floor(seconds / (30 * 24 * 3600))
    seconds %= (30 * 24 * 3600)

    const days = Math.floor(seconds / (24 * 3600))
    seconds %= (24 * 3600)

    const hours = Math.floor(seconds / 3600)
    seconds %= 3600

    const minutes = Math.floor(seconds / 60)
    seconds = Math.floor(seconds % 60)

    const parts = []
    if (years) parts.push(`${years}y`)
    if (months) parts.push(`${months}m`)
    if (days) parts.push(`${days}d`)
    if (hours) parts.push(`${hours}h`)
    if (minutes) parts.push(`${minutes}min`)
    if (seconds) parts.push(`${seconds}s`)

    return parts.join(" ")
  }

  const realCollisionTimeFormatted = computed(() => {
    const r0 = initialDistance.value * pxToM // px → m
    const M = mass1.value + mass2.value
    if (r0 <= 0 || M <= 0) return "0 s"

    const timeSeconds = Math.sqrt((r0 ** 3) / (2 * G * M)) * (Math.PI / 2)
    return formatTime(timeSeconds)
  })

  const simulate = () => {
    if (!isRunning.value) return

    const now = performance.now()
    const dt = (now - lastTime) / 1000 // seconds
    lastTime = now
    if (dt > 0.1) {
      animationFrame = requestAnimationFrame(simulate)
      return
    }

    const rMeters = distanceMeters.value
    if (rMeters <= ((radius1.value + radius2.value) + radius2.value) * pxToM) {
      console.log('Collision detected', radius1.value + radius2.value)
      isRunning.value = false

      const elapsed = (performance.now() - startTime) / 1000
      collisionTime.value = elapsed
      console.log(`Collision time: ${elapsed.toFixed(2)} seconds`)

      return
    }

    // Update collision time
    collisionTime.value = (performance.now() - startTime) / 1000

    // Force in Newtons
    const F = gravitationalForce.value * gravityMultiplier.value

    // Accelerations (a = F/m)
    const a1 = F / mass1.value
    const a2 = F / mass2.value

    // Directions (body1 moves right if body2 is right)
    const direction = pos2X.value > pos1X.value ? 1 : -1

    // Update velocities (m/s)
    vel1X.value += a1 * dt * direction
    vel2X.value -= a2 * dt * direction

    // Update positions (px)
    pos1X.value += vel1X.value * mToPx * dt
    pos2X.value += vel2X.value * mToPx * dt

    animationFrame = requestAnimationFrame(simulate)
  }

  onMounted(() => {
    updatePreviewWidth()
    window.addEventListener('resize', () => {
      updatePreviewWidth()
      if (!isRunning.value) setInitialPositions()
    })
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
    window.removeEventListener('resize', updatePreviewWidth)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">
      <!-- Simulation Preview -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Two-Body Gravity Simulation</h2>
        <div ref="previewRef"
          class="relative w-full h-[200px] bg-gray-50 border border-gray-300 rounded overflow-hidden flex items-center">
          <div class="absolute" :style="body1Style"></div>
          <div class="absolute" :style="body2Style"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div class="bg-green-50 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Distance</div>
            <div class="text-lg">{{ (distanceMeters / 1000).toFixed(2) }} km</div>
          </div>
          <div class="bg-green-50 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Force</div>
            <div class="text-lg">{{ gravitationalForce.toExponential(2) }} N</div>
          </div>
          <div class="bg-blue-50 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Real Collision Time</div>
            <div class="text-lg">{{ realCollisionTimeFormatted }} s</div>
          </div>
          <div class="bg-blue-50 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Time to Collision</div>
            <div class="text-lg">{{ collisionTime !== null ? collisionTime.toFixed(2) : '0.00' }} s</div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>
        <div class="grid gap-4">
          <div>
            <label>Mass 1 (kg)</label>
            <input type="number" v-model.number="mass1" class="w-full border rounded p-1" />
          </div>
          <div>
            <label>Mass 2 (kg)</label>
            <input type="number" v-model.number="mass2" class="w-full border rounded p-1" />
          </div>
          <div>
            <label>Gravity Multiplier</label>
            <input type="number" v-model.number="gravityMultiplier" class="w-full border rounded p-1" />
          </div>
          <div>
            <label>Initial Velocity (m/s)</label>
            <input type="number" v-model.number="initialVelocity" class="w-full border rounded p-1" />
          </div>
          <div>
            <label>Initial Distance (px)</label>
            <input type="range" v-model.number="initialDistance" @input="setInitialPositions" :min="distanceMin"
              :max="distanceMax" step="10" class="w-full" />
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">{{ initialDistance }} px</span>
              <span class="text-sm text-gray-600">(1px = 1,000,000 m)</span>
            </div>
          </div>
          <button @click="startSimulation" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
