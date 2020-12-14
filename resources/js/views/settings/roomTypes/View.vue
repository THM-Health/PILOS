<template>
  <div>
    <h3>
      {{ id === 'new' ? $t('settings.roomTypes.new') : (
        viewOnly ? $t('settings.roomTypes.view', { name: model.description })
          : $t('settings.roomTypes.edit', { name: model.description })
      ) }}
    </h3>
    <hr>
    <b-overlay :show="isBusy || !loaded">
      <template #overlay>
        <div class="text-center">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
            ref="reloadRoomType"
            v-else
            @click="loadRoomType()"
          >
            <b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>
      <b-form @submit='saveRoomType'>
        <b-container fluid>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.description')"
            label-for='description'
            :state='fieldState("description")'
          >
            <b-form-input id='description' type='text' v-model='model.description' :state='fieldState("description")' :disabled='isBusy || !loaded || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('description')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.short')"
            label-for='short'
            :state='fieldState("short")'
          >
            <b-form-input maxlength="2" id='short' type='text' v-model='model.short' :state='fieldState("short")' :disabled='isBusy || !loaded || viewOnly'></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('short')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.color')"
            label-for='color'
            :state='fieldState("color")'
          >
            <v-swatches class="my-2" :disabled='isBusy || !loaded || viewOnly' :swatch-style="{ borderRadius: '0px' }" :swatches="swatches" v-model="model.color" inline></v-swatches>
            <b-form-text>{{ $t('settings.roomTypes.customColor') }}</b-form-text>
            <b-form-input id='color' type='text' v-model='model.color' :state='fieldState("color")' :disabled='isBusy || !loaded || viewOnly'></b-form-input>

            <template slot='invalid-feedback'><div v-html="fieldError('color')"></div></template>
          </b-form-group>

          <b-form-group
            label-cols-sm='4'
            :label="$t('settings.roomTypes.preview')"
          >
            <div class="roomicon" :style="{ 'background-color': model.color}">{{ model.short }}</div>
          </b-form-group>

          <hr>
          <b-row class='my-1 float-right'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy'
                variant='secondary'
                @click="$router.push({ name: 'settings.room_types' })">
                <i class='fas fa-arrow-left'></i> {{ $t('app.back') }}
              </b-button>
              <b-button
                :disabled='isBusy || !loaded'
                variant='success'
                type='submit'
                class='ml-1'
                v-if='!viewOnly'>
                <i class='fas fa-save'></i> {{ $t('app.save') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>
    </b-overlay>
    <b-modal
      :static='modalStatic'
      :busy='isBusy'
      ok-variant='danger'
      cancel-variant='dark'
      @ok='forceOverwrite'
      @cancel='refreshRoomType'
      :hide-header-close='true'
      :no-close-on-backdrop='true'
      :no-close-on-esc='true'
      ref='stale-roomType-modal'
      :hide-header='true'>
      <template v-slot:default>
        <h5>{{ staleError.message }}</h5>
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.overwrite') }}
      </template>
      <template v-slot:modal-cancel>
        <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.reload') }}
      </template>
    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';
import FieldErrors from '../../../mixins/FieldErrors';
import { mapGetters } from 'vuex';
import env from '../../../env';
import VSwatches from 'vue-swatches';
import 'vue-swatches/dist/vue-swatches.css';

export default {
  mixins: [FieldErrors],
  components: {
    VSwatches
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    },

    viewOnly: {
      type: Boolean,
      required: true
    },

    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters({
      settings: 'session/settings'
    })

  },

  data () {
    return {
      loaded: false,
      isBusy: false,
      errors: {},
      staleError: {},
      model: {
        description: null,
        short: null,
        color: '#4a5c66'
      },
      swatches: ['#4a5c66', '#80ba24', '#9C132E', '#F4AA00', '#00B8E4', '#002878']
    };
  },

  /**
   * Loads the role from the backend and also a part of permissions that can be selected.
   */
  mounted () {
    if (this.id !== 'new') {
      this.loadRoomType();
    } else { this.loaded = true; }
  },

  methods: {

    /**
     * Load the room type from the server api
     *
     */
    loadRoomType () {
      this.isBusy = true;

      Base.call(`roomTypes/${this.id}`).then(response => {
        this.model = response.data.data;
        this.loaded = true;
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$router.push({ name: 'settings.room_types' });
        }
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Saves the changes of the room type to the database by making a api call.
     *
     * @param evt
     */
    saveRoomType (evt) {
      if (evt) {
        evt.preventDefault();
      }
      this.isBusy = true;

      const config = {
        method: this.id === 'new' ? 'post' : 'put',
        data: this.model
      };

      Base.call(this.id === 'new' ? 'roomTypes' : `roomTypes/${this.id}`, config).then(() => {
        this.$router.push({ name: 'settings.room_types' });
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // handle stale errors
          this.staleError = error.response.data;
          this.$refs['stale-roomType-modal'].show();
        } else if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          Base.error(error, this.$root, error.message);
          this.$router.push({ name: 'settings.room_types' });
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Force a overwrite of the user in the database by setting the `updated_at` field to the new one.
     */
    forceOverwrite () {
      this.model.updated_at = this.staleError.new_model.updated_at;
      this.staleError = {};
      this.$refs['stale-roomType-modal'].hide();
      this.saveRoomType();
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshRoomType () {
      this.model = this.staleError.new_model;
      this.staleError = {};
      this.$refs['stale-roomType-modal'].hide();
    }
  }
};
</script>

<style scoped>

</style>
