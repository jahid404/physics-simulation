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
    },
    {
      path: '/friction-slider',
      component: () => import('@/views/FrictionSliderSimulationComponent.vue'),
    },
  ],
})

export default router
