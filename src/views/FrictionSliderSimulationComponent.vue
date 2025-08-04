<script setup>
  import { ref } from 'vue'

  const positionX = ref(0)
  const objectWidth = ref(40)
  const objectHeight = ref(40)
  const velocity = ref(300)
  const mass = ref(5)
  const gravity = ref(9.8)
  const kineticFriction = ref(0.2)
  const dragCoefficient = ref(0.47)
  const airDensity = ref(1.225)
  const isSliding = ref(false)

  const pxToM = 1 / 100
  const mToPx = 100

  let animationFrame = null
  let lastTime = 0

  const startSliding = () => {
    cancelAnimationFrame(animationFrame)
    lastTime = performance.now()
    isSliding.value = true
    simulate()
  }

  const stopSliding = () => {
    cancelAnimationFrame(animationFrame)
    isSliding.value = false
  }

  const resetSimulation = () => {
    stopSliding()
    positionX.value = 0
    velocity.value = 300
  }

  const restitution = 0.6

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

    const normalForce = mass.value * gravity.value
    const frictionForce = kineticFriction.value * normalForce

    const frontalArea = (objectHeight.value * pxToM) * (objectWidth.value * pxToM)
    const dragForce = 0.5 * airDensity.value * Math.pow(velocityMs, 2) * dragCoefficient.value * frontalArea

    const totalForce = frictionForce + dragForce
    const direction = velocityMs > 0 ? -1 : 1
    const acceleration = (totalForce * direction) / mass.value

    const newVelocityMs = velocityMs + acceleration * dt
    velocity.value = newVelocityMs * mToPx

    positionX.value += ((velocityMs + newVelocityMs) / 2) * dt * mToPx

    const maxDistance = 600
    const maxRight = maxDistance - objectWidth.value

    if (positionX.value >= maxRight) {
      positionX.value = maxRight
      velocity.value = -velocity.value * restitution

      if (Math.abs(velocity.value * pxToM) < 0.05) {
        velocity.value = 0
        isSliding.value = false
        console.log(`Stopped at edge after ${(positionX.value * pxToM).toFixed(2)} m`)
        return
      }

      console.log(`Bounce! New velocity: ${(velocity.value * pxToM).toFixed(2)} m/s`)
    }

    if (Math.abs(newVelocityMs) <= 0.01 && positionX.value < maxRight) {
      velocity.value = 0
      isSliding.value = false
      console.log(`Stopped after ${(positionX.value * pxToM).toFixed(2)} m`)
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
        <div class="relative w-full h-[150px] bg-orange-50 border border-orange-200 rounded overflow-hidden">
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
