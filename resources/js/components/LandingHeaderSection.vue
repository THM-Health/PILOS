<template>
  <div class="mx-auto max-w-7xl px-6 pb-0 pt-16 sm:pt-30 lg:px-8 lg:pt-16">
    <div class="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
      <div class="relative w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
        <h1 class="text-4xl font-bold tracking-tight text-color sm:text-6xl">{{ $t('home.title.first_line.before_flip_words') }}<FlipWords :words="$t('home.title.first_line.flip_words').split(';')" />{{ $t('home.title.first_line.after_flip_words') }}<br/>{{ $t('home.title.second_line.before_underline') }}<span class="relative whitespace-nowrap">
      <svg
        aria-hidden="true"
        viewBox="0 0 418 42"
        class="absolute left-0 top-2/3 h-[0.58em] w-full fill-primary-300/70"
        preserveAspectRatio="none"
      >
        <path
          d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"/>
      </svg>
          <span class="relative">{{ $t('home.title.second_line.underline') }}</span></span>{{ $t('home.title.second_line.after_underline') }}</h1>
        <p class="mt-6 text-lg leading-8 text-color sm:max-w-md lg:max-w-none">{{ $t('home.description_intro') }}<br/>
          {{ $t('home.description_details') }}</p>
        <div class="mt-10 flex items-center gap-x-6">
          <Button size="large" as="router-link" :to="{ name: 'rooms.index'}" class="px-5 py-3 text-xl font-semibold">
            {{ $t('home.title.get_started') }}</Button>
        </div>
      </div>
      <div class="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
        <div class="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
          <div class="relative">
            <img src="/images/hero/hero1.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
        </div>
        <div class="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
          <div class="relative">
            <img src="/images/hero/hero2.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
          <div class="relative">
            <img src="/images/hero/hero3.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
        </div>
        <div class="w-44 flex-none space-y-8 pt-32 sm:pt-0">
          <div class="relative">
            <img src="/images/hero/hero4.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
          <div class="relative">
            <img src="/images/hero/hero5.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

</script>
<style scoped>

</style>
