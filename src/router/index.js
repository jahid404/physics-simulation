import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeComponent.vue'),
    },
    {
      path: '/ball-drop',
      component: () => import('@/views/BallDropComponent.vue'),
    },
  ],
})

export default router
