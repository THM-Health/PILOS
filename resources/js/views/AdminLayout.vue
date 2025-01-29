<template>
  <div class="container mb-8 mt-4">
    <Card :pt="{ content: { class: 'p-0' } }">
      <template #header>
        <div class="flex flex-col gap-2 border-b p-4 border-surface">
          <h1 class="text-3xl font-medium">
            {{ $t("admin.title") }}
          </h1>

          <Breadcrumb
            v-if="breakcrumbs.length > 0"
            :home="home"
            class="px-0 py-2"
            :model="breakcrumbs"
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

const breakcrumbs = computed(() => {
  const routes = {
    "admin.settings": {
      title: t("admin.breakcrumbs.settings"),
      previous: null,
    },
    "admin.users": {
      title: t("admin.breakcrumbs.users.index"),
      previous: null,
    },
    "admin.users.new": {
      title: t("admin.breakcrumbs.users.new"),
      previous: "admin.users",
    },
    "admin.users.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.users.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.users",
    },
    "admin.users.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.users.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.users",
    },
    "admin.roles": {
      title: t("admin.breakcrumbs.roles.index"),
      previous: null,
    },
    "admin.roles.new": {
      title: t("admin.breakcrumbs.roles.new"),
      previous: "admin.roles",
    },
    "admin.roles.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.roles.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.roles",
    },
    "admin.roles.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.roles.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.roles",
    },
    "admin.room_types": {
      title: t("admin.breakcrumbs.room_types.index"),
      previous: null,
    },
    "admin.room_types.new": {
      title: t("admin.breakcrumbs.room_types.new"),
      previous: "admin.room_types",
    },
    "admin.room_types.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.room_types.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.room_types",
    },
    "admin.room_types.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.room_types.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.room_types",
    },
    "admin.servers": {
      title: t("admin.breakcrumbs.servers.index"),
      previous: null,
    },
    "admin.servers.new": {
      title: t("admin.breakcrumbs.servers.new"),
      previous: "admin.servers",
    },
    "admin.servers.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.servers.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.servers",
    },
    "admin.servers.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.servers.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.servers",
    },
    "admin.server_pools": {
      title: t("admin.breakcrumbs.server_pools.index"),
      previous: null,
    },
    "admin.server_pools.new": {
      title: t("admin.breakcrumbs.server_pools.new"),
      previous: "admin.server_pools",
    },
    "admin.server_pools.view": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.server_pools.view", breakcrumbLabelData.value)
        : "",
      previous: "admin.server_pools",
    },
    "admin.server_pools.edit": {
      title: !isEmpty(breakcrumbLabelData.value)
        ? t("admin.breakcrumbs.server_pools.edit", breakcrumbLabelData.value)
        : "",
      previous: "admin.server_pools",
    },
  };

  const currentRoute = routes[route.name];
  if (!currentRoute) return [];
  let previousRoute = currentRoute.previous;
  const breakcrumbs = [
    {
      label: currentRoute.title,
    },
  ];
  while (routes[previousRoute]) {
    breakcrumbs.unshift({
      label: routes[previousRoute].title,
      route: { name: previousRoute },
    });
    previousRoute = previousRoute.previous;
  }

  return breakcrumbs;
});

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

watch(route, () => {
  breakcrumbLabelData.value = {};
});
</script>
