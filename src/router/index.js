import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeComponent.vue'),
    },
    {
      path: '/drop-simulation',
      component: () => import('@/views/DropSimulationComponent.vue'),
      meta: {
        title: 'Drop Simulation',
      },
    },
    {
      path: '/friction-slider',
      component: () => import('@/views/FrictionSliderSimulationComponent.vue'),
      meta: {
        title: 'Friction Slider',
      },
    },
    {
      path: '/gravity-attraction',
      component: () => import('@/views/GravityAttractionSimulationComponent.vue'),
      meta: {
        title: 'Gravity Attraction',
      },
    },
    {
      path: '/pendulum-swing',
      component: () => import('@/views/PendulumSwingSimulationComponent.vue'),
      meta: {
        title: 'Pendulum Swing',
      },
    },
    {
      path: '/projectile-motion',
      component: () => import('@/views/ProjectileMotionSimulationComponent.vue'),
      meta: {
        title: 'Projectile Motion'
      }
    }
  ],
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} | Physics Simulation`
  }
})

export default router
