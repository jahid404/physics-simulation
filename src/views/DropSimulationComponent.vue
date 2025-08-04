<script lang="ts" setup>
  import { ref, computed, onUnmounted } from 'vue'

  const weight = ref(1) // kg
  const gravity = ref(9.8) // m/s^2
  const objectSize = ref(40) // px
  const airDensity = ref(1.225) // kg/m^3 (standard at sea level)
  const dragCoefficient = ref(0.47) // roughly a sphere's drag coefficient

  // convert pixels to meters (assuming 100px = 1m for simulation)
  const pxToM = 0.01
  const mToPx = 100

  const ballY = ref(0)
  const velocity = ref(0)
  const restitution = 0.8 // coefficient of restitution (energy retained after bounce)
  const isDropping = ref(false)
  const maxDrop = 393.5 // px (~3.935m)
  let animationFrame: number

  let lastLogTime = 0
  const logInterval = 100 // ms between logs

  const ballStyle = computed(() => ({
    width: `${objectSize.value}px`,
    height: `${objectSize.value}px`,
    transform: `translateY(${ballY.value}px)`
  }))

  const startDrop = () => {
    cancelAnimationFrame(animationFrame)
    ballY.value = 0
    velocity.value = 0
    isDropping.value = true
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

    // check for ground collision
    const maxY = maxDrop - objectSize.value
    if (ballY.value >= maxY) {
      ballY.value = maxY

      // apply coefficient of restitution (energy loss on bounce)
      velocity.value = -velocity.value * restitution

      // stop simulation if velocity becomes negligible
      if (Math.abs(velocity.value) < 0.5 * mToPx) { // ~0.5 m/s threshold
        isDropping.value = false
        velocity.value = 0
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
          <div class="ball absolute left-1/2 -translate-x-1/2 bg-blue-600 rounded-full" :style="ballStyle"></div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="w-full order-1 md:order-2 md:w-[350px] h-max p-4 bg-white rounded-xl shadow-xl">
        <h2 class="text-xl font-semibold mb-4 text-center md:text-left">Configuration</h2>

        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block font-medium mb-1">Weight (kg)</label>
            <input type="number" v-model.number="weight" min="0.1" step="0.1" class="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label class="block font-medium mb-1">Gravity (m/s²)</label>
            <input type="number" v-model.number="gravity" min="0" max="50" step="0.1"
              class="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label class="block font-medium mb-1">Ball Size (px): {{ objectSize }}px</label>
            <input type="range" min="20" max="100" v-model.number="objectSize" class="w-full" />
          </div>

          <button @click="startDrop" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Start Drop
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
