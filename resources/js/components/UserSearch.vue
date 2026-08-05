<template>
  <multiselect
    v-model="model"
    :aria-labelledby="props.ariaLabelledby"
    :data-test="props.dataTest"
    autofocus
    track-by="id"
    :placeholder="
      settingsStore.getSetting('user.search_by_name')
        ? $t('rooms.members.modals.add.placeholder')
        : $t('rooms.members.modals.add.placeholder_email_only')
    "
    open-direction="bottom"
    :options="users"
    :multiple="false"
    :searchable="true"
    :loading="isLoadingSearch"
    :disabled="props.disabled"
    :internal-search="false"
    :clear-on-select="false"
    :preserve-search="true"
    :close-on-select="true"
    :options-limit="300"
    :max-height="150"
    :show-no-results="true"
    :show-labels="false"
    :class="{ 'is-invalid': props.invalid }"
    @search-change="onSearchChange"
  >
    <template #noResult>
      <span v-if="tooManyResults" class="whitespace-normal">
        {{ $t("rooms.members.modals.add.too_many_results") }}
      </span>
      <span v-else>
        {{ $t("rooms.members.modals.add.no_result") }}
      </span>
    </template>
    <template #afterList>
      <span v-if="isLoadingSearch" class="multiselect__option">
        {{ $t("rooms.members.modals.add.searching") }}
      </span>
    </template>
    <template #noOptions>
      {{
        settingsStore.getSetting("user.search_by_name")
          ? $t("rooms.members.modals.add.no_options")
          : $t("rooms.members.modals.add.no_options_email_only")
      }}
    </template>
    <template #option="{ option }">
      {{ option.firstname }} {{ option.lastname }}<br /><small>{{
        option.email
      }}</small>
    </template>
    <template #singleLabel="{ option }">
      {{ option.firstname }} {{ option.lastname }}
    </template>
  </multiselect>
</template>
<script setup>
import Multiselect from "vue-multiselect";
import { onUnmounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useDebounceFn } from "@vueuse/core";
import { useSettingsStore } from "../stores/settings.js";

const model = defineModel({ type: [Object, null] });
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  disabledUsers: {
    type: Array,
    default: () => [],
  },
  invalid: {
    type: Boolean,
    default: false,
  },
  ariaLabelledby: {
    type: String,
    required: true,
  },
  dataTest: {
    type: [String, null],
    default: null,
  },
});

onUnmounted(() => {
  abortController.abort();
});

const api = useApi();
const settingsStore = useSettingsStore();
const users = ref([]);
const tooManyResults = ref(false);
const isLoadingSearch = ref(false);

let abortController = new AbortController();

function onSearchChange(query) {
  isLoadingSearch.value = true;
  tooManyResults.value = false;
  users.value = [];
  search(query);
}

/**
 * Search for users in database
 * @param query
 */
const search = useDebounceFn((query) => {
  // Cancel previous request
  abortController.abort();

  abortController = new AbortController();
  const config = {
    params: {
      query,
    },
    signal: abortController.signal,
  };

  api
    .call("users/search", config)
    .then((response) => {
      isLoadingSearch.value = false;

      if (response.status === 204) {
        tooManyResults.value = true;
        return;
      }

      users.value = response.data.data.map((user) => {
        if (props.disabledUsers.includes(user.id)) {
          user.$isDisabled = true;
        }
        return user;
      });
    })
    .catch((error) => {
      if (error.code === "ERR_CANCELED") {
        return;
      }

      isLoadingSearch.value = false;

      api.error(error, { redirectOnUnauthenticated: false });
    });
}, 300);
</script>
