<template>
  <div>
    <div class="mb-6 flex justify-end">
      <div v-if="model.id && id !== 'new'" class="flex gap-2">
        <Button
          v-if="!viewOnly && userPermissions.can('view', model)"
          as="router-link"
          severity="secondary"
          :disabled="isBusy"
          :to="{ name: 'admin.room_types.view', params: { id: model.id } }"
          :label="$t('app.cancel_editing')"
          icon="fa-solid fa-times"
        />
        <Button
          v-if="viewOnly && userPermissions.can('update', model)"
          as="router-link"
          severity="info"
          :disabled="isBusy"
          :to="{ name: 'admin.room_types.edit', params: { id: model.id } }"
          :label="$t('app.edit')"
          icon="fa-solid fa-edit"
        />
        <SettingsRoomTypesDeleteButton
          v-if="userPermissions.can('delete', model)"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'admin.room_types' })"
        />
      </div>
    </div>
    <OverlayComponent :show="isBusy || modelLoadingError">
      <template #loading>
        <LoadingRetryButton
          :error="modelLoadingError"
          @reload="loadRoomType"
        ></LoadingRetryButton>
      </template>
      <form class="flex flex-col gap-4" @submit.prevent="saveRoomType">
        <!-- General room type settings -->
        <AdminPanel :title="$t('rooms.settings.general.title')">
          <!-- Room type name -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="room-type-name"
              class="col-span-12 md:col-span-4 md:mb-0"
              >{{ $t("app.model_name") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <InputText
                id="room-type-name"
                v-model="model.name"
                class="w-full"
                type="text"
                :invalid="formErrors.fieldInvalid('name')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <FormError :errors="formErrors.fieldError('name')" />
            </div>
          </div>

          <!-- Room type description -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="description"
              class="col-span-12 md:col-span-4 md:mb-0"
              >{{ $t("app.description") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <Textarea
                id="description"
                v-model="model.description"
                class="w-full"
                :invalid="formErrors.fieldInvalid('description')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <FormError :errors="formErrors.fieldError('description')" />
            </div>
          </div>

          <!-- Room type color -->
          <fieldset class="field grid grid-cols-12 gap-4">
            <legend class="col-span-12 items-start md:col-span-4 md:mb-0">
              {{ $t("admin.room_types.color") }}
            </legend>
            <div class="col-span-12 md:col-span-8">
              <ColorSelect
                v-model="model.color"
                class="mb-2"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :colors="colors.getAllColors()"
              />
              <label for="custom-color">{{
                $t("admin.room_types.custom_color")
              }}</label>
              <InputText
                id="custom-color"
                v-model="model.color"
                class="w-full"
                type="text"
                :invalid="formErrors.fieldInvalid('color')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <FormError :errors="formErrors.fieldError('color')" />
            </div>
          </fieldset>

          <!-- Preview -->
          <div class="field grid grid-cols-12 gap-4">
            <label class="col-span-12 md:col-span-4 md:mb-0">{{
              $t("admin.room_types.preview")
            }}</label>
            <div class="col-span-12 flex items-center md:col-span-8">
              <RoomTypeBadge :room-type="model" />
            </div>
          </div>

          <!-- Server pool for this room type -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              id="server-pool-label"
              class="col-span-12 items-start md:col-span-4 md:mb-0"
              >{{ $t("app.server_pool") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <InputGroup>
                <multiselect
                  ref="serverPoolMultiselectRef"
                  v-model="model.server_pool"
                  aria-labelledby="server-pool-label"
                  :placeholder="$t('admin.room_types.select_server_pool')"
                  track-by="id"
                  label="name"
                  open-direction="bottom"
                  :multiple="false"
                  :searchable="false"
                  :internal-search="false"
                  :clear-on-select="false"
                  :close-on-select="false"
                  :show-no-results="false"
                  :show-labels="false"
                  :options="serverPools"
                  :disabled="
                    isBusy ||
                    modelLoadingError ||
                    serverPoolsLoading ||
                    serverPoolsLoadingError ||
                    viewOnly
                  "
                  :loading="serverPoolsLoading"
                  :allow-empty="false"
                  :class="{
                    'is-invalid': formErrors.fieldInvalid('server_pool'),
                  }"
                  aria-describedby="server_pool-help"
                >
                  <template #noOptions>
                    {{ $t("admin.server_pools.no_data") }}
                  </template>
                  <template #afterList>
                    <div class="flex gap-2 p-2">
                      <Button
                        :disabled="
                          serverPoolsLoading || serverPoolsCurrentPage === 1
                        "
                        severity="secondary"
                        outlined
                        icon="fa-solid fa-arrow-left"
                        :label="$t('app.previous_page')"
                        @click="
                          loadServerPools(
                            Math.max(1, serverPoolsCurrentPage - 1),
                          )
                        "
                      />
                      <Button
                        :disabled="
                          serverPoolsLoading || !serverPoolsHasNextPage
                        "
                        severity="secondary"
                        outlined
                        icon="fa-solid fa-arrow-right"
                        :label="$t('app.next_page')"
                        @click="loadServerPools(serverPoolsCurrentPage + 1)"
                      />
                    </div>
                  </template>
                </multiselect>
                <Button
                  v-if="serverPoolsLoadingError"
                  severity="secondary"
                  outlined
                  icon="fa-solid fa-sync"
                  @click="loadServerPools(serverPoolsCurrentPage)"
                />
              </InputGroup>
              <FormError :errors="formErrors.fieldError('server_pool')" />
              <small id="server_pool-help">{{
                $t("admin.room_types.server_pool_description")
              }}</small>
            </div>
          </div>

          <!-- Option to restrict the usage of this room type to selected roles-->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="restrict"
              class="col-span-12 items-start md:col-span-4 md:mb-0"
              >{{ $t("admin.room_types.restrict") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div>
                <ToggleSwitch
                  v-model="model.restrict"
                  input-id="restrict"
                  :invalid="formErrors.fieldInvalid('restrict')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  aria-describedby="restrict-help"
                />
              </div>
              <FormError :errors="formErrors.fieldError('restrict')" />
              <small id="restrict-help">{{
                $t("admin.room_types.restrict_description")
              }}</small>
            </div>
          </div>

          <!-- Selection of the roles -->
          <div v-if="model.restrict" class="field grid grid-cols-12 gap-4">
            <label id="roles-label" class="col-span-12 md:col-span-4 md:mb-0">{{
              $t("app.roles")
            }}</label>
            <div class="col-span-12 md:col-span-8">
              <RoleSelect
                v-model="model.roles"
                aria-labelledby="roles-label"
                :invalid="formErrors.fieldInvalid('roles')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                @busy="(value) => (rolesLoading = value)"
                @roles-loading-error="(value) => (rolesLoadingError = value)"
              />
              <FormError :errors="formErrors.fieldError('roles')" />
            </div>
          </div>

          <!-- Maximum number of participants -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="max-participants"
              class="col-span-12 items-start md:col-span-4 md:mb-0"
              >{{ $t("admin.room_types.max_participants") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <InputGroup>
                <InputNumber
                  v-model="model.max_participants"
                  input-id="max-participants"
                  :invalid="formErrors.fieldInvalid('max_participants')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :placeholder="$t('app.unlimited')"
                />
                <Button
                  icon="fa-solid fa-xmark"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  @click="model.max_participants = null"
                />
              </InputGroup>
              <FormError :errors="formErrors.fieldError('max_participants')" />
            </div>
          </div>

          <!-- Maximum duration -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="max-duration"
              class="col-span-12 items-start md:col-span-4 md:mb-0"
              >{{ $t("admin.room_types.max_duration") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <InputGroup>
                <InputNumber
                  v-model="model.max_duration"
                  input-id="max-duration"
                  :invalid="formErrors.fieldInvalid('max_duration')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :placeholder="$t('app.unlimited')"
                  suffix=" min."
                />
                <Button
                  icon="fa-solid fa-xmark"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  @click="model.max_duration = null"
                />
              </InputGroup>
              <FormError :errors="formErrors.fieldError('max_duration')" />
            </div>
          </div>
        </AdminPanel>
        <!-- Default room settings -->
        <AdminPanel :title="$t('admin.room_types.default_room_settings.title')">
          <!-- General room settings -->
          <h4 class="text-lg font-medium">
            {{ $t("rooms.settings.general.title") }}
          </h4>

          <!-- Has access code setting (defines if the room should have an access code) -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="has-access-code-default"
              class="col-span-12 items-center md:col-span-4 md:m-0"
            >
              {{ $t("rooms.settings.general.has_access_code") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.has_access_code_default"
                  input-id="has-access-code-default"
                  :invalid="formErrors.fieldInvalid('has_access_code_default')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.has_access_code_enforced"
                  :invalid="formErrors.fieldInvalid('has_access_code_enforced')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="has-access-code-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('has_access_code_default')"
                />
                <FormError
                  :errors="formErrors.fieldError('has_access_code_enforced')"
                />
              </div>
            </div>
          </div>

          <!-- Allow guests to access the room -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="allow-guests-default"
              class="col-span-12 items-center md:col-span-4 md:m-0"
              >{{ $t("rooms.settings.general.allow_guests") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.allow_guests_default"
                  input-id="allow-guests-default"
                  :invalid="formErrors.fieldInvalid('allow_guests_default')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.allow_guests_enforced"
                  :invalid="formErrors.fieldInvalid('allow_guests_enforced')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="allow-guests-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('allow_guests_default')"
                />
                <FormError
                  :errors="formErrors.fieldError('allow_guests_enforced')"
                />
              </div>
            </div>
          </div>

          <!--
          Expert settings (settings that will only appear in the room settings if the expert mode is activated)
          When the expert mode is deactivated the default values from the room type will be used
          -->
          <!-- Everyone can start a new meeting, not only the moderator -->
          <h4 class="text-lg font-medium">
            {{ $t("rooms.settings.video_conference.title") }}
          </h4>

          <div class="field grid grid-cols-12 gap-4">
            <label
              for="everyone-can-start-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t("rooms.settings.video_conference.everyone_can_start")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.everyone_can_start_default"
                  input-id="everyone-can-start-default"
                  :invalid="
                    formErrors.fieldInvalid('everyone_can_start_default')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.everyone_can_start_enforced"
                  :invalid="
                    formErrors.fieldInvalid('everyone_can_start_enforced')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="everyone-can-start-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('everyone_can_start_default')"
                />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('everyone_can_start_enforced')"
                />
              </div>
            </div>
          </div>

          <!-- Mute everyone*s microphone on meeting join -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="mute-on-start-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{ $t("rooms.settings.video_conference.mute_on_start") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.mute_on_start_default"
                  input-id="mute-on-start-default"
                  :invalid="formErrors.fieldInvalid('mute_on_start_default')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.mute_on_start_enforced"
                  :invalid="formErrors.fieldInvalid('mute_on_start_enforced')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="mute-on-start-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('mute_on_start_default')"
                />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('mute_on_start_enforced')"
                />
              </div>
            </div>
          </div>

          <!-- Usage of the waiting room/guest lobby -->
          <div class="field grid grid-cols-12 gap-4">
            <label class="col-span-12 items-center md:col-span-4 md:mb-0">{{
              $t("rooms.settings.video_conference.lobby.title")
            }}</label>
            <div class="col-span-12 mb-2 md:col-span-8">
              <div class="flex flex-row items-center justify-between">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <RadioButton
                      v-model.number="model.lobby_default"
                      :disabled="isBusy || modelLoadingError || viewOnly"
                      :value="0"
                      name="lobby"
                      input-id="lobby-disabled"
                    />
                    <label for="lobby-disabled">{{ $t("app.disabled") }}</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton
                      v-model.number="model.lobby_default"
                      :disabled="isBusy || modelLoadingError || viewOnly"
                      :value="1"
                      name="lobby"
                      input-id="lobby-enabled"
                    />
                    <label for="lobby-enabled">{{ $t("app.enabled") }}</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton
                      v-model.number="model.lobby_default"
                      :disabled="isBusy || modelLoadingError || viewOnly"
                      :value="2"
                      name="lobby"
                      input-id="lobby-only-for-guests"
                    />
                    <label for="lobby-only-for-guests">{{
                      $t(
                        "rooms.settings.video_conference.lobby.only_for_guests_enabled",
                      )
                    }}</label>
                  </div>
                </div>
                <ToggleButton
                  v-model="model.lobby_enforced"
                  :invalid="formErrors.fieldInvalid('lobby_enforced')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="lobby-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError :errors="formErrors.fieldError('lobby_default')" />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('lobby_enforced')"
                />
              </div>
            </div>
            <div class="col-span-12">
              <!-- Alert shown when default role is moderator and waiting room is active -->
              <InlineNote v-if="showLobbyAlert" class="w-full" severity="warn">
                {{ $t("rooms.settings.video_conference.lobby.alert") }}
              </InlineNote>
            </div>
          </div>

          <!-- Record settings -->
          <h4 class="text-lg font-medium">
            {{ $t("rooms.settings.recordings.title") }}
          </h4>

          <!-- Record attendance of users and guests -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="record-attendance-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{ $t("rooms.settings.recordings.record_attendance") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.record_attendance_default"
                  input-id="record-attendance-default"
                  :invalid="
                    formErrors.fieldInvalid('record_attendance_default')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.record_attendance_enforced"
                  :invalid="
                    formErrors.fieldInvalid('record_attendance_enforced')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="record-attendance-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('record_attendance_default')"
                />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('record_attendance_enforced')"
                />
              </div>
            </div>
          </div>

          <!-- Record video-conf -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="record-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t("rooms.settings.recordings.record_video_conference")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.record_default"
                  input-id="record-default"
                  :invalid="formErrors.fieldInvalid('record_default')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.record_enforced"
                  :invalid="formErrors.fieldInvalid('record_enforced')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="record-attendance-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError :errors="formErrors.fieldError('record_default')" />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('record_enforced')"
                />
              </div>
            </div>
          </div>

          <!-- Auto start recording video-conf -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="auto-start-recording-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{ $t("rooms.settings.recordings.auto_start_recording") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.auto_start_recording_default"
                  input-id="auto-start-recording-default"
                  :invalid="
                    formErrors.fieldInvalid('auto_start_recording_default')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.auto_start_recording_enforced"
                  :invalid="
                    formErrors.fieldInvalid('auto_start_recording_enforced')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="record-attendance-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError('auto_start_recording_enforced')
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError('auto_start_recording_enforced')
                  "
                />
              </div>
            </div>
          </div>

          <!-- Restriction settings -->
          <h4 class="text-lg font-medium">
            {{ $t("rooms.settings.restrictions.title") }}
          </h4>

          <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="disable-cam-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t("rooms.settings.restrictions.lock_settings_disable_cam")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.lock_settings_disable_cam_default"
                  input-id="disable-cam-default"
                  :invalid="
                    formErrors.fieldInvalid('lock_settings_disable_cam_default')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.lock_settings_disable_cam_enforced"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_cam_enforced',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="disable-cam-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError('lock_settings_disable_cam_default')
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError('lock_settings_disable_cam_enforced')
                  "
                />
              </div>
            </div>
          </div>

          <!--
          Disable the ability to see the webcam of non moderator-users, moderators can see all webcams,
          can be changed during the meeting
          -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="webcams-only-for-moderator-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t("rooms.settings.restrictions.webcams_only_for_moderator")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.webcams_only_for_moderator_default"
                  input-id="webcams-only-for-moderator-default"
                  :invalid="
                    formErrors.fieldInvalid(
                      'webcams_only_for_moderator_default',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />

                <ToggleButton
                  v-model="model.webcams_only_for_moderator_enforced"
                  :invalid="
                    formErrors.fieldInvalid(
                      'webcams_only_for_moderator_enforced',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="webcams-only-for-moderator-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError('webcams_only_for_moderator_default')
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError('webcams_only_for_moderator_enforced')
                  "
                />
              </div>
            </div>
          </div>

          <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="disable-mic-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t("rooms.settings.restrictions.lock_settings_disable_mic")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.lock_settings_disable_mic_default"
                  input-id="disable-mic-default"
                  :invalid="
                    formErrors.fieldInvalid('lock_settings_disable_mic_default')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.lock_settings_disable_mic_enforced"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_mic_enforced',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="disable-mic-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError('lock_settings_disable_mic_default')
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError('lock_settings_disable_mic_enforced')
                  "
                />
              </div>
            </div>
          </div>

          <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="disable-public-chat-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t(
                  "rooms.settings.restrictions.lock_settings_disable_public_chat",
                )
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.lock_settings_disable_public_chat_default"
                  input-id="disable-public-chat-default"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_public_chat_default',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.lock_settings_disable_public_chat_enforced"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_public_chat_enforced',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="disable-public-chat-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError(
                      'lock_settings_disable_public_chat_default',
                    )
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError(
                      'lock_settings_disable_public_chat_enforced',
                    )
                  "
                />
              </div>
            </div>
          </div>

          <!--
          Disable the ability to send messages via the private chat for non moderator-uses,
          private chats with the moderators is still possible
          can be changed during the meeting
          -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="disable-private-chat-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t(
                  "rooms.settings.restrictions.lock_settings_disable_private_chat",
                )
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.lock_settings_disable_private_chat_default"
                  input-id="disable-private-chat-default"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_private_chat_default',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.lock_settings_disable_private_chat_enforced"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_private_chat_enforced',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="disable-private-chat-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError(
                      'lock_settings_disable_private_chat_default',
                    )
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError(
                      'lock_settings_disable_private_chat_enforced',
                    )
                  "
                />
              </div>
            </div>
          </div>

          <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="disable-note-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t("rooms.settings.restrictions.lock_settings_disable_note")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.lock_settings_disable_note_default"
                  input-id="disable-note-default"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_note_default',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.lock_settings_disable_note_enforced"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_disable_note_enforced',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="disable-note-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError('lock_settings_disable_note_default')
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError('lock_settings_disable_note_enforced')
                  "
                />
              </div>
            </div>
          </div>

          <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="hide-user-list-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{
                $t("rooms.settings.restrictions.lock_settings_hide_user_list")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.lock_settings_hide_user_list_default"
                  input-id="hide-user-list-default"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_hide_user_list_default',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.lock_settings_hide_user_list_enforced"
                  :invalid="
                    formErrors.fieldInvalid(
                      'lock_settings_hide_user_list_enforced',
                    )
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="hide-user-list-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="
                    formErrors.fieldError(
                      'lock_settings_hide_user_list_default',
                    )
                  "
                />
                <FormError
                  class="text-right"
                  :errors="
                    formErrors.fieldError(
                      'lock_settings_hide_user_list_enforced',
                    )
                  "
                />
              </div>
            </div>
          </div>

          <!-- Participants settings -->
          <h4 class="text-lg font-medium">
            {{ $t("rooms.settings.participants.title") }}
          </h4>

          <!-- Allow users to become room members -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="allow-membership-default"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{ $t("rooms.settings.participants.allow_membership") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <ToggleSwitch
                  v-model="model.allow_membership_default"
                  input-id="allow-membership-default"
                  :invalid="formErrors.fieldInvalid('allow_membership_default')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                />
                <ToggleButton
                  v-model="model.allow_membership_enforced"
                  :invalid="
                    formErrors.fieldInvalid('allow_membership_enforced')
                  "
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="allow-membership-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('allow_membership_default')"
                />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('allow_membership_enforced')"
                />
              </div>
            </div>
          </div>

          <!-- Default user role for logged in users only -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              id="default-role-label"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{ $t("rooms.settings.participants.default_role.title") }}
              {{
                $t("rooms.settings.participants.default_role.only_logged_in")
              }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div
                class="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center"
              >
                <SelectButton
                  v-model="model.default_role_default"
                  :allow-empty="false"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :invalid="formErrors.fieldInvalid('default_role_default')"
                  :options="[
                    { role: 1, label: $t('rooms.roles.participant') },
                    { role: 2, label: $t('rooms.roles.moderator') },
                  ]"
                  class="shrink-0"
                  data-key="role"
                  aria-labelledby="default-role-label"
                  option-label="label"
                  option-value="role"
                />
                <ToggleButton
                  v-model="model.default_role_enforced"
                  :invalid="formErrors.fieldInvalid('default_role_enforced')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="default-role-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('default_role_default')"
                />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('default_role_enforced')"
                />
              </div>
            </div>
          </div>

          <!-- Advanced settings -->
          <h4 class="text-lg font-medium">
            {{ $t("rooms.settings.advanced.title") }}
          </h4>

          <!-- Room visibility setting -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              id="visibility-label"
              class="col-span-12 items-center md:col-span-4 md:mb-0"
              >{{ $t("rooms.settings.advanced.visibility.title") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <div class="flex items-center justify-between">
                <SelectButton
                  v-model="model.visibility_default"
                  :allow-empty="false"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :invalid="formErrors.fieldInvalid('visibility_default')"
                  :options="[
                    {
                      visibility: 0,
                      label: $t('rooms.settings.advanced.visibility.private'),
                    },
                    {
                      visibility: 1,
                      label: $t('rooms.settings.advanced.visibility.public'),
                    },
                  ]"
                  class="shrink-0"
                  data-key="visibility"
                  aria-labelledby="visibility-label"
                  option-label="label"
                  option-value="visibility"
                />
                <ToggleButton
                  v-model="model.visibility_enforced"
                  :invalid="formErrors.fieldInvalid('visibility_enforced')"
                  :disabled="isBusy || modelLoadingError || viewOnly"
                  :on-label="
                    $t('admin.room_types.default_room_settings.enforced')
                  "
                  :off-label="
                    $t('admin.room_types.default_room_settings.default')
                  "
                  on-icon="fa-solid fa-lock"
                  off-icon="fa-solid fa-lock-open"
                  input-id="visibility-enforced"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
              </div>
              <div class="flex justify-between gap-6">
                <FormError
                  :errors="formErrors.fieldError('visibility_default')"
                />
                <FormError
                  class="text-right"
                  :errors="formErrors.fieldError('visibility_enforced')"
                />
              </div>
            </div>
          </div>
        </AdminPanel>

        <!-- BBB api settings -->
        <AdminPanel :title="$t('admin.room_types.bbb_api.title')">
          <!-- Create meeting plugin config -->
          <div class="field grid grid-cols-12 gap-4">
            <label
              for="create-parameters"
              class="col-span-12 items-start md:col-span-4 md:mb-0"
              >{{ $t("admin.room_types.bbb_api.create_parameters") }}</label
            >
            <div class="col-span-12 md:col-span-8">
              <Textarea
                id="create-parameters"
                v-model="model.create_parameters"
                class="w-full"
                auto-resize
                :invalid="formErrors.fieldInvalid('create_parameters')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="create-parameters-help"
                :placeholder="
                  viewOnly
                    ? ''
                    : 'meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds'
                "
              />
              <p id="create-parameters-help">
                {{
                  $t("admin.room_types.bbb_api.create_parameters_description")
                }}
              </p>
              <FormError :errors="formErrors.fieldError('create_parameters')" />
            </div>
          </div>
        </AdminPanel>

        <div v-if="!viewOnly">
          <div class="flex justify-end">
            <Button
              :disabled="
                isBusy ||
                modelLoadingError ||
                serverPoolsLoadingError ||
                serverPoolsLoading ||
                rolesLoading ||
                rolesLoadingError
              "
              type="submit"
              icon="fa-solid fa-save"
              :label="$t('app.save')"
            />
          </div>
        </div>
      </form>
    </OverlayComponent>
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import env from "../env.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { onMounted, ref, computed, watch, inject } from "vue";
import { useRouter } from "vue-router";
import _ from "lodash";
import { Multiselect } from "vue-multiselect";
import { useConfirm } from "primevue/useconfirm";
import { useI18n } from "vue-i18n";
import ConfirmDialog from "primevue/confirmdialog";
import { useColors } from "../composables/useColors.js";

const formErrors = useFormErrors();
const userPermissions = useUserPermissions();
const api = useApi();
const router = useRouter();
const confirm = useConfirm();
const colors = useColors();
const breakcrumbLabelData = inject("breakcrumbLabelData");

const { t } = useI18n();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
  viewOnly: {
    type: Boolean,
    required: true,
  },
});

const isBusy = ref(false);
const model = ref({
  name: null,
  color: colors.getAllColors()[0],
  server_pool: null,
  max_duration: null,
  max_participants: null,
  create_parameters: null,
  restrict: false,
  roles: [],
  webcams_only_for_moderator_default: false,
  webcams_only_for_moderator_enforced: false,
  mute_on_start_default: false,
  mute_on_start_enforced: false,
  lock_settings_disable_cam_default: false,
  lock_settings_disable_cam_enforced: false,
  lock_settings_disable_mic_default: false,
  lock_settings_disable_mic_enforced: false,
  lock_settings_disable_private_chat_default: false,
  lock_settings_disable_private_chat_enforced: false,
  lock_settings_disable_public_chat_default: false,
  lock_settings_disable_public_chat_enforced: false,
  lock_settings_disable_note_default: false,
  lock_settings_disable_note_enforced: false,
  lock_settings_hide_user_list_default: false,
  lock_settings_hide_user_list_enforced: false,
  everyone_can_start_default: false,
  everyone_can_start_enforced: false,
  allow_guests_default: false,
  allow_guests_enforced: false,
  allow_membership_default: false,
  allow_membership_enforced: false,
  default_role_default: 1,
  default_role_enforced: false,
  lobby_default: 0,
  lobby_enforced: false,
  record_attendance_default: false,
  record_attendance_enforced: false,
  record_default: false,
  record_enforced: false,
  auto_start_recording_default: false,
  auto_start_recording_enforced: false,
  visibility_default: 0,
  visibility_enforced: false,
  has_access_code_default: true,
  has_access_code_enforced: false,
});

const name = ref("");

watch(
  () => name.value,
  () => {
    breakcrumbLabelData.value = {
      name: name.value,
    };
  },
);

const rolesLoading = ref(false);

const serverPoolsLoading = ref(false);
const serverPools = ref([]);
const serverPoolsCurrentPage = ref(1);
const serverPoolsHasNextPage = ref(false);

const rolesLoadingError = ref(false);
const modelLoadingError = ref(false);
const serverPoolsLoadingError = ref(false);

const serverPoolMultiselectRef = ref();

/**
 * Loads the room type and server pools from the backend
 */
onMounted(() => {
  loadRoomType();
  if (!props.viewOnly) {
    loadServerPools();
  }
});

/**
 * Show alert if simultaneously default role is moderator and waiting room is active
 */
const showLobbyAlert = computed(() => {
  return (
    model.value.default_role_default === 2 && model.value.lobby_default === 1
  );
});

/**
 * Load the room type from the server api
 *
 */
function loadRoomType() {
  if (props.id !== "new") {
    isBusy.value = true;

    api
      .call(`roomTypes/${props.id}`)
      .then((response) => {
        model.value = response.data.data;
        name.value = response.data.data.name;
        modelLoadingError.value = false;
      })
      .catch((error) => {
        if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: "admin.room_types" });
        } else {
          modelLoadingError.value = true;
        }
        api.error(error);
      })
      .finally(() => {
        isBusy.value = false;
      });
  }
}

/**
 * Loads the server pools for the passed page, that can be selected through the multiselect.
 *
 * @param [page=1] The page to load the server pools for.
 */
function loadServerPools(page = 1) {
  serverPoolsLoading.value = true;

  const config = {
    params: {
      page,
    },
  };

  api
    .call("serverPools", config)
    .then((response) => {
      serverPoolsLoadingError.value = false;
      serverPools.value = response.data.data;
      serverPoolsCurrentPage.value = page;
      serverPoolsHasNextPage.value = page < response.data.meta.last_page;
    })
    .catch((error) => {
      serverPoolMultiselectRef.value.deactivate();
      serverPoolsLoadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      serverPoolsLoading.value = false;
    });
}

/**
 * Saves the changes of the room type to the database by making an api call.
 */
function saveRoomType() {
  isBusy.value = true;
  formErrors.clear();

  const config = {
    method: props.id === "new" ? "post" : "put",
    data: _.cloneDeep(model.value),
  };

  config.data.server_pool = config.data.server_pool
    ? config.data.server_pool.id
    : null;
  config.data.roles = config.data.roles.map((role) => role.id);

  api
    .call(props.id === "new" ? "roomTypes" : `roomTypes/${props.id}`, config)
    .then((response) => {
      router.push({
        name: "admin.room_types.view",
        params: { id: response.data.data.id },
      });
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
      } else if (
        error.response &&
        error.response.status === env.HTTP_STALE_MODEL
      ) {
        // handle stale errors
        handleStaleError(error.response.data);
      } else if (
        error.response &&
        error.response.status === env.HTTP_NOT_FOUND
      ) {
        api.error(error);
        router.push({ name: "admin.room_types" });
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function handleStaleError(staleError) {
  confirm.require({
    message: staleError.message,
    header: t("app.errors.stale_error"),
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: t("app.reload"),
      severity: "secondary",
    },
    acceptProps: {
      label: t("app.overwrite"),
    },
    accept: () => {
      model.value.updated_at = staleError.new_model.updated_at;
      saveRoomType();
    },
    reject: () => {
      model.value = staleError.new_model;
      name.value = staleError.new_model.name;
    },
  });
}
</script>
