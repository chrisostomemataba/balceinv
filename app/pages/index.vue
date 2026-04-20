<template>
  <div class="splash">
    <div class="logo-wrap" :class="{ visible: show }">
      <div class="logo-ring" />
      <div class="logo-text">BALCE</div>
      <div class="logo-sub">Inventory System</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const show = ref(false)

onMounted(() => {
  setTimeout(() => { show.value = true }, 100)
  setTimeout(() => navigateTo('/login'), 3000)
})
</script>

<style scoped>
.splash {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}
.logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.logo-wrap.visible {
  opacity: 1;
  transform: scale(1);
}
.logo-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #6366f1;
  border-right-color: #6366f1;
  animation: spin 1s linear infinite;
}
.logo-text {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #f8fafc;
}
.logo-sub {
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  color: #94a3b8;
  text-transform: uppercase;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
