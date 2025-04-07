<template>
  <div class="sm:pt-30 mx-auto max-w-7xl px-6 pb-0 pt-16 lg:px-8 lg:pt-16">
    <div
      class="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center"
    >
      <div class="relative w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
        <LandingHeroTitle />
        <p class="mt-6 text-lg leading-8 text-color sm:max-w-md lg:max-w-none">
          {{ $t("home.description_intro") }}<br />
          {{ $t("home.description_details") }}
        </p>
        <LandingHeroCTA />
      </div>
      <div
        class="mt-14 grid grid-cols-3 justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0 xl:grid-cols-[10rem_10rem_10rem] 2xl:grid-cols-[12rem_12rem_12rem]"
      >
        <div
          class="ml-auto flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:pt-64 xl:pt-80"
        >
          <div class="relative">
            <img
              src="/public/images/hero/hero1.jpg"
              alt=""
              class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
            />
            <div
              class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10"
            />
          </div>
        </div>
        <div class="mr-auto flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
          <div class="relative">
            <img
              src="/public/images/hero/hero2.jpg"
              alt=""
              class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
            />
            <div
              class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10"
            />
          </div>
          <div class="relative">
            <img
              src="/public/images/hero/hero3.jpg"
              alt=""
              class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
            />
            <div
              class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10"
            />
          </div>
        </div>
        <div class="flex-none space-y-8 pt-32 sm:pt-0">
          <div class="relative">
            <img
              src="/public/images/hero/hero4.jpg"
              alt=""
              class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
            />
            <div
              class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10"
            />
          </div>
          <div class="relative">
            <img
              src="/public/images/hero/hero5.jpg"
              alt=""
              class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
            />
            <div
              class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
