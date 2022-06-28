<template>
  <div>
    <div class="container pt-5 pb-5">
      <div class="row">
        <div class="col-md-12 col-sm-12 text-center">
          <img class="logo" v-if="settings('logo')" :src="settings('logo')">
          <h1 id="main-text" class="display-4 mb-4">{{ $t('home.title') }}</h1>
          <p class="lead offset-lg-2 col-lg-8 col-sm-12 ">{{ $t('home.subtitle') }}</p>
          <p class="lead offset-lg-2 col-lg-8 col-sm-12 " v-html="$t('home.description')"></p>
          <p class="lead offset-lg-2 col-lg-8 col-sm-12 ">{{ $t('home.descriptionExtended') }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white pt-5 mt-2 mb-5">
      <div class="container text-center">
        <h2 class="mb-4">{{ $t('home.possibilities.title') }}</h2>

        <div class="row feature-stamp">
          <div class="col-lg-4 col-md-6">
            <div class="stamp bg-success"><i class="fa-solid fa-comments fa-2x"></i></div>
            <h4 class="mt-4">{{ $t('home.possibilities.chat.title') }}</h4>
            <p>{{ $t('home.possibilities.chat.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <span class="stamp bg-success"><i class="fa-solid fa-video fa-2x"></i></span>
            <h4 class="mt-4">{{ $t('home.possibilities.webcams.title') }}</h4>
            <p>{{ $t('home.possibilities.webcams.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <span class="stamp bg-success"><i class="fa-solid fa-headset fa-2x"></i></span>
            <h4 class="mt-4">{{ $t('home.possibilities.audio.title') }}</h4>
            <p>{{ $t('home.possibilities.audio.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <span class="stamp bg-success"><i class="fa-solid fa-thumbs-up fa-2x"></i></span>
            <h4 class="mt-4">{{ $t('home.possibilities.emojis.title') }}</h4>
            <p>{{ $t('home.possibilities.emojis.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <div class="stamp bg-success"><i class="fa-solid fa-chalkboard-teacher fa-2x"></i></div>
            <h4 class="mt-4">{{ $t('home.possibilities.groups.title') }}</h4>
            <p>{{ $t('home.possibilities.groups.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <span class="stamp bg-success"><i class="fa-solid fa-users fa-2x"></i></span>
            <h4 class="mt-4">{{ $t('home.possibilities.surveys.title') }}</h4>
            <p>{{ $t('home.possibilities.surveys.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <span class="stamp bg-success"><i class="fa-solid fa-desktop fa-2x"></i></span>
            <h4 class="mt-4">{{ $t('home.possibilities.screenSharing.title') }}</h4>
            <p>{{ $t('home.possibilities.screenSharing.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <span class="stamp bg-success"><i class="fa-solid fa-chalkboard-teacher fa-2x"></i></span>
            <h4 class="mt-4">{{ $t('home.possibilities.whiteboard.title') }}</h4>
            <p>{{ $t('home.possibilities.whiteboard.description') }}</p>
          </div>
          <div class="col-lg-4 col-md-6">
            <span class="stamp bg-success"><i class="fa-solid fa-film fa-2x"></i></span>
            <h4 class="mt-4">{{ $t('home.possibilities.recording.title') }}</h4>
            <p>{{ $t('home.possibilities.recording.description') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  computed: {
    ...mapGetters({
      settings: 'session/settings'
    })
  }
};

</script>

<style scoped>
.logo {
  height: 80px;
  max-width: 100%;
  margin-bottom: 21px;
}

.display-4 {
  font-size: 3rem;
  font-weight: normal;
  line-height: 1.1;
}
.lead {
  font-size: 18px;
  line-height: 1.4;
}

.feature-stamp .stamp {
  padding: 1em 1.5em;
  height: auto;
}

.stamp {
  color: #fff;
  display: inline-block;
  min-width: 2rem;
  height: 2rem;
  padding: 0 .25rem;
  line-height: 2rem;
  text-align: center;
  font-weight: 600;
}
</style>
