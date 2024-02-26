<template>
  <div>
    <div class="flex justify-content-between align-items-center">
      <h2>
        {{ $t('app.users') }}
      </h2>
      <router-link
        v-if="userPermissions.can('create', 'UserPolicy') && settingsStore.getSetting('auth.local')"
        ref="new-user-button"
        v-tooltip.left="$t('settings.users.new')"
        class="p-button p-button-success p-button-icon-only"
        :to="{ name: 'settings.users.new' }"
      >
        <i class="fa-solid fa-plus" />
      </router-link>
    </div>

    <div class="grid">
      <div class="col flex flex-column md:flex-row">
        <div>
          <InputGroup>
            <InputText
              v-model="filter.name"
              :disabled="isBusy"
              :placeholder="$t('app.search')"
              @keyup.enter="loadData"
            />
            <Button
              :disabled="isBusy"
              @click="loadData"
              v-tooltip="$t('app.search')"
              :aria-label="$t('app.search')"
              icon="fa-solid fa-magnifying-glass"
            ></Button>
          </InputGroup>
        </div>
      </div>

      <div class="col-12 sm:col-12 md:col-4 md:col-offset-4">
        <InputGroup>
          <multiselect
            id="roles"
            ref="rolesMultiselectRef"
            v-model="filter.role"
            @update:modelValue="loadData"
            :placeholder="$t('settings.users.role_filter')"
            track-by="id"
            open-direction="bottom"
            :multiple="false"
            :searchable="false"
            :internal-search="false"
            :clear-on-select="false"
            :close-on-select="false"
            :show-no-results="false"
            :show-labels="false"
            :options="roles"
            :disabled="rolesLoadingError"
            :loading="rolesLoading"
            :allow-empty="true"
            class="multiselect-form-control"
          >
            <template #noOptions>
              {{ $t('settings.roles.no_data') }}
            </template>
            <template v-slot:option="{ option }">
              {{ $te(`app.role_labels.${option.name}`) ? $t(`app.role_labels.${option.name}`) : option.name }}
            </template>
            <template v-slot:singleLabel="{ option }">
              {{ $te(`app.role_labels.${option.name}`) ? $t(`app.role_labels.${option.name}`) : option.name }}
            </template>
            <template #afterList>
              <div class="flex p-2 gap-2">
              <Button
                :disabled="rolesLoading || rolesCurrentPage === 1"
                outlined
                severity="secondary"
                @click="loadRoles(Math.max(1, rolesCurrentPage - 1))"
                icon="fa-solid fa-arrow-left"
                :label="$t('app.previous_page')"
              ></Button>
              <Button
                :disabled="rolesLoading || !rolesHasNextPage"
                outlined
                severity="secondary"
                @click="loadRoles(rolesCurrentPage + 1)"
                icon="fa-solid fa-arrow-right"
                :label=" $t('app.next_page') "
              ></Button>
              </div>
            </template>
          </multiselect>
            <Button
              v-if="!rolesLoadingError && filter.role"
              ref="clearRolesButton"
              outlined
              severity="secondary"
              @click="clearFilterRole"
              icon="fa-solid fa-xmark"
            ></Button>

            <Button
              v-if="rolesLoadingError"
              ref="reloadRolesButton"
              outlined
              badge-severity="secondary"
              @click="loadRoles(rolesCurrentPage)"
              icon="fa-solid fa-sync"
            ></Button>
        </InputGroup>
      </div>
    </div>
    <Divider/>

    <DataTable
      :totalRecords="meta.total"
      :rows="meta.per_page"
      :value="users"
      lazy
      dataKey="id"
      paginator
      :loading="isBusy || loadingError"
      rowHover
      v-model:sortField="sortField"
      v-model:sortOrder="sortOrder"
      @page="onPage"
      @sort="onSort"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData" />
      </template>
      <!-- Show message on empty user list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="meta.total_no_filter === 0">{{ $t('settings.users.no_data') }}</InlineNote>
          <InlineNote v-else>{{ $t('settings.users.no_data_filtered') }}</InlineNote>
        </div>
      </template>

<!--      ToDo fix Column size-->
      <Column field="id" :header="$t('app.id')" sortable style="width: 1px"/>
      <Column field="firstname" :header="$t('app.firstname')" sortable style="max-width: 200px">
        <template #body="slotProps">
          <TextTruncate>
            {{slotProps.data.firstname}}
          </TextTruncate>
        </template>
      </Column>
      <Column field="lastname" :header="$t('app.lastname')" sortable style="max-width: 200px">
        <template #body="slotProps">
          <TextTruncate>
            {{slotProps.data.lastname}}
          </TextTruncate>
        </template>
      </Column>
      <Column field="email" :header="$t('settings.users.email')" sortable style="max-width: 200px">
        <template #body="slotProps">
          <TextTruncate>
            {{slotProps.data.email}}
          </TextTruncate>
        </template>
      </Column>
      <Column field="authenticator" :header="$t('settings.users.authenticator.title')" sortable style="width: 1px">
        <template #body="slotProps">
          {{ $t(`settings.users.authenticator.${slotProps.data.authenticator}`) }}
        </template>
      </Column>
      <Column field="roles" :header="$t('app.roles')" style="max-width: 200px">
        <template #body="slotProps">
          <text-truncate
            v-for="role in slotProps.data.roles"
            :key="role.id"
          >
            {{ $te(`app.role_labels.${role.name}`) ? $t(`app.role_labels.${role.name}`) : role.name }}
          </text-truncate>
        </template>
      </Column>
      <Column :header="$t('app.actions')" class="action-column">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
                <router-link
                  v-if="userPermissions.can('view', slotProps.data)"
                  class="p-button p-button-icon-only p-button-info"
                  v-tooltip="$t('settings.users.view', { firstname: slotProps.data.firstname, lastname: slotProps.data.lastname })"
                  :aria-label="$t('settings.users.view', { firstname: slotProps.data.firstname, lastname: slotProps.data.lastname })"
                  :disabled="isBusy"
                  :to="{ name: 'settings.users.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
                >
                  <i class="fa-solid fa-eye" />
                </router-link>
                <router-link
                  v-if="userPermissions.can('update', slotProps.data)"
                  class="p-button p-button-icon-only p-button-secondary"
                  v-tooltip="$t('settings.users.edit', { firstname: slotProps.data.firstname, lastname: slotProps.data.lastname })"
                  :aria-label="$t('settings.users.edit', { firstname: slotProps.data.firstname, lastname: slotProps.data.lastname })"
                  :disabled="isBusy"
                  :to="{ name: 'settings.users.view', params: { id: slotProps.data.id } }"
                >
                  <i class="fa-solid fa-edit" />
                </router-link>
                <SettingsUsersResetPasswordButton
                  v-if="userPermissions.can('resetPassword', slotProps.data) && settingsStore.getSetting('auth.local')"
                  :id="slotProps.data.id"
                  :firstname="slotProps.data.firstname"
                  :lastname="slotProps.data.lastname"
                  :email="slotProps.data.email"
                ></SettingsUsersResetPasswordButton>
                <SettingsUsersDeleteButton
                  v-if="userPermissions.can('delete', slotProps.data)"
                  :id="slotProps.data.id"
                  :firstname="slotProps.data.firstname"
                  :lastname="slotProps.data.lastname"
                  @deleted="loadData"
                ></SettingsUsersDeleteButton>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi.js';
import { onMounted, ref } from 'vue';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useSettingsStore } from '@/stores/settings';
import { Multiselect } from 'vue-multiselect';

const api = useApi();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();

const isBusy = ref(false);
const loadingError = ref(false);
const users = ref([]);
const currentPage = ref(1);
const sortField = ref('id');
const sortOrder = ref(1);
const meta = ref({
  current_page: 0,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});
const filter = ref({
  name: undefined,
  role: undefined
});

const roles = ref([]);
const rolesLoading = ref(false);
const rolesLoadingError = ref(false);
const rolesCurrentPage = ref(1);
const rolesHasNextPage = ref(false);
const rolesMultiselectRef = ref();

/**
 * Loads the user, part of roles that can be selected and enables an event listener
 * to enable or disable the edition of roles and attributes when the permissions
 * of the current user gets changed.
 */
onMounted(() => {
  loadRoles();
  loadData();
});

/**
 * Loads the roles for the passed page, that can be selected through the multiselect.
 *
 * @param [page=1] The page to load the roles for.
 */
function loadRoles (page = 1) {
  rolesLoading.value = true;

  const config = {
    params: {
      page
    }
  };

  api.call('roles', config).then(response => {
    rolesLoadingError.value = false;
    roles.value = response.data.data;
    rolesCurrentPage.value = page;
    rolesHasNextPage.value = page < response.data.meta.last_page;
  }).catch(error => {
    rolesMultiselectRef.value.deactivate();
    rolesLoadingError.value = true;
    error(error, this.$root, error.message);
  }).finally(() => {
    rolesLoading.value = false;
  });
}

/**
 * Loads the users from the backend
 *
 */
function loadData () {
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: currentPage.value,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      name: filter.value.name,
      role: filter.value.role?.id
    }
  };

  api.call('users', config).then(response => {
    meta.value = response.data.meta;
    users.value = response.data.data;
  }).catch(error => {
    api.error(error);
    loadingError.value = true;
  }).finally(() => {
    isBusy.value = false;
  });
}

function onPage (event) {
  currentPage.value = event.page + 1;
  loadData();
}

function onSort () {
  currentPage.value = 1;
  loadData();
}

/**
 * Clears the role filter and reloads users
 *
 */
function clearFilterRole () {
  filter.value.role = null;
  loadData();
}

</script>
