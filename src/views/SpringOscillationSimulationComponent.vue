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
            bottom: `${equilibriumPosition + position * pxPerMeter - 20}px`,
            transform: 'translateX(-50%)'
          }">
            <div class="absolute -top-4 left-1/2 w-6 h-6 bg-gray-300 rounded-full border-2 border-gray-400"
              :style="{ transform: 'translateX(-50%)' }"></div>
          </div>

          <!-- Mass visualization -->
          <div
            class="absolute left-1/2 w-10 h-10 flex items-center bg-blue-500 rounded-lg shadow-md border-2 border-blue-600"
            :style="{
              top: `${equilibriumPosition - position * pxPerMeter}px`,
              transform: 'translateX(-50%) translateY(50%)'
            }">
            <div class="text-white text-center font-semibold text-xs">{{ mass }} kg</div>
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
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Natural Frequency</span>
              <span class="text-lg font-semibold">{{ naturalFrequency.toFixed(2) }} <span
                  class="text-sm font-normal text-gray-400">rad/s</span></span>
            </div>
          </div>

          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Damping Ratio</span>
              <span class="text-lg font-semibold" :class="{
                'text-green-500': isUnderdamped,
                'text-yellow-500': isCriticallyDamped,
                'text-red-500': isOverdamped
              }">
                {{ dampingRatio.toFixed(3) }}
              </span>
            </div>
          </div>

          <div class="bg-blue-50 p-3 rounded-lg shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Period</span>
              <span class="text-lg font-semibold">{{ period.toFixed(3) }} <span
                  class="text-sm font-normal text-gray-400">s</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4">Configuration</h2>

        <div class="space-y-4">
          <!-- Mass -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Mass</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ mass }} kg
              </span>
            </div>
            <input type="range" v-model.number="mass" min="0.1" max="10" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1 kg</span>
              <span>10 kg</span>
            </div>
          </div>

          <!-- Spring Constant -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Spring Constant</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ springConstant }} N/m
              </span>
            </div>
            <input type="range" v-model.number="springConstant" min="1" max="500" step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 N/m</span>
              <span>500 N/m</span>
            </div>
          </div>

          <!-- Damping Coefficient -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Damping</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ dampingCoefficient }} N·s/m
              </span>
            </div>
            <input type="range" v-model.number="dampingCoefficient" min="0" max="50" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 N·s/m</span>
              <span>50 N·s/m</span>
            </div>
          </div>

          <!-- Initial Displacement -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Initial Displacement</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ initialDisplacement }} m
              </span>
            </div>
            <input type="range" v-model.number="initialDisplacement" min="-1" max="1" step="0.01"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>-1 m</span>
              <span>1 m</span>
            </div>
          </div>

          <!-- Simulation Speed -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Simulation Speed</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ gravityMultiplier }}×
              </span>
            </div>
            <input type="range" v-model.number="gravityMultiplier" min="0.1" max="3" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1×</span>
              <span>3×</span>
            </div>
          </div>

          <!-- Control Buttons -->
          <div class="flex gap-3 pt-2">
            <button @click="startSimulation"
              class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150 flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clip-rule="evenodd" />
              </svg>
              Start
            </button>
            <button @click="stopSimulation"
              class="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg shadow-sm hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-150 flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                  clip-rule="evenodd" />
              </svg>
              Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>