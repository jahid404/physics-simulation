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
  const initialDistance = ref(300) // px (scaled distance)
  const initialVelocity = ref(0) // m/s (for each body)

  // Simulation state
  const pos1X = ref(0)
  const pos2X = ref(0)
  const vel1X = ref(initialVelocity.value)
  const vel2X = ref(-initialVelocity.value)
  const isRunning = ref(false)
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

  // Preview area width (dynamic)
  const previewRef = ref<HTMLElement | null>(null)
  const previewWidth = ref(600)

  const updatePreviewWidth = () => {
    if (previewRef.value) {
      previewWidth.value = previewRef.value.clientWidth
    }
  }

  // Start simulation
  const startSimulation = () => {
    cancelAnimationFrame(animationFrame)
    updatePreviewWidth()

    // Initial positions
    pos1X.value = previewWidth.value / 2 - initialDistance.value / 2 - radius1.value
    pos2X.value = previewWidth.value / 2 + initialDistance.value / 2 - radius2.value

    // Initial velocities (m/s)
    vel1X.value = initialVelocity.value
    vel2X.value = -initialVelocity.value

    lastTime = performance.now()
    isRunning.value = true
    simulate()
  }

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
    if (rMeters <= (radius1.value + radius2.value) * pxToM) {
      console.log('Collision detected')
      isRunning.value = false
      return
    }

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
    window.addEventListener('resize', updatePreviewWidth)
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
    window.removeEventListener('resize', updatePreviewWidth)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100 p-4">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">
      <!-- Simulation Preview -->
      <div class="flex-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Two-Body Gravity Simulation</h2>
        <div ref="previewRef"
          class="relative w-full h-[200px] bg-gray-50 border border-gray-300 rounded overflow-hidden flex items-center">
          <div class="absolute" :style="body1Style"></div>
          <div class="absolute" :style="body2Style"></div>
        </div>

        <div class="mt-4">
          <div class="flex justify-between">
            <span class="text-md font-semibold">Distance</span>
            <span class="text-md font-medium">{{ (distanceMeters / 1000).toFixed(2) }} km</span>
          </div>
          <div class="flex justify-between">
            <span class="text-md font-semibold">Force</span>
            <span class="text-md font-medium">{{ gravitationalForce.toExponential(2) }} N</span>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full md:w-[350px] p-4 bg-white rounded-xl shadow-xl">
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
            <label>Initial Distance (px)</label>
            <input type="range" v-model.number="initialDistance" min="100" max="600" step="10" class="w-full" />
            <span class="text-sm text-gray-600">{{ initialDistance }} px</span>
          </div>
          <div>
            <label>Gravity Multiplier</label>
            <input type="number" v-model.number="gravityMultiplier" class="w-full border rounded p-1" />
          </div>
          <div>
            <label>Initial Velocity (m/s)</label>
            <input type="number" v-model.number="initialVelocity" class="w-full border rounded p-1" />
          </div>
          <button @click="startSimulation" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
