<template>
  <div class="mx-auto max-w-7xl px-6 pb-0 pt-16 sm:pt-30 lg:px-8 lg:pt-16">
    <div class="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
      <div class="relative w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
        <LandingHeroTitle/>
        <p class="mt-6 text-lg leading-8 text-color sm:max-w-md lg:max-w-none">{{ $t('home.description_intro') }}<br/>
          {{ $t('home.description_details') }}</p>
        <LandingHeroCTA/>
      </div>
      <div class="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
        <div class="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
          <div class="relative">
            <img src="/public/images/hero/hero1.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
        </div>
        <div class="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
          <div class="relative">
            <img src="/public/images/hero/hero2.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
          <div class="relative">
            <img src="/public/images/hero/hero3.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
        </div>
        <div class="w-44 flex-none space-y-8 pt-32 sm:pt-0">
          <div class="relative">
            <img src="/public/images/hero/hero4.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
          <div class="relative">
            <img src="/public/images/hero/hero5.jpg" alt="" class="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg" />
            <div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
