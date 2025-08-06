<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from "vue"

  // --- Simulation parameters ---
  const length = ref(200) // px
  const mass = ref(1) // kg
  const gravity = ref(9.81) // m/s²
  const initialAngle = ref(-30) // degrees
  const damping = ref(0.002) // damping factor (1/s)

  // --- State ---
  const angle = ref(initialAngle.value * (Math.PI / 180)) // radians
  const angularVelocity = ref(0) // rad/s
  const isSwinging = ref(false)
  let animationFrame: number
  let lastTime = 0
  let accumulatedTime = 0
  const fixedTimeStep = 1 / 60 // 60fps physics update

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
    transform: `rotate(${angle.value}rad)`,
    position: "absolute"
  }))

  const bobStyle = computed(() => {
    const bobDiameter = 30
    const offsetX = Math.sin(angle.value) * length.value
    const offsetY = Math.cos(angle.value) * length.value
    return {
      top: `${pivotY + offsetY - bobDiameter / 2}px`,
      left: `${pivotX.value + offsetX - bobDiameter / 2}px`,
      width: `${bobDiameter}px`,
      height: `${bobDiameter}px`,
      position: "absolute",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      border: "2px solid #1d4ed8"
    }
  })

  // --- Physics helpers ---
  const lengthMeters = computed(() => length.value / 100) // px → meters (assuming 100px = 1m)

  // Instantaneous tangential velocity (m/s)
  const linearVelocity = computed(() => angularVelocity.value * lengthMeters.value)

  // Theoretical max velocity (from energy conservation)
  const maxLinearVelocity = computed(() => {
    const h = lengthMeters.value * (1 - Math.cos(initialAngle.value * Math.PI / 180))
    return Math.sqrt(2 * gravity.value * h)
  })

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
  const heightChange = computed(() => lengthMeters.value * (1 - Math.cos(angle.value)))
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
  const simulate = (timestamp: number) => {
    if (!isSwinging.value) return

    if (!lastTime) lastTime = timestamp
    const deltaTime = (timestamp - lastTime) / 1000 // Convert to seconds
    lastTime = timestamp

    // Fixed timestep physics updates
    accumulatedTime += deltaTime

    while (accumulatedTime >= fixedTimeStep) {
      // Angular acceleration (θ'' = -g/L * sinθ) with velocity damping
      const angularAcceleration =
        -(gravity.value / lengthMeters.value) * Math.sin(angle.value) -
        (damping.value * angularVelocity.value)

      // Update velocity & position using Verlet integration for better stability
      const newAngularVelocity = angularVelocity.value + angularAcceleration * fixedTimeStep
      angle.value += (angularVelocity.value + newAngularVelocity) * 0.5 * fixedTimeStep
      angularVelocity.value = newAngularVelocity

      accumulatedTime -= fixedTimeStep
    }

    animationFrame = requestAnimationFrame(simulate)
  }

  // --- Controls ---
  const startSwing = () => {
    if (isSwinging.value) return

    cancelAnimationFrame(animationFrame)
    angle.value = initialAngle.value * (Math.PI / 180)
    angularVelocity.value = 0
    isSwinging.value = true
    lastTime = 0
    accumulatedTime = 0
    animationFrame = requestAnimationFrame(simulate)
  }

  const stopSwing = () => {
    isSwinging.value = false
    cancelAnimationFrame(animationFrame)
  }

  // --- Lifecycle ---
  onMounted(() => {
    updatePreviewWidth()
    window.addEventListener("resize", updatePreviewWidth)
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
    window.removeEventListener("resize", updatePreviewWidth)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100 p-4">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">

      <!-- Simulation Preview -->
      <div class="flex-1 p-4 bg-white rounded-xl shadow-xl" ref="previewRef">
        <h2 class="text-xl font-bold mb-4 text-center">Pendulum Swing Simulation</h2>
        <div class="relative w-full h-[400px] border border-gray-300 rounded bg-gray-50 overflow-hidden">
          <!-- Pivot point -->
          <div class="absolute w-6 h-6 rounded-full bg-gray-700"
            :style="{ top: `${pivotY - 12}px`, left: `${pivotX.value - 12}px` }"></div>

          <!-- String -->
          <div :style="stringStyle"></div>

          <!-- Bob -->
          <div :style="bobStyle"></div>

          <!-- Velocity vector visualization -->
          <div v-if="isSwinging"
            class="absolute w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-16 border-b-red-500"
            :style="{
              top: `${parseInt(bobStyle.top) + 15}px`,
              left: `${parseInt(bobStyle.left) + 15}px`,
              transform: `rotate(${angle.value + (angularVelocity.value > 0 ? Math.PI / 2 : -Math.PI / 2)}rad)`,
              opacity: Math.min(1, Math.abs(angularVelocity.value) * 2)
            }"></div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="bg-gray-100 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Period</div>
            <div class="text-lg">{{ period.toFixed(2) }} s</div>
          </div>
          <div class="bg-gray-100 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Angular Velocity</div>
            <div class="text-lg">{{ angularVelocity.toFixed(2) }} rad/s</div>
          </div>
          <div class="bg-gray-100 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Linear Velocity</div>
            <div class="text-lg">{{ linearVelocity.toFixed(2) }} m/s</div>
          </div>
          <div class="bg-gray-100 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Max Velocity</div>
            <div class="text-lg">{{ maxLinearVelocity.toFixed(2) }} m/s</div>
          </div>
          <div class="bg-blue-50 p-2 rounded col-span-2">
            <div class="text-sm font-semibold text-blue-600">Potential Energy</div>
            <div class="text-lg">{{ potentialEnergy.toFixed(2) }} J</div>
            <div class="h-2 bg-blue-100 rounded-full mt-1">
              <div class="h-2 bg-blue-500 rounded-full"
                :style="{ width: `${Math.min(100, (potentialEnergy.value / (mass.value * gravity.value * lengthMeters.value * 2)) * 100}%` }">
              </div>
            </div>
          </div>
          <div class="bg-green-50 p-2 rounded col-span-2">
            <div class="text-sm font-semibold text-green-600">Kinetic Energy</div>
            <div class="text-lg">{{ kineticEnergy.toFixed(2) }} J</div>
            <div class="h-2 bg-green-100 rounded-full mt-1">
              <div class="h-2 bg-green-500 rounded-full"
                :style="{ width: `${Math.min(100, (kineticEnergy.value / (0.5 * mass.value * maxLinearVelocity.value ** 2)) * 100}%` }">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4">Configuration</h2>
        <div class="grid gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Length: {{ length }} px ({{
              lengthMeters.toFixed(2) }} m)</label>
            <input type="range" v-model.number="length" min="50" max="300" step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mass: {{ mass }} kg</label>
            <input type="range" v-model.number="mass" min="0.1" max="10" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Gravity: {{ gravity }} m/s²</label>
            <input type="range" v-model.number="gravity" min="1" max="20" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Initial Angle: {{ initialAngle }}°</label>
            <input type="range" v-model.number="initialAngle" @input="updateAnglePreview" min="-90" max="90" step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Damping: {{ damping.toFixed(4) }}</label>
            <input type="range" v-model.number="damping" min="0" max="0.01" step="0.0001"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          </div>
          <div class="flex gap-2 pt-2">
            <button @click="startSwing" :disabled="isSwinging"
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
              <span v-if="!isSwinging">Start</span>
              <span v-else>Swinging...</span>
            </button>
            <button @click="stopSwing" :disabled="!isSwinging"
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-300 transition-colors">
              Stop
            </button>
          </div>

          <div class="pt-4 border-t border-gray-200">
            <h3 class="font-medium mb-2">Physics Notes:</h3>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Period: T ≈ 2π√(L/g)</li>
              <li>• Max velocity: v = √(2gh)</li>
              <li>• Damping slows motion over time</li>
              <li>• Energy converts between potential and kinetic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>