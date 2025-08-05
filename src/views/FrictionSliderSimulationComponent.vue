<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  // Simulation parameters
  const mass = ref(1) // kg
  const gravity = ref(9.8) // m/s²
  const kineticFriction = ref(0.25) // Coefficient of kinetic friction
  const initialVelocity = ref(1) // m/s
  const objectWidth = ref(80) // px
  const objectHeight = ref(40) // px
  const airDensity = ref(1.225) // kg/m³
  const dragCoefficient = ref(1.05) // Drag coefficient for a box

  // Conversion constants
  const pxToM = 0.01
  const mToPx = 100

  // Simulation state
  const positionX = ref(0)
  const velocity = ref(initialVelocity.value * mToPx)
  const isSliding = ref(false)
  const restitution = 0.5 // Bounciness factor (0 = no bounce, 1 = full bounce)

  const previewRef = ref<HTMLElement | null>(null)
  const maxDistance = ref(700)

  let animationFrame: number
  let lastTime = 0

  // Box style
  const objectStyle = computed(() => ({
    width: `${objectWidth.value}px`,
    height: `${objectHeight.value}px`,
    transform: `translateX(${positionX.value}px)`
  }))

  const updateMaxDistance = () => {
    if (previewRef.value) {
      maxDistance.value = previewRef.value.clientWidth
    }
  }

  onMounted(() => {
    updateMaxDistance()
    window.addEventListener('resize', updateMaxDistance)
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrame)
    window.removeEventListener('resize', updateMaxDistance)
  })

  const startSlide = () => {
    cancelAnimationFrame(animationFrame)
    positionX.value = 0
    velocity.value = initialVelocity.value * mToPx
    isSliding.value = true
    lastTime = performance.now()

    console.log(`Starting slide at ${initialVelocity.value} m/s`)
    console.log('Current mass', mass.value)
    simulate()
  }

  const simulate = (timestamp = 0) => {
    if (!isSliding.value) return

    const now = performance.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    if (dt > 0.1) {
      animationFrame = requestAnimationFrame(simulate)
      return
    }

    const velocityMs = velocity.value * pxToM

    // Forces
    const normalForce = mass.value * gravity.value
    const frictionForce = kineticFriction.value * normalForce
    const frontalArea = (objectHeight.value * pxToM) * (objectWidth.value * pxToM)
    const dragForce = 0.5 * airDensity.value * velocityMs ** 2 * dragCoefficient.value * frontalArea
    const totalForce = frictionForce + dragForce
    const direction = velocityMs > 0 ? -1 : 1
    const acceleration = (totalForce * direction) / mass.value

    const newVelocityMs = velocityMs + acceleration * dt
    velocity.value = newVelocityMs * mToPx

    positionX.value += ((velocityMs + newVelocityMs) / 2) * dt * mToPx

    const rightEdge = positionX.value + objectWidth.value
    const leftEdge = positionX.value

    if (rightEdge >= maxDistance.value) {
      positionX.value = maxDistance.value - objectWidth.value
      velocity.value = -Math.abs(velocity.value) * restitution
      console.log('Bounce at right edge')
    } else if (leftEdge <= 0) {
      positionX.value = 0
      velocity.value = Math.abs(velocity.value) * restitution
      console.log('Bounce at left edge')
    }

    if (Math.abs(newVelocityMs) <= 0.01) {
      velocity.value = 0
      isSliding.value = false
      const finalDistance = (positionX.value * pxToM).toFixed(2)
      console.log(`Stopped after ${finalDistance} m`)
      return
    }

    animationFrame = requestAnimationFrame(simulate)
  }
</script>

<template>
  <div class="flex items-center justify-center bg-gray-100">
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl">
      <!-- Simulation Preview -->
      <div class="flex-1 order-2 md:order-1 p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-center">Box Sliding Simulation</h2>
        <div ref="previewRef"
          class="relative w-full h-[150px] bg-orange-50 border border-orange-200 rounded overflow-hidden">
          <!-- Ground surface -->
          <div class="absolute bottom-0 w-full h-[5px] bg-gray-700"></div>

          <!-- Sliding box -->
          <div class="absolute bottom-[5px] left-0 bg-orange-500 border border-orange-600 rounded" :style="objectStyle">
            <!-- Center indicator -->
            <div
              class="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            </div>
          </div>

          <!-- End wall -->
          <div class="absolute bottom-0 right-0 w-1 h-[150px] bg-gray-800"></div>
        </div>

        <div class="mt-5">
          <p class="text-md font-semibold"></p>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block font-medium mb-1">Mass (kg)</label>
            <input type="range" v-model.number="mass" min="0.5" max="50" step="0.5" class="w-full">
            <span class="text-sm text-gray-600">{{ mass }} kg</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Initial Velocity (m/s)</label>
            <input type="range" v-model.number="initialVelocity" min="0.1" max="10" step="0.1" class="w-full">
            <span class="text-sm text-gray-600">{{ initialVelocity }} m/s</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Friction Coefficient</label>
            <input type="range" v-model.number="kineticFriction" min="0.01" max="1" step="0.01" class="w-full">
            <span class="text-sm text-gray-600">{{ kineticFriction.toFixed(2) }}</span>
          </div>

          <div>
            <label class="block font-medium mb-1">Air Density (kg/m³)</label>
            <input type="range" v-model.number="airDensity" min="0" max="2" step="0.01" class="w-full">
            <span class="text-sm text-gray-600">{{ airDensity.toFixed(2) }} kg/m³</span>
          </div>

          <button @click="startSlide" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
