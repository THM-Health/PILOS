<template>

  <div
    class="flex justify-center mt-20"
  >
    <!-- Show message that room can only be used by logged in users -->
    <Card style="width: 500px; max-width: 90vw;" :pt="{ header: { class: 'flex justify-center'}}">
      <template #header>
        <Badge severity="danger" class="rounded-full flex justify-center items-center h-16 w-16 -mt-8">
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
