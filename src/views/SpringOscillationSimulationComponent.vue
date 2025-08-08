<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  // Physics constants
  const g = 9.81 // m/s²
  const pxPerMeter = 50 // Pixels per meter

  // Configurable parameters
  const mass = ref(1) // kg
  const springConstant = ref(100) // N/m
  const dampingCoefficient = ref(5) // N·s/m
  const initialDisplacement = ref(0.5) // m
  const gravityMultiplier = ref(1) // Simulation speed

  // Simulation state
  const position = ref(0)
  const velocity = ref(0)
  const acceleration = ref(0)
  const time = ref(0)
  const isRunning = ref(false)
  const equilibriumPosition = ref(0)
  const pathPoints = ref<{ t: number, y: number }[]>([])
  let animationFrameId: number
  let lastTimestamp = 0

  // Canvas dimensions
  const canvasRef = ref<HTMLElement | null>(null)
  const canvasWidth = ref(800)
  const canvasHeight = ref(500)

  // Natural frequency and period
  const naturalFrequency = computed(() => Math.sqrt(springConstant.value / mass.value))
  const dampingRatio = computed(() => dampingCoefficient.value / (2 * Math.sqrt(mass.value * springConstant.value)))
  const period = computed(() => 2 * Math.PI / naturalFrequency.value)
  const isUnderdamped = computed(() => dampingRatio.value < 1)
  const isCriticallyDamped = computed(() => Math.abs(dampingRatio.value - 1) < 0.01)
  const isOverdamped = computed(() => dampingRatio.value > 1)

  // Update canvas dimensions
  const updateCanvasSize = () => {
    if (canvasRef.value) {
      canvasWidth.value = canvasRef.value.clientWidth
      canvasHeight.value = canvasRef.value.clientHeight
      equilibriumPosition.value = canvasHeight.value / 2
    }
  }

  // Start/stop simulation
  const toggleSimulation = () => {
    if (isRunning.value) {
      stopSimulation()
    } else {
      startSimulation()
    }
  }

  const startSimulation = () => {
    if (isRunning.value) return

    // Reset state
    time.value = 0
    position.value = initialDisplacement.value
    velocity.value = 0
    acceleration.value = 0
    pathPoints.value = []
    isRunning.value = true
    lastTimestamp = performance.now()

    // Add initial point
    pathPoints.value.push({
      t: time.value,
      y: position.value
    })

    animationFrameId = requestAnimationFrame(updateSimulation)
  }

  const stopSimulation = () => {
    isRunning.value = false
    cancelAnimationFrame(animationFrameId)
  }

  // Main simulation update
  const updateSimulation = (timestamp: number) => {
    if (!isRunning.value) return

    // Calculate delta time (in seconds)
    const deltaTime = (timestamp - lastTimestamp) / 1000 * gravityMultiplier.value
    lastTimestamp = timestamp
    time.value += deltaTime

    // Calculate spring force (Hooke's Law)
    const springForce = -springConstant.value * position.value

    // Calculate damping force
    const dampingForce = -dampingCoefficient.value * velocity.value

    // Calculate acceleration (Newton's Second Law)
    acceleration.value = (springForce + dampingForce) / mass.value

    // Update velocity (Euler integration)
    velocity.value += acceleration.value * deltaTime

    // Update position (Euler integration)
    position.value += velocity.value * deltaTime

    // Add point to path (with some optimization)
    if (pathPoints.value.length < 2 ||
      time.value - pathPoints.value[pathPoints.value.length - 1].t > 0.016) {
      pathPoints.value.push({
        t: time.value,
        y: position.value
      })
    }

    // Continue animation
    animationFrameId = requestAnimationFrame(updateSimulation)
  }

  // Lifecycle hooks
  onMounted(() => {
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
  })

  onUnmounted(() => {
    stopSimulation()
    window.removeEventListener('resize', updateCanvasSize)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100 min-h-screen p-4">
    <div class="flex flex-col md:flex-row gap-6 w-full max-w-6xl">

      <!-- Simulation Canvas -->
      <div class="flex-1 order-2 md:order-1 bg-white rounded-xl shadow-xl p-4">
        <h2 class="text-xl font-bold mb-4 text-center">Spring-Mass Oscillator</h2>

        <div ref="canvasRef"
          class="relative w-full h-[400px] bg-gray-50 border border-gray-300 rounded overflow-hidden">
          <!-- Equilibrium line -->
          <div class="absolute left-0 right-0 h-px bg-blue-500" :style="{ top: `${equilibriumPosition}px` }"></div>

          <!-- Spring visualization -->
          <div class="absolute left-1/2 w-1 bg-gray-400" :style="{
            top: '20px',
            bottom: `${equilibriumPosition - position * pxPerMeter - 25}px`,
            transform: 'translateX(-50%)'
          }">
            <div class="absolute -top-4 left-1/2 w-8 h-8 bg-gray-300 rounded-full border-2 border-gray-400"
              :style="{ transform: 'translateX(-50%)' }"></div>
          </div>

          <!-- Mass visualization -->
          <div class="absolute left-1/2 w-10 h-10 bg-amber-500 rounded-lg shadow-md border-2 border-amber-600" :style="{
            top: `${equilibriumPosition - position * pxPerMeter}px`,
            transform: 'translateX(-50%)'
          }">
            <div class="text-white text-center mt-4 font-bold text-xs">{{ mass }} kg</div>
          </div>

          <!-- Path visualization -->
          <svg class="absolute inset-0 w-full h-full">
            <polyline
              :points="pathPoints.map(p => `${canvasWidth * p.t / 10},${equilibriumPosition - p.y * pxPerMeter}`).join(' ')"
              fill="none" stroke="purple" stroke-width="2" />
          </svg>
        </div>

        <!-- System Info -->
        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <span class="text-sm text-gray-600">Natural Frequency</span>
            <div class="text-lg font-semibold">{{ naturalFrequency.toFixed(2) }} rad/s</div>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <span class="text-sm text-gray-600">Damping Ratio</span>
            <div class="text-lg font-semibold">
              {{ dampingRatio.toFixed(3) }}
              <span class="text-sm ml-1">
                ({{ isUnderdamped ? 'Underdamped' : isCriticallyDamped ? 'Critically Damped' : 'Overdamped' }})
              </span>
            </div>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <span class="text-sm text-gray-600">Period</span>
            <div class="text-lg font-semibold">{{ period.toFixed(3) }} s</div>
          </div>
        </div>
      </div>

      <!-- Controls Panel -->
      <div class="w-full order-1 md:order-2 md:w-80 bg-white rounded-xl shadow-xl p-4">
        <h2 class="text-xl font-semibold mb-4">Controls</h2>

        <div class="space-y-4">
          <!-- Mass -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">Mass (kg)</label>
            <input type="range" v-model.number="mass" min="0.1" max="10" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <div class="text-xs text-gray-600">{{ mass }} kg</div>
          </div>

          <!-- Spring Constant -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">Spring Constant (N/m)</label>
            <input type="range" v-model.number="springConstant" min="1" max="500" step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <div class="text-xs text-gray-600">{{ springConstant }} N/m</div>
          </div>

          <!-- Damping Coefficient -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">Damping (N·s/m)</label>
            <input type="range" v-model.number="dampingCoefficient" min="0" max="50" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <div class="text-xs text-gray-600">{{ dampingCoefficient }} N·s/m</div>
          </div>

          <!-- Initial Displacement -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">Initial Displacement (m)</label>
            <input type="range" v-model.number="initialDisplacement" min="-1" max="1" step="0.01"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <div class="text-xs text-gray-600">{{ initialDisplacement }} m</div>
          </div>

          <!-- Simulation Speed -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">Simulation Speed</label>
            <input type="range" v-model.number="gravityMultiplier" min="0.1" max="3" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <div class="text-xs text-gray-600">{{ gravityMultiplier }}×</div>
          </div>

          <!-- Control Buttons -->
          <button @click="toggleSimulation"
            class="w-full px-4 py-2 mt-4 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path v-if="!isRunning" fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clip-rule="evenodd" />
              <path v-else fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd" />
            </svg>
            {{ isRunning ? 'Stop' : 'Start' }} Simulation
          </button>

          <button @click="startSimulation" v-if="isRunning"
            class="w-full px-4 py-2 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg shadow-md hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clip-rule="evenodd" />
            </svg>
            Restart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>