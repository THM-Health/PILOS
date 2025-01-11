<template>
  <div>
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row">
      <div>
        <InputGroup>
          <InputText
            v-model="filter.name"
            :disabled="isBusy"
            :placeholder="$t('app.search')"
            @keyup.enter="loadData(1)"
          />
          <Button
            v-tooltip="$t('app.search')"
            :disabled="isBusy"
            :aria-label="$t('app.search')"
            icon="fa-solid fa-magnifying-glass"
            @click="loadData(1)"
          />
        </InputGroup>
      </div>

      <div class="flex flex-col justify-end gap-2 md:flex-row">
        <InputGroup class="min-w-80 shrink-0 grow">
          <multiselect
            ref="rolesMultiselectRef"
            v-model="filter.role"
            :placeholder="$t('admin.users.role_filter')"
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
            :disabled="rolesLoading || rolesLoadingError || isBusy"
            :loading="rolesLoading"
            :allow-empty="true"
            @update:model-value="loadData(1)"
          >
            <template #noOptions>
              {{ $t("admin.roles.no_data") }}
            </template>
            <template #option="{ option }">
              {{ option.name }}
            </template>
            <template #singleLabel="{ option }">
              {{ option.name }}
            </template>
            <template #afterList>
              <div class="flex gap-2 p-2">
                <Button
                  :disabled="rolesLoading || rolesCurrentPage === 1"
                  outlined
                  severity="secondary"
                  icon="fa-solid fa-arrow-left"
                  :label="$t('app.previous_page')"
                  @click="loadRoles(Math.max(1, rolesCurrentPage - 1))"
                />
                <Button
                  :disabled="rolesLoading || !rolesHasNextPage"
                  outlined
                  severity="secondary"
                  icon="fa-solid fa-arrow-right"
                  :label="$t('app.next_page')"
                  @click="loadRoles(rolesCurrentPage + 1)"
                />
              </div>
            </template>
          </multiselect>
          <Button
            v-if="!rolesLoadingError && filter.role"
            outlined
            severity="secondary"
            icon="fa-solid fa-xmark"
            @click="clearFilterRole"
          />

          <Button
            v-if="rolesLoadingError"
            outlined
            severity="secondary"
            icon="fa-solid fa-sync"
            @click="loadRoles(rolesCurrentPage)"
          />
        </InputGroup>
        <Button
          v-if="
            userPermissions.can('create', 'UserPolicy') &&
            settingsStore.getSetting('auth.local')
          "
          v-tooltip="$t('admin.users.new')"
          class="shrink-0"
          as="router-link"
          :aria-label="$t('admin.users.new')"
          icon="fa-solid fa-plus"
          :to="{ name: 'admin.users.new' }"
        />
      </div>
    </div>

    <DataTable
      v-model:sort-field="sortField"
      v-model:sort-order="sortOrder"
      :total-records="paginator.getTotalRecords()"
      :rows="paginator.getRows()"
      :first="paginator.getFirst()"
      :value="users"
      lazy
      data-key="id"
      paginator
      :paginator-template="paginator.getTemplate()"
      :current-page-report-template="paginator.getCurrentPageReportTemplate()"
      :loading="isBusy || loadingError"
      row-hover
      striped-rows
      :pt="{
        table: 'table-auto lg:table-fixed',
      }"
      @update:first="paginator.setFirst($event)"
      @page="onPage"
      @sort="onSort"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>
      <!-- Show message on empty user list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
            $t("admin.users.no_data")
          }}</InlineNote>
          <InlineNote v-else>{{
            $t("admin.users.no_data_filtered")
          }}</InlineNote>
        </div>
      </template>

      <Column field="id" :header="$t('app.id')" sortable class="id-column" />
      <Column field="firstname" :header="$t('app.firstname')" sortable>
        <template #body="slotProps">
          <TextTruncate>{{ slotProps.data.firstname }}</TextTruncate>
        </template>
      </Column>
      <Column field="lastname" :header="$t('app.lastname')" sortable>
        <template #body="slotProps">
          <TextTruncate>{{ slotProps.data.lastname }}</TextTruncate>
        </template>
      </Column>
      <Column field="email" :header="$t('admin.users.email')" sortable>
        <template #body="slotProps">
          <TextTruncate>{{ slotProps.data.email }}</TextTruncate>
        </template>
      </Column>
      <Column
        field="authenticator"
        :header="$t('admin.users.authenticator.title')"
        sortable
      >
        <template #body="slotProps">
          {{ $t(`admin.users.authenticator.${slotProps.data.authenticator}`) }}
        </template>
      </Column>
      <Column field="roles" :header="$t('app.roles')">
        <template #body="slotProps">
          <TextTruncate v-for="role in slotProps.data.roles" :key="role.id">
            {{ role.name }}
          </TextTruncate>
        </template>
      </Column>
      <Column
        v-if="actionColumn.visible"
        :header="$t('app.actions')"
        :class="actionColumn.classes"
      >
        <template #body="slotProps">
          <div>
            <Button
              v-if="userPermissions.can('view', slotProps.data)"
              v-tooltip="
                $t('admin.users.view', {
                  firstname: slotProps.data.firstname,
                  lastname: slotProps.data.lastname,
                })
              "
              as="router-link"
              :aria-label="
                $t('admin.users.view', {
                  firstname: slotProps.data.firstname,
                  lastname: slotProps.data.lastname,
                })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.users.view',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-eye"
            />
            <Button
              v-if="userPermissions.can('update', slotProps.data)"
              v-tooltip="
                $t('admin.users.edit', {
                  firstname: slotProps.data.firstname,
                  lastname: slotProps.data.lastname,
                })
              "
              as="router-link"
              severity="info"
              :aria-label="
                $t('admin.users.edit', {
                  firstname: slotProps.data.firstname,
                  lastname: slotProps.data.lastname,
                })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.users.edit',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-edit"
            />
            <SettingsUsersResetPasswordButton
              v-if="
                userPermissions.can('resetPassword', slotProps.data) &&
                settingsStore.getSetting('auth.local')
              "
              :id="slotProps.data.id"
              :firstname="slotProps.data.firstname"
              :lastname="slotProps.data.lastname"
              :email="slotProps.data.email"
            />
            <SettingsUsersDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :firstname="slotProps.data.firstname"
              :lastname="slotProps.data.lastname"
              @deleted="loadData()"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { onMounted, ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useSettingsStore } from "../stores/settings";
import { Multiselect } from "vue-multiselect";
import { useActionColumn } from "../composables/useActionColumn.js";
import { usePaginator } from "../composables/usePaginator.js";

const api = useApi();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
const paginator = usePaginator();

// first: view action, second: edit action (requires only view permission for current user), third: resend pw (required at least update), fourth: delete action
const actionColumn = useActionColumn([
  { permissions: ["users.view"] },
  { permissions: ["users.view"] },
  { permissions: ["users.update"] },
  { permissions: ["users.delete"] },
]);

const isBusy = ref(false);
const loadingError = ref(false);
const users = ref([]);
const sortField = ref("id");
const sortOrder = ref(1);

const filter = ref({
  name: undefined,
  role: undefined,
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
function loadRoles(page = 1) {
  rolesLoading.value = true;

  const config = {
    params: {
      page,
    },
  };

  api
    .call("roles", config)
    .then((response) => {
      rolesLoadingError.value = false;
      roles.value = response.data.data;
      rolesCurrentPage.value = page;
      rolesHasNextPage.value = page < response.data.meta.last_page;
    })
    .catch((error) => {
      rolesMultiselectRef.value.deactivate();
      rolesLoadingError.value = true;
      error(error, this.$root, error.message);
    })
    .finally(() => {
      rolesLoading.value = false;
    });
}

/**
 * Loads the users from the backend
 *
 */
function loadData(page = null) {
  isBusy.value = true;
  loadingError.value = false;

  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
      name: filter.value.name,
      role: filter.value.role?.id,
    },
  };

  api
    .call("users", config)
    .then((response) => {
      users.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      paginator.revertFirst();
      api.error(error);
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage(event) {
  loadData(event.page + 1);
}

function onSort() {
  loadData(1);
}

/**
 * Clears the role filter and reloads users
 *
 */
function clearFilterRole() {
  filter.value.role = null;
  loadData(1);
}
</script>
