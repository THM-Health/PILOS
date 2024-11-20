<template>
  <div class="mt-20 flex justify-center">
    <!-- Show message that room can only be used by logged in users -->
    <Card
      style="width: 500px; max-width: 90vw"
      :pt="{ header: { class: 'flex justify-center' } }"
    >
      <template #header>
        <Badge
          severity="danger"
          class="-mt-8 flex h-16 w-16 items-center justify-center rounded-full"
        >
          <i class="fa-solid fa-unlink text-2xl text-white"></i>
        </Badge>
      </template>
      <template #content>
        <p class="m-0 text-center text-2xl font-bold">{{ $t("app.error") }}</p>
        <p class="text-center text-lg">{{ $t("app.not_found") }}</p>
      </template>
    </Card>
  </div>
</template>
