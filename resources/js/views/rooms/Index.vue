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
            <b-button @click="loadRooms" :disabled="isBusy || loadingError" variant="primary" v-tooltip-hide-click v-b-tooltip.hover :title="$t('app.toSearch')"><i class="fa-solid fa-magnifying-glass"></i></b-button>
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
                  <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
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
        <b-button :disabled="isBusy || roomTypesBusy || loadingError || roomTypesLoadingError" class="mt-3" variant="primary" @click="loadRooms"><i class="fa-solid fa-filter"></i> {{ $t('rooms.filter.apply') }}</b-button>
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
                <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
              </b-button>
            </div>
          </template>

          <em v-if="!isBusy && !loadingError && !rooms.length">{{ $t('rooms.noRoomsAvailable') }}</em>

          <b-list-group>
            <b-list-group-item button :disabled="openRoom" v-for="room in rooms" :key="room.id" @click="open(room)" class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <room-status-component :running="room.running"></room-status-component>
                <div>
                  <h5 class="mb-0">{{ room.name }}</h5>
                  <small>
                    {{ room.owner.name }}
                  </small>
                </div>
                <div v-if="room.type" v-b-tooltip.hover :title="room.type.description" class="room-icon" :style="{ 'background-color': room.type.color}">{{room.type.short}}</div>
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
import PermissionService from '../../services/PermissionService';
import RoomStatusComponent from '../../components/Room/RoomStatusComponent';

export default {
  components: { RoomStatusComponent, Can, Cannot },

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

      config.params.room_types = this.filterRoomTypes;

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

      let config;

      if (PermissionService.cannot('viewAll', 'RoomPolicy')) {
        config = {
          params: {
            filter: 'searchable'
          }
        };
      }

      Base.call('roomTypes', config).then(response => {
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
