<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from "vue"

  // --- Simulation parameters ---
  const length = ref(200) // px
  const mass = ref(1) // kg
  const gravity = ref(9.81) // m/s²
  const initialAngle = ref(-30) // degrees
  const damping = ref(0.002) // damping factor

  // --- State ---
  const angle = ref(initialAngle.value * (Math.PI / 180)) // radians
  const angularVelocity = ref(0) // rad/s
  const isSwinging = ref(false)
  let animationFrame: number
  let lastTime = 0

  // --- Preview area ---
  const previewRef = ref<HTMLElement | null>(null)
  const previewWidth = ref(400)
  const pivotX = computed(() => previewWidth.value / 2)
  const pivotY = 50 // fixed pivot height in px

  // --- Styles ---
  const stringStyle = computed(() => ({
    top: `${pivotY}px`,
    left: `${pivotX.value}px`,
    width: "2px",
    height: `${length.value}px`,
    background: "black",
    transformOrigin: "top",
    transform: `rotate(${angle.value}rad)`
  }))

  const bobStyle = computed(() => {
    const bobDiameter = 30
    const offsetX = -Math.sin(angle.value) * length.value
    const offsetY = Math.cos(angle.value) * length.value
    return {
      top: `${pivotY + offsetY - bobDiameter / 2}px`,
      left: `${pivotX.value + offsetX - bobDiameter / 2}px`,
      width: `${bobDiameter}px`,
      height: `${bobDiameter}px`,
    }
  })

  // --- Physics helpers ---
  const lengthMeters = computed(() => length.value / 100) // px → meters

  // Instantaneous tangential velocity (m/s)
  const linearVelocity = computed(() => Math.abs(angularVelocity.value) * lengthMeters.value)

  // Theoretical max velocity (from energy conservation)
  const maxLinearVelocity = computed(() => {
    const h = lengthMeters.value - lengthMeters.value * Math.cos(initialAngle.value * Math.PI / 180)
    return Math.sqrt(2 * gravity.value * h)
  })

  // Estimated time to stop
  const stopThreshold = 1 * (Math.PI / 180) // 1 degree in radians
  const estimatedTimeToStop = ref<number | null>(null)

  const calculateEstimatedTimeToStop = () => {
    if (damping.value <= 0) {
      estimatedTimeToStop.value = Infinity
      return
    }
    estimatedTimeToStop.value =
      Math.log(Math.abs(initialAngle.value * Math.PI / 180) / stopThreshold) / damping.value
  }


  // Period (large-angle correction for realism)
  const period = computed(() => {
    const theta0 = Math.abs(initialAngle.value) * (Math.PI / 180)
    // Simple small-angle: T = 2π√(L/g)
    let T = 2 * Math.PI * Math.sqrt(lengthMeters.value / gravity.value)
    // Large-angle correction (series expansion)
    if (theta0 > 0.1) {
      T *= 1 + (theta0 ** 2) / 16 + (11 * theta0 ** 4) / 3072
    }
    return T
  })

  // Energies
  const heightChange = computed(() => lengthMeters.value - lengthMeters.value * Math.cos(angle.value))
  const potentialEnergy = computed(() => mass.value * gravity.value * heightChange.value)
  const kineticEnergy = computed(() => 0.5 * mass.value * Math.pow(linearVelocity.value, 2))
  const totalEnergy = computed(() => potentialEnergy.value + kineticEnergy.value)

  // --- Resize handler ---
  const updatePreviewWidth = () => {
    if (previewRef.value) previewWidth.value = previewRef.value.clientWidth
  }

  // --- Angle preview when slider changes ---
  const updateAnglePreview = () => {
    if (!isSwinging.value) {
      angle.value = initialAngle.value * (Math.PI / 180)
      angularVelocity.value = 0
    }
  }

  // --- Simulation loop ---
  const simulate = () => {
    if (!isSwinging.value) return
    const now = performance.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    if (dt > 0.05) { // prevent jumps on lag
      animationFrame = requestAnimationFrame(simulate)
      return
    }

    // Angular acceleration (θ'' = -g/L * sinθ) with damping
    const angularAcceleration =
      -(gravity.value / lengthMeters.value) * Math.sin(angle.value) -
      damping.value * angularVelocity.value

    // Update velocity & position
    angularVelocity.value += angularAcceleration * dt
    angle.value += angularVelocity.value * dt

    animationFrame = requestAnimationFrame(simulate)
  }

  // --- Controls ---
  const startSwing = () => {
    cancelAnimationFrame(animationFrame)
    angle.value = initialAngle.value * (Math.PI / 180)
    angularVelocity.value = 0
    isSwinging.value = true
    lastTime = performance.now()

    calculateEstimatedTimeToStop()
    simulate()
  }

  const stopSwing = () => {
    isSwinging.value = false
    cancelAnimationFrame(animationFrame)
  }

  // --- Lifecycle ---
  onMounted(() => {
    updatePreviewWidth()
    calculateEstimatedTimeToStop()

    window.addEventListener("resize", updatePreviewWidth)
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
    window.removeEventListener("resize", updatePreviewWidth)
  })
</script>


<template>
  <div class="flex items-center justify-center bg-gray-100">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">

      <!-- Simulation Preview -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl" ref="previewRef">
        <h2 class="text-xl font-bold mb-4 text-center">Pendulum Swing Simulation</h2>
        <div class="relative w-full h-[400px] border border-gray-300 rounded bg-gray-50 overflow-hidden">
          <!-- String -->
          <div class="absolute bg-black" :style="stringStyle"></div>
          <!-- Bob -->
          <div class="absolute border-1 bg-blue-500 rounded-full" :style="bobStyle"></div>
        </div>

        <div class="mt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="bg-gray-100 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Period</div>
              <div class="text-lg">{{ period.toFixed(2) }} s</div>
            </div>
            <div class="bg-gray-100 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Est. Time to Stop</div>
              <div class="text-lg">
                {{ estimatedTimeToStop === Infinity ? "∞" : estimatedTimeToStop?.toFixed(2) + " s" }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <div class="bg-blue-50 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Angular Velocity</div>
              <div class="text-lg">{{ angularVelocity.toFixed(2) }} s</div>
            </div>
            <div class="bg-blue-50 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Linear Velocity</div>
              <div class="text-lg">{{ linearVelocity.toFixed(2) }} m/s</div>
            </div>
            <div class="bg-blue-50 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Max Linear Velocity</div>
              <div class="text-lg">{{ maxLinearVelocity.toFixed(2) }} m/s</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <div class="bg-green-50 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Potential Energy</div>
              <div class="text-lg">{{ potentialEnergy.toFixed(2) }} J</div>
            </div>
            <div class="bg-green-50 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Kinetic Energy</div>
              <div class="text-lg">{{ kineticEnergy.toFixed(2) }} J</div>
            </div>
            <div class="bg-green-50 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Total Energy</div>
              <div class="text-lg">{{ totalEnergy.toFixed(2) }} J</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4">Configuration</h2>
        <div class="space-y-6">
          <!-- Length Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Length</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ length }}px ({{ lengthMeters.toFixed(2) }}m)
              </span>
            </div>
            <input type="range" v-model.number="length" min="50" max="300" step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>50px</span>
              <span>300px</span>
            </div>
          </div>

          <!-- Mass Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Mass</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ mass }} kg
              </span>
            </div>
            <input type="range" v-model.number="mass" min="0.1" max="10" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1kg</span>
              <span>10kg</span>
            </div>
          </div>

          <!-- Gravity Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Gravity</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ gravity }} m/s²
              </span>
            </div>
            <input type="range" v-model.number="gravity" min="1" max="20" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>1m/s²</span>
              <span>20m/s²</span>
            </div>
          </div>

          <!-- Angle Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Initial Angle</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ initialAngle }}°
              </span>
            </div>
            <input type="range" v-model.number="initialAngle" @input="updateAnglePreview" min="-90" max="90" step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>-90°</span>
              <span>90°</span>
            </div>
          </div>

          <!-- Damping Slider -->
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Damping</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {{ damping.toFixed(2) }}
              </span>
            </div>
            <input type="range" v-model.number="damping" @input="calculateEstimatedTimeToStop" min="0" max="1"
              step="0.01"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>1</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-2">
            <button @click="startSwing"
              class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150 flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clip-rule="evenodd" />
              </svg>
              Start
            </button>
            <button @click="stopSwing"
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
