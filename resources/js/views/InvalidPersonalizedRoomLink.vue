<template>
  <div v-cloak class="container mt-8 mb-8">
    <div class="mt-20 flex justify-center">
      <!-- Show message that the personalized link is invalid -->
      <Card
        style="width: 500px; max-width: 90vw"
        :pt="{ header: { class: 'flex justify-center' } }"
      >
        <template #header>
          <Badge
            severity="danger"
            class="-mt-8 flex !h-16 !w-16 items-center justify-center rounded-full"
          >
            <i class="fa-solid fa-unlink text-2xl text-white"></i>
          </Badge>
        </template>
        <template #content>
          <h1 class="font-bold">
            {{ $t("rooms.invalid_personalized_link") }}
          </h1>
        </template>
      </Card>
    </div>
  </div>
</template>
<script setup></script>
