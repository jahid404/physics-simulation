<script lang="ts" setup>
  import { ref, computed, onUnmounted } from 'vue'

  const weight = ref(1) // kg
  const gravity = ref(9.8) // m/s^2
  const objectSize = ref(40) // px
  const airDensity = ref(1.225) // kg/m^3
  const dragCoefficient = ref(0.47)

  // convert pixels to meters (assuming 100px = 1m for simulation)
  const pxToM = 0.01
  const mToPx = 100

  const ballY = ref(0)
  const velocity = ref(0)
  const restitution = 0.8
  const isDropping = ref(false)
  const maxDrop = 393.5 // px (~3.935m)
  let animationFrame: number

  let lastLogTime = 0
  const logInterval = 100 // ms

  const ballStyle = computed(() => ({
    width: `${objectSize.value}px`,
    height: `${objectSize.value}px`,
    transform: `translateY(${ballY.value}px)`
  }))

  const currentHeight = computed(() => {
    const centerY = ballY.value + (objectSize.value / 2)
    return (maxDrop - centerY) * pxToM
  })

  const logCurrentHeight = (timestamp: number) => {
    if (timestamp - lastLogTime > logInterval) {
      console.log(`Current height: ${currentHeight.value.toFixed(2)}m`)
      lastLogTime = timestamp
    }
  }

  const startDrop = () => {
    cancelAnimationFrame(animationFrame)
    ballY.value = 0
    velocity.value = 0
    isDropping.value = true

    lastLogTime = 0
    console.log('Drop started from height:', currentHeight.value.toFixed(2), 'm')

    simulate()
  }

  const simulate = (timestamp?: number) => {
    if (!isDropping.value) return

    const dt = 0.016 // frame time ~60fps

    // calculate forces
    const gForce = gravity.value * weight.value

    // calculate air resistance (drag force)
    // F_drag = 0.5 * ρ * v² * C_d * A
    const velocityInMs = velocity.value * pxToM // convert px/s to m/s
    const crossSectionArea = Math.PI * Math.pow((objectSize.value * pxToM / 2), 2) // m²
    const dragForce = 0.5 * airDensity.value * Math.pow(velocityInMs, 2) *
      dragCoefficient.value * crossSectionArea

    // determine direction of drag force (always opposes motion)
    const dragDirection = Math.sign(velocityInMs) * -1

    // total force (gravity + drag)
    const totalForce = gForce + (dragForce * dragDirection)

    // update velocity: v = u + a * t (a = F/m)
    velocity.value += (totalForce / weight.value) * dt * mToPx

    // update position: s = s + v * dt
    ballY.value += velocity.value * dt

    // Log current height at intervals
    if (timestamp) {
      logCurrentHeight(timestamp)
    }

    // check for ground collision
    const maxY = maxDrop - objectSize.value
    if (ballY.value >= maxY) {
      ballY.value = maxY

      // apply coefficient of restitution (energy loss on bounce)
      velocity.value = -velocity.value * restitution

      // log impact
      console.log(`Impact at ${timestamp}ms, rebounding to ${(velocity.value * pxToM).toFixed(2)} m/s`)

      // stop simulation if velocity becomes negligible
      if (Math.abs(velocity.value) < 0.5 * mToPx) { // ~0.5 m/s threshold
        isDropping.value = false
        velocity.value = 0

        console.log('Object came to rest at height:', currentHeight.value.toFixed(2), 'm')
        return
      }
    }

    animationFrame = requestAnimationFrame(simulate)
  }

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
  })
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">

      <!-- Simulation Preview Box -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Drop Simulation</h2>

        <div ref="box" class="relative w-full h-[400px] bg-blue-50 border border-blue-200 rounded overflow-hidden">
          <div class="absolute bottom-0 w-full h-[5px] bg-gray-700"></div>
          <div class="ball absolute left-1/2 -translate-x-1/2 border-2 border-blue-600 border-dashed rounded-full"
            :style="ballStyle">
            <div
              class="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>
        
        <div class="space-y-6">
          <!-- Weight Slider -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Weight</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ weight }} kg</span>
            </div>
            <input type="range" v-model.number="weight" min="0.5" max="1000" step="0.5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5 kg</span>
              <span>1000 kg</span>
            </div>
          </div>

          <!-- Gravity Slider -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Gravity</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ gravity }} m/s²</span>
            </div>
            <input type="range" v-model.number="gravity" min="0" max="50" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 m/s²</span>
              <span>50 m/s²</span>
            </div>
          </div>

          <!-- Ball Size Slider -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Ball Size</label>
              <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{{ objectSize }} px</span>
            </div>
            <input type="range" v-model.number="objectSize" min="20" max="100"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors">
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>20 px</span>
              <span>100 px</span>
            </div>
          </div>

          <!-- Start Button -->
          <button @click="startDrop"
            class="w-full px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clip-rule="evenodd" />
            </svg>
            Start Simulation
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
