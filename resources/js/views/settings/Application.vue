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
              >
              </b-form-input>
            </b-input-group>
          </b-col>
        </b-row>
      </b-form-group>

      <!--Room limit settings-->
      <b-form-group
        label-for="application-room-limit-radio"
        :description="$t('settings.application.roomLimit.description')"
      >

        <template v-slot:label>
          <span><i class="fas fa-person-booth mr-3"></i></span>
          {{ $t('settings.application.roomLimit.title') }}
        </template>

        <b-form-radio-group
          id="application-room-limit-radio"
          v-model="settings.roomLimit.selected"
          :options="settings.roomLimit.options"
          buttons
          button-variant="success"
          :disabled="isBusy"
        >
        </b-form-radio-group>
      </b-form-group>

      <!--Pagination page size settings-->
      <b-form-group
        label-for="application-pagination-page-size-radio"
        :description="$t('settings.application.paginationPageSize.description')"
      >

        <template v-slot:label>
          <span><i class="fas fa-clone mr-3"></i></span>
          {{ $t('settings.application.paginationPageSize.title') }}
        </template>

        <b-form-radio-group
          id="application-pagination-page-size-radio"
          v-model="settings.paginationPageSize.selected"
          :options="settings.paginationPageSize.options"
          buttons
          button-variant="success"
          :disabled="isBusy"
        >
        </b-form-radio-group>
      </b-form-group>

      <!--Own rooms pagination page size settings-->
      <b-form-group
        label-for="application-pagination-own-room-page-size-radio"
        :description="$t('settings.application.ownRoomsPaginationPageSize.description')"
      >

        <template v-slot:label>
          <span><i class="fas fa-window-restore mr-3"></i></span>
          {{ $t('settings.application.ownRoomsPaginationPageSize.title') }}
        </template>

        <b-form-radio-group
          id="application-pagination-own-room-page-size-radio"
          v-model="settings.ownRoomsPaginationPageSize.selected"
          :options="settings.ownRoomsPaginationPageSize.options"
          buttons
          button-variant="success"
          :disabled="isBusy"
        >
        </b-form-radio-group>
      </b-form-group>

    </b-container>
  </div>
</template>

<script>
import Base from '../../api/base';

export default {
  data () {
    return {
      isBusy: false,
      settings: {
        logo: '/images/logo.svg',
        roomLimit: {
          selected: -1,
          options: [
            { text: this.$t('settings.application.numberOptions.one'), value: 1 },
            { text: this.$t('settings.application.numberOptions.five'), value: 5 },
            { text: this.$t('settings.application.numberOptions.ten'), value: 10 },
            { text: this.$t('settings.application.numberOptions.unlimited'), value: -1 }
          ]
        },
        paginationPageSize: {
          selected: 15,
          options: [
            { text: this.$t('settings.application.numberOptions.five'), value: 5 },
            { text: this.$t('settings.application.numberOptions.ten'), value: 10 },
            { text: this.$t('settings.application.numberOptions.fifteen'), value: 15 },
            { text: this.$t('settings.application.numberOptions.thirty'), value: 30 },
            { text: this.$t('settings.application.numberOptions.fifty'), value: 50 }
          ]
        },
        ownRoomsPaginationPageSize: {
          selected: 5,
          options: [
            { text: this.$t('settings.application.numberOptions.five'), value: 5 },
            { text: this.$t('settings.application.numberOptions.ten'), value: 10 },
            { text: this.$t('settings.application.numberOptions.fifteen'), value: 15 },
            { text: this.$t('settings.application.numberOptions.thirty'), value: 30 },
            { text: this.$t('settings.application.numberOptions.fifty'), value: 50 }
          ]
        }
      }
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
          this.settings.roomLimit.selected = response.data.data.room_limit;
          this.settings.ownRoomsPaginationPageSize.selected = response.data.data.own_rooms_pagination_page_size;
          this.settings.paginationPageSize.selected = response.data.data.pagination_page_size;
        })
        .catch((error) => {
          Base.error(error, this.$root);
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
            room_limit: settings.roomLimit.selected,
            pagination_page_size: settings.paginationPageSize.selected,
            own_rooms_pagination_page_size: settings.ownRoomsPaginationPageSize.selected
          }
        })
        .then(response => {
          this.$store.dispatch('session/getSettings');
          this.flashMessage.success(this.$t('settings.application.updateSettingsSuccess'));
        })
        .catch((error) => {
          Base.error(error, this.$root);
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
