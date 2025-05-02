<template>
  <div>
    <h2 class="mb-2 text-2xl">{{ $t("admin.overview") }}</h2>
    <p>{{ $t("admin.overview_description") }}</p>
    <div class="my-4 grid grid-cols-12 gap-4">
      <div
        v-if="userPermissions.can('viewAny', 'SettingsPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <admin-overview-card
          :to="{ name: 'admin.settings' }"
          icon="fa-cogs"
          :title="$t('admin.settings.title')"
          :description="$t('admin.settings.tile_description')"
          data-test="admin-settings-link"
        />
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'UserPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <admin-overview-card
          :to="{ name: 'admin.users' }"
          icon="fa-users"
          :title="$t('app.users')"
          :description="$t('admin.users.tile_description')"
          data-test="admin-users-link"
        />
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'RolePolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <admin-overview-card
          :to="{ name: 'admin.roles' }"
          icon="fa-user-tag"
          :title="$t('app.roles')"
          :description="$t('admin.roles.tile_description')"
          data-test="admin-roles-link"
        />
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'RoomTypePolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <admin-overview-card
          :to="{ name: 'admin.room_types' }"
          icon="fa-tags"
          :title="$t('app.room_types')"
          :description="$t('admin.room_types.tile_description')"
          data-test="admin-room-types-link"
        />
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'ServerPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <admin-overview-card
          :to="{ name: 'admin.servers' }"
          icon="fa-server"
          :title="$t('app.servers')"
          :description="$t('admin.servers.tile_description')"
          data-test="admin-servers-link"
        />
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'ServerPoolPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <admin-overview-card
          :to="{ name: 'admin.server_pools' }"
          icon="fa-th-large"
          :title="$t('app.server_pools')"
          :description="$t('admin.server_pools.tile_description')"
          data-test="admin-server-pools-link"
        />
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'StreamingPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <admin-overview-card
          :to="{ name: 'admin.streaming_settings' }"
          icon="fa-broadcast-tower"
          :title="$t('app.streaming')"
          :description="$t('admin.streaming.tile_description')"
          :disabled="!settingsStore.getSetting('streaming.enabled')"
          data-test="admin-streaming-link"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useSettingsStore } from "../stores/settings";
import AdminOverviewCard from "../components/AdminOverviewCard.vue";
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
</script>
