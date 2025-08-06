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
    simulate()
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
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl" ref="previewRef">
        <h2 class="text-xl font-bold mb-4 text-center">Pendulum Swing Simulation</h2>
        <div class="relative w-full h-[400px] border border-gray-300 rounded bg-gray-50 overflow-hidden">
          <!-- String -->
          <div class="absolute bg-black" :style="stringStyle"></div>
          <!-- Bob -->
          <div class="absolute border-2 bg-blue-500 rounded-full" :style="bobStyle"></div>
        </div>

        <div class="mt-4">
          <div class="grid">
            <div class="bg-gray-100 p-2 rounded">
              <div class="text-sm font-semibold text-gray-600">Period</div>
              <div class="text-lg">{{ period.toFixed(2) }} s</div>
            </div>
          </div>

          <div class="grid gap-3">
          </div>
          <div class="bg-gray-100 p-2 rounded">
            <div class="text-sm font-semibold text-gray-600">Period</div>
            <div class="text-lg">{{ period.toFixed(2) }} s</div>
          </div>
        </div>

        <div class="mt-4">
          <div class="flex justify-between">
            <span class="font-semibold">Period</span>
            <span>{{ period.toFixed(2) }}s</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Angular Velocity</span>
            <span>{{ angularVelocity.toFixed(2) }} rad/s</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Linear Velocity</span>
            <span>{{ linearVelocity.toFixed(2) }} m/s</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Max Linear Velocity</span>
            <span>{{ maxLinearVelocity.toFixed(2) }} m/s</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Potential Energy</span>
            <span>{{ potentialEnergy.toFixed(2) }} J</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Kinetic Energy</span>
            <span>{{ kineticEnergy.toFixed(2) }} J</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Total Energy</span>
            <span>{{ totalEnergy.toFixed(2) }} J</span>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4">Configuration</h2>
        <div class="grid gap-4">
          <div>
            <label>Length (px)</label>
            <input type="range" v-model.number="length" min="50" max="300" step="1" class="w-full" />
            <span>{{ length }} px</span>
          </div>
          <div>
            <label>Mass (kg)</label>
            <input type="range" v-model.number="mass" min="0.5" max="10" step="0.1" class="w-full" />
            <span>{{ mass }} kg</span>
          </div>
          <div>
            <label>Gravity (m/s²)</label>
            <input type="range" v-model.number="gravity" min="1" max="20" step="0.1" class="w-full" />
            <span>{{ gravity }} m/s²</span>
          </div>
          <div>
            <label>Initial Angle (°)</label>
            <input type="range" v-model.number="initialAngle" @input="updateAnglePreview" min="-90" max="90" step="1"
              class="w-full" />
            <span>{{ initialAngle }}°</span>
          </div>
          <div>
            <label>Damping</label>
            <input type="range" v-model.number="damping" min="0" max="0.01" step="0.0001" class="w-full" />
            <span>{{ damping.toFixed(4) }}</span>
          </div>
          <div class="flex gap-2">
            <button @click="startSwing"
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">Start</button>
            <button @click="stopSwing"
              class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full">Stop</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
