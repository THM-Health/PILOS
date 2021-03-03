<template>
  <b-container class="mt-3 mb-5">
    <b-row class="mb-3">
      <b-col md="9">
        <can method='viewAll' policy='RoomPolicy'>
          <h2>{{ $t('rooms.allRooms') }}</h2>
        </can>
        <cannot method='viewAll' policy='RoomPolicy'>
          <h2>{{ $t('rooms.findRooms') }}</h2>
          <p>{{ $t('rooms.findRoomsInfo')}}</p>
        </cannot>

      </b-col>
      <b-col md="3">
        <b-input-group>
          <b-form-input @change="loadRooms" :disabled="isBusy || loadingError" ref="search" :placeholder="$t('app.search')" v-model="filter"></b-form-input>
          <b-input-group-append>
            <b-button @click="loadRooms" :disabled="isBusy || loadingError" variant="success"><b-icon icon="search"></b-icon></b-button>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>

    <hr>
    <b-row class="mb-3">
      <b-col lg="3" order="2" order-lg="1">
        <h4>{{ $t('rooms.filter.title') }}</h4>
        <h5>{{ $t('rooms.filter.roomTypes') }}</h5>
        <div style="position: relative; min-height: 40px">
          <b-overlay :no-center="true" :show="roomTypesBusy || roomTypesLoadingError" >
            <template #overlay>
              <div class="my-2">
                <b-spinner v-if="roomTypesBusy" ></b-spinner>
                <b-button
                  v-else
                  @click="loadRoomTypes"
                >
                  <b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('app.reload') }}
                </b-button>
              </div>
            </template>

            <b-form-checkbox-group
              v-model="filterRoomTypes"
              :options="roomTypes"
              stacked
              text-field="description"
              value-field="id"
              name="room-types-checkbox"
              :disabled="isBusy || roomTypesBusy || loadingError || roomTypesLoadingError"
            ></b-form-checkbox-group>
          </b-overlay>
        </div>
        <b-button :disabled="isBusy || roomTypesBusy || loadingError || roomTypesLoadingError" class="mt-3" variant="success" @click="loadRooms"><i class="fas fa-filter"></i> {{ $t('rooms.filter.apply') }}</b-button>
      </b-col>
      <b-col lg="9" order="1" order-lg="2">

        <b-overlay  :show="isBusy || loadingError" >

          <template  #overlay>
            <div class="text-center my-2">
              <b-spinner v-if="isBusy" ></b-spinner>
              <b-button
                v-else
                @click="loadRooms"
              >
                <b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('app.reload') }}
              </b-button>
            </div>
          </template>

          <em v-if="!isBusy && !loadingError && !rooms.length">{{ $t('rooms.noRoomsAvailable') }}</em>

          <b-list-group>
            <b-list-group-item button :disabled="openRoom" v-for="room in rooms" :key="room.id" @click="open(room)" class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <div>
                  <h5 class="mb-0">{{ room.name }}</h5>
                  <small>
                    {{ room.owner }}
                  </small>
                </div>
                <div v-if="room.type" v-b-tooltip.hover :title="room.type.description" class="roomicon" :style="{ 'background-color': room.type.color}">{{room.type.short}}</div>
              </div>
            </b-list-group-item>
          </b-list-group>
          <b-pagination
            class="mt-3"
            v-model='currentPage'
            :total-rows='total'
            :per-page='perPage'
            aria-controls='rooms-table'
            @input="loadRooms"
            align='center'
            :disabled='isBusy || loadingError'
          ></b-pagination>
        </b-overlay>

      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Base from '../../api/base';
import Can from '../../components/Permissions/Can';
import Cannot from '../../components/Permissions/Cannot';

export default {
  components: { Can, Cannot },

  data () {
    return {
      isBusy: false,
      loadingError: false,
      openRoom: false,
      currentPage: 1,
      total: undefined,
      perPage: undefined,
      actionPermissions: [],
      filter: undefined,
      rooms: [],
      roomTypes: [],
      filterRoomTypes: [],
      roomTypesBusy: false,
      roomTypesLoadingError: false
    };
  },

  mounted () {
    this.loadRooms();
    this.loadRoomTypes();
  },

  methods: {
    /**
     * Loads the listed rooms
     */
    loadRooms () {
      this.isBusy = true;

      const config = {
        params: {
          page: this.currentPage
        }
      };

      if (this.filter) {
        config.params.search = this.filter;
      }

      config.params.roomTypes = this.filterRoomTypes;

      Base.call('rooms', config).then(response => {
        this.perPage = response.data.meta.per_page;
        this.currentPage = response.data.meta.current_page;
        this.total = response.data.meta.total;
        this.rooms = response.data.data;
        this.loadingError = false;
      }).catch(error => {
        this.loadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Load the room types
     */
    loadRoomTypes () {
      this.roomTypesBusy = true;
      Base.call('roomTypes').then(response => {
        this.roomTypes = response.data.data;
        this.roomTypesLoadingError = false;
      }).catch(error => {
        this.roomTypesLoadingError = true;
        Base.error(error, this);
      }).finally(() => {
        this.roomTypesBusy = false;
      });
    },

    /**
     * Open room view
     * @param room
     */
    open: function (room) {
      this.openRoom = true;
      this.$router.push({ name: 'rooms.view', params: { id: room.id } });
    }
  }
};
</script>
