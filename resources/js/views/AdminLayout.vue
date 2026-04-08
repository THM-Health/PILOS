<template>
  <div class="container mt-4 mb-8">
    <Card :pt="{ content: { class: 'p-0' } }">
      <template #header>
        <div class="flex flex-col gap-2 border-b border-surface p-4">
          <h1 class="text-3xl font-medium">
            {{ $t("admin.title") }}
          </h1>

          <Breadcrumb
            v-if="breadcrumbs.length > 0"
            :home="home"
            class="px-0 py-2"
            :model="breadcrumbs"
            data-test="admin-breadcrumb"
          >
            <template #item="{ item, props }">
              <router-link
                v-if="item.route"
                v-slot="{ href, navigate }"
                :to="item.route"
                custom
              >
                <a
                  :href="href"
                  v-bind="props.action"
                  class="text-primary"
                  @click="navigate"
                >
                  <span :class="[item.icon]" />
                  <span>{{ item.label }}</span>
                </a>
              </router-link>
              <a v-else class="text-muted-color">
                <span :class="[item.icon]" />
                <span>{{ item.label }}</span>
              </a>
            </template>
          </Breadcrumb>
        </div>
      </template>
      <template #content>
        <router-view :key="$route.fullPath" />
      </template>
    </Card>
  </div>
</template>
<script setup>
import { computed, provide, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const breakcrumbLabelData = ref({});
provide("breakcrumbLabelData", breakcrumbLabelData);

const route = useRoute();
const { t } = useI18n();

const home = ref({
  icon: "fa-solid fa-home",
  route: { name: "admin" },
});

const breadcrumbs = computed(() => {
  const routes = {
    "admin.settings": {
      title: t("admin.breadcrumbs.settings"),
      previous: null,
    },
    "admin.users": {
      title: t("admin.breadcrumbs.users.index"),
      previous: null,
    },
    "admin.users.new": {
      title: t("admin.breadcrumbs.users.new"),
      previous: "admin.users",
    },
    "admin.users.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.users.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.users",
    },
    "admin.users.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.users.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.users",
    },
    "admin.roles": {
      title: t("admin.breadcrumbs.roles.index"),
      previous: null,
    },
    "admin.roles.new": {
      title: t("admin.breadcrumbs.roles.new"),
      previous: "admin.roles",
    },
    "admin.roles.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.roles.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.roles",
    },
    "admin.roles.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.roles.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.roles",
    },
    "admin.room_types": {
      title: t("admin.breadcrumbs.room_types.index"),
      previous: null,
    },
    "admin.room_types.new": {
      title: t("admin.breadcrumbs.room_types.new"),
      previous: "admin.room_types",
    },
    "admin.room_types.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.room_types.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.room_types",
    },
    "admin.room_types.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.room_types.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.room_types",
    },
    "admin.servers": {
      title: t("admin.breadcrumbs.servers.index"),
      previous: null,
    },
    "admin.servers.new": {
      title: t("admin.breadcrumbs.servers.new"),
      previous: "admin.servers",
    },
    "admin.servers.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.servers.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.servers",
    },
    "admin.servers.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.servers.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.servers",
    },
    "admin.server_pools": {
      title: t("admin.breadcrumbs.server_pools.index"),
      previous: null,
    },
    "admin.server_pools.new": {
      title: t("admin.breadcrumbs.server_pools.new"),
      previous: "admin.server_pools",
    },
    "admin.server_pools.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.server_pools.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.server_pools",
    },
    "admin.server_pools.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breadcrumbs.server_pools.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.server_pools",
    },
    "admin.streaming_settings": {
      title: t("admin.breadcrumbs.streaming_settings"),
      previous: null,
    },
  };

  const currentRoute = routes[route.name];
  if (!currentRoute) return [];
  let previousRoute = currentRoute.previous;
  const breadcrumbs = [
    {
      label: currentRoute.title,
    },
  ];
  while (routes[previousRoute]) {
    breadcrumbs.unshift({
      label: routes[previousRoute].title,
      route: { name: previousRoute },
    });
    previousRoute = previousRoute.previous;
  }

  return breadcrumbs;
});

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

watch(route, () => {
  breakcrumbLabelData.value = {};
});
</script>
