<template>
  <h1 class="text-4xl font-bold tracking-tight text-color sm:text-6xl">
    {{ $t('home.title.first_line.before_flip_words') }}<LandingHeroTitleFlipWords :words="$t('home.title.first_line.flip_words').split('|')" />{{ $t('home.title.first_line.after_flip_words') }}<br/>
    {{ $t('home.title.second_line.before_underline') }}<LandingHeroTitleUnderlineWords>{{ $t('home.title.second_line.underline') }}</LandingHeroTitleUnderlineWords>{{ $t('home.title.second_line.after_underline') }}
  </h1>
</template>
