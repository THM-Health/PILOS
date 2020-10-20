<template>
  <div>
    <b-container fluid>
      <h3>
        {{ $t('settings.application.title') }}
        <b-button id="application-save-button"
                  class="float-right"
                  variant="success"
                  @click="updateSettings(settings)"
                  :disabled="isBusy">
          <span><i class="fas fa-save mr-2"></i>{{ $t('settings.application.save') }}</span>
        </b-button>
      </h3>

      <hr>

      <!--Logo Settings-->
      <b-form-group
        label-for="application-logo-input"
        :description="$t('settings.application.logo.description')"
        :state='fieldState("logo")'
      >

        <template v-slot:label>
          <span><i class="fas fa-camera-retro mr-3"></i></span>
          {{ $t('settings.application.logo.title') }}
        </template>

        <b-row align-v="baseline" class="my-3">
          <b-col sm="6" lg="3" class="text-center">
            <b-img
              :src="settings.logo"
              class="my-2"
              rounded="0"
              alt="application-logo-preview"
              width="150"
              height="100"
              fluid
            >
            </b-img>
          </b-col>
          <b-col sm="6" lg="9">
            <b-input-group>
              <b-form-input id="application-logo-input"
                            :placeholder="$t('settings.application.logo.hint')"
                            v-model="settings.logo"
                            :disabled="isBusy"
                            :state='fieldState("logo")'
              >
              </b-form-input>
            </b-input-group>
          </b-col>
        </b-row>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('logo')"></div>
        </template>
      </b-form-group>

      <!--Room limit settings-->
      <b-form-group
        label-for="application-room-limit-input"
        :description="$t('settings.application.roomLimit.description')"
        :state='fieldState("room_limit")'
      >

        <template v-slot:label>
          <span><i class="fas fa-person-booth mr-3"></i></span>
          {{ $t('settings.application.roomLimit.title') }}
        </template>

        <b-form-input id="application-room-limit-input"
                      v-model="settings.roomLimit"
                      type="number"
                      :disabled="isBusy"
                      :state='fieldState("room_limit")'
        >
        </b-form-input>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('room_limit')"></div>
        </template>
      </b-form-group>

      <!--Pagination page size settings-->
      <b-form-group
        label-for="application-pagination-page-size-input"
        :description="$t('settings.application.paginationPageSize.description')"
        :state='fieldState("pagination_page_size")'
      >

        <template v-slot:label>
          <span><i class="fas fa-clone mr-3"></i></span>
          {{ $t('settings.application.paginationPageSize.title') }}
        </template>

        <b-form-input id="application-pagination-page-size-input"
                      v-model="settings.paginationPageSize"
                      type="number"
                      :disabled="isBusy"
                      :state='fieldState("pagination_page_size")'
        >
        </b-form-input>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('pagination_page_size')"></div>
        </template>
      </b-form-group>

      <!--Own rooms pagination page size settings-->
      <b-form-group
        label-for="application-pagination-own-room-page-size-input"
        :description="$t('settings.application.ownRoomsPaginationPageSize.description')"
        :state='fieldState("own_rooms_pagination_page_size")'
      >

        <template v-slot:label>
          <span><i class="fas fa-window-restore mr-3"></i></span>
          {{ $t('settings.application.ownRoomsPaginationPageSize.title') }}
        </template>

        <b-form-input id="application-pagination-own-room-page-size-input"
                      v-model="settings.ownRoomsPaginationPageSize"
                      type="number"
                      :disabled="isBusy"
                      :state='fieldState("own_rooms_pagination_page_size")'
        >
        </b-form-input>

        <template slot='invalid-feedback'>
          <div v-html="fieldError('own_rooms_pagination_page_size')"></div>
        </template>
      </b-form-group>

    </b-container>
  </div>
</template>

<script>
import Base from '../../api/base';
import FieldErrors from '../../mixins/FieldErrors';

export default {
  mixins: [FieldErrors],

  data () {
    return {
      isBusy: false,
      settings: {
        logo: '/images/logo.svg',
        roomLimit: null,
        paginationPageSize: null,
        ownRoomsPaginationPageSize: null
      },
      errors: {}
    };
  },
  methods: {
    /**
     * Handle get settings data
     */
    getSettings () {
      this.isBusy = true;
      Base.call('settings')
        .then(response => {
          this.settings.logo = response.data.data.logo;
          this.settings.roomLimit = response.data.data.room_limit;
          this.settings.ownRoomsPaginationPageSize = response.data.data.own_rooms_pagination_page_size;
          this.settings.paginationPageSize = response.data.data.pagination_page_size;
        })
        .catch((error) => {
          Base.error(error, this.$root, error.message);
        })
        .finally(() => {
          this.isBusy = false;
        });
    },

    /**
     * Handle update settings data
     *
     * @param settings Settings object to fill the payload
     */
    updateSettings (settings) {
      this.isBusy = true;

      Base.call('settings',
        {
          method: 'put',
          data: {
            logo: settings.logo,
            room_limit: settings.roomLimit,
            pagination_page_size: settings.paginationPageSize,
            own_rooms_pagination_page_size: settings.ownRoomsPaginationPageSize
          }
        })
        .then(response => {
          this.$store.dispatch('session/getSettings');
          this.flashMessage.success(this.$t('settings.application.updateSettingsSuccess'));
        })
        .catch((error) => {
          Base.error(error, this.$root, error.message);

          this.errors = error.response.data.errors;
        })
        .finally(() => {
          this.getSettings();
        });
    }
  },
  mounted () {
    this.getSettings();
  }
};
</script>

<style scoped>

</style>
