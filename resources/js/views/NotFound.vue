<template>

  <div
    class="flex justify-content-center mt-8"
  >
    <!-- Show message that room can only be used by logged in users -->
    <Card style="width: 500px; max-width: 90vw;" :pt="{ header: { class: 'flex justify-content-center'}}">
      <template #header>
        <Badge severity="danger" class="border-circle flex justify-content-center align-items-center h-4rem w-4rem -mt-5">
          <i class="fa-solid fa-unlink text-2xl text-white"></i>
        </Badge>
      </template>
      <template #content>
        <p class="font-bold text-2xl m-0 text-center">{{ $t('app.error') }}</p>
        <p class="text-center text-lg">{{ $t('app.not_found') }}</p>
      </template>
    </Card>
  </div>
</template>
