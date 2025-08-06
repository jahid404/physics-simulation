<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from "vue"

  // Simulation parameters
  const length = ref(200) // px
  const mass = ref(1) // kg
  const gravity = ref(9.8) // m/s²
  const initialAngle = ref(30) // degrees from vertical
  const damping = ref(0.002) // friction/damping factor

  // State
  const angle = ref(initialAngle.value * (Math.PI / 180)) // radians
  const angularVelocity = ref(0) // rad/s
  const isSwinging = ref(false)
  let animationFrame: number
  let lastTime = 0

  // Preview size
  const previewRef = ref<HTMLElement | null>(null)
  const previewWidth = ref(400)
  const pivotX = computed(() => previewWidth.value / 2)

  // Bob position
  const bobX = computed(() => pivotX.value + length.value * Math.sin(angle.value))
  const bobY = computed(() => length.value * Math.cos(angle.value))

  // Styles
  const stringStyle = computed(() => ({
    position: "absolute",
    top: "0px",
    left: `${pivotX.value}px`,
    width: "2px",
    height: `${length.value}px`,
    backgroundColor: "#444",
    transformOrigin: "top",
    transform: `rotate(${angle.value}rad)`
  }))

  const bobStyle = computed(() => ({
    position: "absolute",
    top: `${bobY.value}px`,
    left: `${bobX.value - 15}px`,
    width: "30px",
    height: "30px",
    backgroundColor: "orange",
    borderRadius: "50%",
    border: "2px solid #b45309"
  }))

  // Update preview width
  const updatePreviewWidth = () => {
    if (previewRef.value) {
      previewWidth.value = previewRef.value.clientWidth
    }
  }

  // Physics simulation
  const simulate = () => {
    if (!isSwinging.value) return

    const now = performance.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    if (dt > 0.1) {
      animationFrame = requestAnimationFrame(simulate)
      return
    }

    // Angular acceleration (non-linear equation of motion)
    const angularAcceleration = -(gravity.value / 100) / (length.value / 100) * Math.sin(angle.value) - damping.value * angularVelocity.value

    angularVelocity.value += angularAcceleration * dt
    angle.value += angularVelocity.value * dt

    animationFrame = requestAnimationFrame(simulate)
  }

  // Start swinging
  const startSwing = () => {
    cancelAnimationFrame(animationFrame)
    angle.value = initialAngle.value * (Math.PI / 180)
    angularVelocity.value = 0
    isSwinging.value = true
    lastTime = performance.now()
    simulate()
  }

  // Stop swinging
  const stopSwing = () => {
    isSwinging.value = false
    cancelAnimationFrame(animationFrame)
  }

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
          <!-- String -->
          <div :style="stringStyle"></div>
          <!-- Bob -->
          <div :style="bobStyle"></div>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>
        <div class="grid gap-4">
          <div>
            <label class="block font-medium mb-1">Length (px)</label>
            <input type="range" v-model.number="length" min="50" max="300" step="1" class="w-full" />
            <span>{{ length }} px</span>
          </div>
          <div>
            <label class="block font-medium mb-1">Mass (kg)</label>
            <input type="range" v-model.number="mass" min="0.5" max="10" step="0.1" class="w-full" />
            <span>{{ mass }} kg</span>
          </div>
          <div>
            <label class="block font-medium mb-1">Gravity (m/s²)</label>
            <input type="range" v-model.number="gravity" min="1" max="20" step="0.1" class="w-full" />
            <span>{{ gravity }} m/s²</span>
          </div>
          <div>
            <label class="block font-medium mb-1">Initial Angle (°)</label>
            <input type="range" v-model.number="initialAngle" min="-90" max="90" step="1" class="w-full" />
            <span>{{ initialAngle }}°</span>
          </div>
          <div>
            <label class="block font-medium mb-1">Damping</label>
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
