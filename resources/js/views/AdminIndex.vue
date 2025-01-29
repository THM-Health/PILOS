<template>
  <div>
    <h2 class="mb-2 text-2xl">{{ $t("admin.overview") }}</h2>
    <p>{{ $t("admin.overview_description") }}</p>
    <div class="my-4 grid grid-cols-12 gap-4">
      <div
        v-if="userPermissions.can('viewAny', 'SettingsPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <router-link
          :to="{ name: 'admin.settings' }"
          data-test="admin-settings-link"
        >
          <Card
            :pt="{
              title: { class: 'text-center text-primary' },
              content: { class: 'p-0' },
            }"
            class="relative h-full border text-center shadow-none border-surface rounded-border hover:bg-emphasis"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-cogs" />
              </h2>
              <span>
                {{ $t("admin.settings.title") }}
              </span>
            </template>
            <template #content>
              {{ $t("admin.settings.tile_description") }}
            </template>
          </Card>
        </router-link>
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'UserPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <router-link :to="{ name: 'admin.users' }" data-test="admin-users-link">
          <Card
            :pt="{
              title: { class: 'text-center text-primary' },
              content: { class: 'p-0' },
            }"
            class="relative h-full border text-center shadow-none border-surface rounded-border hover:bg-emphasis"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-users" />
              </h2>
              <span>
                {{ $t("app.users") }}
              </span>
            </template>
            <template #content>
              {{ $t("admin.users.tile_description") }}
            </template>
          </Card>
        </router-link>
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'RolePolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <router-link :to="{ name: 'admin.roles' }" data-test="admin-roles-link">
          <Card
            :pt="{
              title: { class: 'text-center text-primary' },
              content: { class: 'p-0' },
            }"
            class="relative h-full border text-center shadow-none border-surface rounded-border hover:bg-emphasis"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-user-tag" />
              </h2>
              <span>
                {{ $t("app.roles") }}
              </span>
            </template>
            <template #content>
              {{ $t("admin.roles.tile_description") }}
            </template>
          </Card>
        </router-link>
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'RoomTypePolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <router-link
          :to="{ name: 'admin.room_types' }"
          data-test="admin-room-types-link"
        >
          <Card
            :pt="{
              title: { class: 'text-center text-primary' },
              content: { class: 'p-0' },
            }"
            class="relative h-full border text-center shadow-none border-surface rounded-border hover:bg-emphasis"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-tags" />
              </h2>
              <span>
                {{ $t("app.room_types") }}
              </span>
            </template>
            <template #content>
              {{ $t("admin.room_types.tile_description") }}
            </template>
          </Card>
        </router-link>
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'ServerPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <router-link
          :to="{ name: 'admin.servers' }"
          data-test="admin-servers-link"
        >
          <Card
            :pt="{
              title: { class: 'text-center text-primary' },
              content: { class: 'p-0' },
            }"
            class="relative h-full border text-center shadow-none border-surface rounded-border hover:bg-emphasis"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-server" />
              </h2>
              <span>
                {{ $t("app.servers") }}
              </span>
            </template>
            <template #content>
              {{ $t("admin.servers.tile_description") }}
            </template>
          </Card>
        </router-link>
      </div>
      <div
        v-if="userPermissions.can('viewAny', 'ServerPoolPolicy')"
        class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4"
      >
        <router-link
          :to="{ name: 'admin.server_pools' }"
          data-test="admin-server-pools-link"
        >
          <Card
            :pt="{
              title: { class: 'text-center text-primary' },
              content: { class: 'p-0' },
            }"
            class="relative h-full border text-center shadow-none border-surface rounded-border hover:bg-emphasis"
          >
            <template #title>
              <h2 class="m-0">
                <i class="fa-solid fa-th-large" />
              </h2>
              <span>
                {{ $t("app.server_pools") }}
              </span>
            </template>
            <template #content>
              {{ $t("admin.server_pools.tile_description") }}
            </template>
          </Card>
        </router-link>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useUserPermissions } from "../composables/useUserPermission.js";
const userPermissions = useUserPermissions();
</script>
