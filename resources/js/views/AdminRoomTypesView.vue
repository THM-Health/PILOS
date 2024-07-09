<template>
  <div>
    <h2>
      {{ id === 'new' ? $t('admin.room_types.new') : (
        viewOnly ? $t('admin.room_types.view', { name })
        : $t('admin.room_types.edit', { name })
      ) }}
    </h2>
    <div class="flex justify-between">
      <router-link
        class="p-button p-button-secondary"
        :disabled="isBusy"
        :to="{ name: 'admin.room_types' }"
      >
        <i class="fa-solid fa-arrow-left mr-2"/> {{$t('app.back')}}
      </router-link>
      <div v-if="model.id && id !== 'new'" class="flex gap-2">
        <router-link
          v-if="!viewOnly && userPermissions.can('view', model)"
          class="p-button p-button-secondary"
          :disabled="isBusy"
          :to="{ name: 'admin.room_types.view', params: { id: model.id }, query: { view: '1' } }"
        >
          <i class="fa-solid fa-times mr-2" /> {{$t('app.cancel_editing')}}
        </router-link>
        <router-link
          v-if="viewOnly && userPermissions.can('update', model)"
          class="p-button p-button-secondary"
          :disabled="isBusy"
          :to="{ name: 'admin.room_types.view', params: { id: model.id } }"
        >
          <i class="fa-solid fa-edit mr-2" /> {{$t('app.edit')}}
        </router-link>
        <SettingsRoomTypesDeleteButton
          v-if="userPermissions.can('delete', model)"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'admin.room_types' })"
        />
      </div>
    </div>

    <Divider/>
    <OverlayComponent :show="isBusy || modelLoadingError">
      <template #loading>
        <LoadingRetryButton :error="modelLoadingError" @reload="loadRoomType"></LoadingRetryButton>
      </template>
      <form @submit.prevent="saveRoomType">
        <!-- General room type settings -->
        <h3>{{ $t('rooms.settings.general.title') }}</h3>

        <!-- Room type name -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="room-type-name" class="col-span-12 md:col-span-4 md:mb-0">{{$t('app.model_name')}}</label>
          <div class="col-span-12 md:col-span-8">
            <InputText
              class="w-full"
              id="room-type-name"
              v-model="model.name"
              type="text"
              :invalid="formErrors.fieldInvalid('name')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('name')"></p>
          </div>
        </div>

        <!-- Room type description -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="description" class="col-span-12 md:col-span-4 md:mb-0">{{$t('app.description')}}</label>
          <div class="col-span-12 md:col-span-8">
            <Textarea
              class="w-full"
              id="description"
              v-model="model.description"
              :invalid="formErrors.fieldInvalid('description')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('description')"></p>
          </div>
        </div>

        <!-- Room type color -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="color" class="col-span-12 md:col-span-4 md:mb-0 items-start">{{ $t('admin.room_types.color') }}</label>
          <div class="col-span-12 md:col-span-8">
            <ColorSelect
              id="color"
              class="mb-2"
              :disabled='isBusy || modelLoadingError || viewOnly'
              :colors="colors.getAllColors()"
              v-model="model.color"
            />
            <label for="custom-color">{{ $t('admin.room_types.custom_color') }}</label>
            <InputText
              class="w-full"
              id="custom-color"
              v-model="model.color"
              type="text"
              :invalid="formErrors.fieldInvalid('color')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('color')"></p>
          </div>
        </div>

        <!-- Preview -->
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0">{{$t('admin.room_types.preview')}}</label>
          <div class="col-span-12 md:col-span-8 flex items-center">
            <RoomTypeBadge :room-type="model" />
          </div>
        </div>

        <!-- Server pool for this room type -->
        <div class="field grid grid-cols-12 gap-4">
          <label id="server-pool-label" class="col-span-12 md:col-span-4 md:mb-0 items-start">{{$t('app.server_pool')}}</label>
          <div class="col-span-12 md:col-span-8">
            <InputGroup>
              <multiselect
                aria-labelledby="server-pool-label"
                ref="serverPoolMultiselectRef"
                v-model="model.server_pool"
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
                :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || viewOnly"
                :loading="serverPoolsLoading"
                :allow-empty="false"
                :class="{ 'is-invalid': formErrors.fieldInvalid('server_pool'), 'multiselect-form-control': true }"
                aria-describedby="server_pool-help"
              >
                <template #noOptions>
                  {{ $t('admin.server_pools.no_data') }}
                </template>
                <template #afterList>
                  <div class="flex p-2 gap-2">
                    <Button
                      :disabled="serverPoolsLoading || serverPoolsCurrentPage === 1"
                      severity="secondary"
                      outlined
                      @click="loadServerPools(Math.max(1, serverPoolsCurrentPage - 1))"
                      icon="fa-solid fa-arrow-left"
                      :label="$t('app.previous_page')"
                    />
                    <Button
                      :disabled="serverPoolsLoading || !serverPoolsHasNextPage"
                      severity="secondary"
                      outlined
                      @click="loadServerPools(serverPoolsCurrentPage + 1)"
                      icon="fa-solid fa-arrow-right"
                      :label="$t('app.next_page')"
                    />
                  </div>
                </template>
              </multiselect>
              <Button
                v-if="serverPoolsLoadingError"
                severity="secondary"
                outlined
                @click="loadServerPools(serverPoolsCurrentPage)"
                icon="fa-solid fa-sync"
              />
            </InputGroup>
            <p class="p-error" v-html="formErrors.fieldError('server_pool')"></p>
            <small id="server_pool-help">{{$t('admin.room_types.server_pool_description')}}</small>
          </div>
        </div>

        <!-- Option to restrict the usage of this room type to selected roles-->
        <div class="field grid grid-cols-12 gap-4">
          <label for="restrict" class="col-span-12 md:col-span-4 md:mb-0 items-start">{{$t('admin.room_types.restrict')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div>
              <ToggleSwitch
                input-id="restrict"
                v-model="model.restrict"
                :invalid="formErrors.fieldInvalid('restrict')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="restrict-help"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('restrict')"></p>
            <small id="restrict-help">{{$t('admin.room_types.restrict_description')}}</small>
          </div>
        </div>

        <!-- Selection of the roles -->
        <div class="field grid grid-cols-12 gap-4" v-if="model.restrict">
          <label for="roles" class="col-span-12 md:col-span-4 md:mb-0">{{$t('app.roles')}}</label>
          <div class="col-span-12 md:col-span-8">
            <RoleSelect
              v-model="model.roles"
              :invalid="formErrors.fieldInvalid('roles')"
              :disabled="isBusy || modelLoadingError || viewOnly"
              id="roles"
              @busy="(value) => rolesLoading = value"
              @rolesLoadingError="(value) => rolesLoadingError = value"
            />
            <p class="p-error" v-html="formErrors.fieldError('roles')"></p>
          </div>
        </div>

        <!-- Maximum number of participants -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="max-participants" class="col-span-12 md:col-span-4 md:mb-0 items-start">{{$t('admin.room_types.max_participants')}}</label>
          <div class="col-span-12 md:col-span-8">
            <InputGroup>
              <InputNumber
                input-id="max-participants"
                v-model="model.max_participants"
                :invalid="formErrors.fieldInvalid('max_participants')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :placeholder="$t('app.unlimited')"
              />
              <Button
                @click="model.max_participants = null"
                icon="fa-solid fa-xmark"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
            </InputGroup>
            <p class="p-error" v-html="formErrors.fieldError('max_participants')"></p>
          </div>
        </div>

        <!-- Maximum duration -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="max-duration" class="col-span-12 md:col-span-4 md:mb-0 items-start">{{$t('admin.room_types.max_duration')}}</label>
          <div class="col-span-12 md:col-span-8">
            <InputGroup>
              <InputNumber
                input-id="max-duration"
                v-model="model.max_duration"
                :invalid="formErrors.fieldInvalid('max_duration')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :placeholder="$t('app.unlimited')"
                suffix=" min."
              />
              <Button
                @click="model.max_duration = null"
                icon="fa-solid fa-xmark"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
            </InputGroup>
            <p class="p-error" v-html="formErrors.fieldError('max_duration')"></p>
          </div>
        </div>

        <Divider/>
        <!-- Default room settings -->
        <h3>{{ $t('admin.room_types.default_room_settings.title')}}</h3>

        <!-- General room settings -->
        <h4>{{ $t('rooms.settings.general.title') }}</h4>

        <!-- Has access code setting (defines if the room should have an access code) -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="has-access-code-default" class="col-span-12 md:col-span-4 md:m-0 items-center"> {{ $t('rooms.settings.general.has_access_code')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="has-access-code-default"
                v-model="model.has_access_code_default"
                :invalid="formErrors.fieldInvalid('has_access_code_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.has_access_code_enforced"
                :invalid="formErrors.fieldInvalid('has_access_code_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="has-access-code-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6 ">
              <p class="p-error" v-html="formErrors.fieldError('has_access_code_default')"></p>
              <p class="p-error" v-html="formErrors.fieldError('has_access_code_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Allow guests to access the room -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="allow-guests-default" class="col-span-12 md:col-span-4 md:m-0 items-center">{{$t('rooms.settings.general.allow_guests')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="allow-guests-default"
                v-model="model.allow_guests_default"
                :invalid="formErrors.fieldInvalid('allow_guests_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.allow_guests_enforced"
                :invalid="formErrors.fieldInvalid('allow_guests_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="allow-guests-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6 ">
              <p class="p-error" v-html="formErrors.fieldError('allow_guests_default')"></p>
              <p class="p-error" v-html="formErrors.fieldError('allow_guests_enforced')"></p>
            </div>
          </div>
        </div>

        <!--
        Expert settings (settings that will only appear in the room settings if the expert mode is activated)
        When the expert mode is deactivated the default values from the room type will be used
        -->
        <!-- Everyone can start a new meeting, not only the moderator -->
        <h4>{{ $t('rooms.settings.video_conference.title') }}</h4>

        <div class="field grid grid-cols-12 gap-4">
          <label for="everyone-can-start-default" class="col-span-12 md:col-span-4  md:mb-0  items-center">{{$t('rooms.settings.video_conference.everyone_can_start')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="everyone-can-start-default"
                v-model="model.everyone_can_start_default"
                :invalid="formErrors.fieldInvalid('everyone_can_start_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.everyone_can_start_enforced"
                :invalid="formErrors.fieldInvalid('everyone_can_start_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="everyone-can-start-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('everyone_can_start_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('everyone_can_start_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Mute everyone*s microphone on meeting join -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="mute-on-start-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.video_conference.mute_on_start')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="mute-on-start-default"
                v-model="model.mute_on_start_default"
                :invalid="formErrors.fieldInvalid('mute_on_start_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.mute_on_start_enforced"
                :invalid="formErrors.fieldInvalid('mute_on_start_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="mute-on-start-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('mute_on_start_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('mute_on_start_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Usage of the waiting room/guest lobby -->
        <div class="field grid grid-cols-12 gap-4">
          <label class="col-span-12 md:col-span-4 md:mb-0 items-center">{{ $t('rooms.settings.video_conference.lobby.title') }}</label>
          <div class="col-span-12 md:col-span-8 mb-2">
            <div class="flex flex-row justify-between items-center">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model.number="model.lobby_default"
                    :disabled="isBusy || modelLoadingError || viewOnly"
                    :value="0"
                    name="lobby"
                    input-id="lobby-disabled"
                  />
                  <label for="lobby-disabled">{{ $t('app.disabled') }}</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model.number="model.lobby_default"
                    :disabled="isBusy || modelLoadingError || viewOnly"
                    :value="1"
                    name="lobby"
                    input-id="lobby-enabled"
                  />
                  <label for="lobby-enabled">{{ $t('app.enabled') }}</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model.number="model.lobby_default"
                    :disabled="isBusy || modelLoadingError || viewOnly"
                    :value="2"
                    name="lobby"
                    input-id="lobby-only-for-guests"
                  />
                  <label for="lobby-only-for-guests">{{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</label>
                </div>
              </div>
              <ToggleButton
                v-model="model.lobby_enforced"
                :invalid="formErrors.fieldInvalid('lobby_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="lobby-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('lobby_default')"/>
              <p class="p-error text-right" v-html="formErrors.fieldError('lobby_enforced')"></p>
            </div>
          </div>
          <div class="col-span-12">
            <!-- Alert shown when default role is moderator and waiting room is active -->
            <InlineNote
              class="w-full"
              v-if="showLobbyAlert"
              severity="warn"
            >
              {{ $t('rooms.settings.video_conference.lobby.alert') }}
            </InlineNote>
          </div>
        </div>

        <!-- Record settings -->
        <h4>{{ $t('rooms.settings.recordings.title') }}</h4>

        <!-- Record attendance of users and guests -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="record-attendance-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{ $t('rooms.settings.recordings.record_attendance') }}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="record-attendance-default"
                v-model="model.record_attendance_default"
                :invalid="formErrors.fieldInvalid('record_attendance_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.record_attendance_enforced"
                :invalid="formErrors.fieldInvalid('record_attendance_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="record-attendance-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('record_attendance_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('record_attendance_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Record video-conf -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="record-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{ $t('rooms.settings.recordings.record_video_conference') }}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="record-default"
                v-model="model.record_default"
                :invalid="formErrors.fieldInvalid('record_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.record_enforced"
                :invalid="formErrors.fieldInvalid('record_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="record-attendance-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('record_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('record_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Auto start recording video-conf -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="auto-start-recording-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{ $t('rooms.settings.recordings.auto_start_recording') }}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="auto-start-recording-default"
                v-model="model.auto_start_recording_default"
                :invalid="formErrors.fieldInvalid('auto_start_recording_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.auto_start_recording_enforced"
                :invalid="formErrors.fieldInvalid('auto_start_recording_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="record-attendance-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('auto_start_recording_enforced')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('auto_start_recording_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Restriction settings -->
        <h4>{{ $t('rooms.settings.restrictions.title') }}</h4>

        <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="disable-cam-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.restrictions.lock_settings_disable_cam')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="disable-cam-default"
                v-model="model.lock_settings_disable_cam_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_cam_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_disable_cam_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_cam_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="disable-cam-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_cam_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_cam_enforced')"></p>
            </div>
          </div>
        </div>

        <!--
        Disable the ability to see the webcam of non moderator-users, moderators can see all webcams,
        can be changed during the meeting
        -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="webcams-only-for-moderator-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.restrictions.webcams_only_for_moderator')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="webcams-only-for-moderator-default"
                v-model="model.webcams_only_for_moderator_default"
                :invalid="formErrors.fieldInvalid('webcams_only_for_moderator_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />

              <ToggleButton
                v-model="model.webcams_only_for_moderator_enforced"
                :invalid="formErrors.fieldInvalid('webcams_only_for_moderator_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="webcams-only-for-moderator-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('webcams_only_for_moderator_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('webcams_only_for_moderator_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="disable-mic-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.restrictions.lock_settings_disable_mic')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="disable-mic-default"
                v-model="model.lock_settings_disable_mic_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_mic_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_disable_mic_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_mic_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="disable-mic-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_mic_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_mic_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="disable-public-chat-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.restrictions.lock_settings_disable_public_chat')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="disable-public-chat-default"
                v-model="model.lock_settings_disable_public_chat_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_public_chat_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_disable_public_chat_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_public_chat_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="disable-public-chat-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_public_chat_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_public_chat_enforced')"></p>
            </div>
          </div>
        </div>

        <!--
        Disable the ability to send messages via the private chat for non moderator-uses,
        private chats with the moderators is still possible
        can be changed during the meeting
        -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="disable-private-chat-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.restrictions.lock_settings_disable_private_chat')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="disable-private-chat-default"
                v-model="model.lock_settings_disable_private_chat_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_private_chat_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_disable_private_chat_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_private_chat_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="disable-private-chat-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_private_chat_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_private_chat_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="disable-note-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.restrictions.lock_settings_disable_note')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="disable-note-default"
                v-model="model.lock_settings_disable_note_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_note_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_disable_note_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_note_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="disable-note-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_note_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_note_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="hide-user-list-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.restrictions.lock_settings_hide_user_list')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="hide-user-list-default"
                v-model="model.lock_settings_hide_user_list_default"
                :invalid="formErrors.fieldInvalid('lock_settings_hide_user_list_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_hide_user_list_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_hide_user_list_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="hide-user-list-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_hide_user_list_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_hide_user_list_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Participants settings -->
        <h4>{{ $t('rooms.settings.participants.title') }}</h4>

        <!-- Allow users to become room members -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="allow-membership-default" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{$t('rooms.settings.participants.allow_membership')}}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <ToggleSwitch
                input-id="allow-membership-default"
                v-model="model.allow_membership_default"
                :invalid="formErrors.fieldInvalid('allow_membership_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.allow_membership_enforced"
                :invalid="formErrors.fieldInvalid('allow_membership_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="allow-membership-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('allow_membership_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('allow_membership_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Default user role for logged in users only -->
        <div class="field grid grid-cols-12 gap-4">
          <label id="default-role-label" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
              <SelectButton
                v-model="model.default_role_default"
                :allowEmpty="false"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('default_role_default')"
                :options="[
                    { role: 1, label: $t('rooms.roles.participant')},
                    { role: 2, label: $t('rooms.roles.moderator')}
                  ]"
                class="shrink-0"
                dataKey="role"
                aria-labelledby="default-role-label"
                optionLabel="label"
                optionValue="role"
              />
              <ToggleButton
                v-model="model.default_role_enforced"
                :invalid="formErrors.fieldInvalid('default_role_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="default-role-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('default_role_default')"/>
              <p class="p-error text-right" v-html="formErrors.fieldError('default_role_enforced')"></p>
            </div>
          </div>
        </div>

        <!-- Advanced settings -->
        <h4>{{ $t('rooms.settings.advanced.title') }}</h4>

        <!-- Room visibility setting -->
        <div class="field grid grid-cols-12 gap-4">
          <label id="visibility-label" class="col-span-12 md:col-span-4 md:mb-0 items-center">{{ $t('rooms.settings.advanced.visibility.title') }}</label>
          <div class="col-span-12 md:col-span-8">
            <div class="flex justify-between items-center">
              <SelectButton
                v-model="model.visibility_default"
                :allowEmpty="false"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('visibility_default')"
                :options="[
                    { visibility: 0, label: $t('rooms.settings.advanced.visibility.private')},
                    { visibility: 1, label: $t('rooms.settings.advanced.visibility.public')}
                  ]"
                class="shrink-0"
                dataKey="visibility"
                aria-labelledby="visibility-label"
                optionLabel="label"
                optionValue="visibility"
              />
              <ToggleButton
                v-model="model.visibility_enforced"
                :invalid="formErrors.fieldInvalid('visibility_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :on-label=" $t('admin.room_types.default_room_settings.enforced')"
                :off-label=" $t('admin.room_types.default_room_settings.default')"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
                input-id="visibility-enforced"
                :aria-label="$t('rooms.settings.general.enforced_setting')"
              />
            </div>
            <div class="flex justify-between gap-6">
              <p class="p-error" v-html="formErrors.fieldError('visibility_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('visibility_enforced')"></p>
            </div>
          </div>
        </div>

        <Divider/>
        <!-- BBB api settings -->
        <h4>{{ $t('admin.room_types.bbb_api.title') }}</h4>

        <!-- Create meeting plugin config -->
        <div class="field grid grid-cols-12 gap-4">
          <label for="create-parameters" class="col-span-12 md:col-span-4 md:mb-0 items-start">{{$t('admin.room_types.bbb_api.create_parameters')}}</label>
          <div class="col-span-12 md:col-span-8">
            <Textarea
              input-id="create-parameters"
              class="w-full"
              autoResize
              v-model="model.create_parameters"
              :invalid="formErrors.fieldInvalid('create_parameters')"
              :disabled="isBusy || modelLoadingError || viewOnly"
              aria-describedby="create-parameters-help"
              :placeholder="viewOnly ? '': 'meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds'"
            />
            <p id="create-parameters-help">{{$t('admin.room_types.bbb_api.create_parameters_description')}}</p>
            <p class="p-error" v-html="formErrors.fieldError('create_parameters')"></p>
          </div>
        </div>

        <div v-if="!viewOnly">
          <Divider/>
          <div class="flex justify-end">
            <Button
              :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || serverPoolsLoading || rolesLoading || rolesLoadingError"
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
import env from '../env.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import _ from 'lodash';
import { Multiselect } from 'vue-multiselect';
import { useConfirm } from 'primevue/useconfirm';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from 'primevue/confirmdialog';
import { useColors } from '../composables/useColors.js';

const formErrors = useFormErrors();
const userPermissions = useUserPermissions();
const api = useApi();
const router = useRouter();
const confirm = useConfirm();
const colors = useColors();

const { t } = useI18n();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  viewOnly: {
    type: Boolean,
    required: true
  }
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
  has_access_code_enforced: false
});

const name = ref('');

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
  loadServerPools();
});

/**
 * Show alert if simultaneously default role is moderator and waiting room is active
 */
const showLobbyAlert = computed(() => {
  return model.value.default_role_default === 2 && model.value.lobby_default === 1;
});

/**
 * Load the room type from the server api
 *
 */
function loadRoomType () {
  if (props.id !== 'new') {
    isBusy.value = true;

    api.call(`roomTypes/${props.id}`).then(response => {
      model.value = response.data.data;
      name.value = response.data.data.name;
      modelLoadingError.value = false;
    }).catch(error => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: 'admin.room_types' });
      } else {
        modelLoadingError.value = true;
      }
      api.error(error);
    }).finally(() => {
      isBusy.value = false;
    });
  }
}

/**
 * Loads the server pools for the passed page, that can be selected through the multiselect.
 *
 * @param [page=1] The page to load the server pools for.
 */
function loadServerPools (page = 1) {
  serverPoolsLoading.value = true;

  const config = {
    params: {
      page
    }
  };

  api.call('serverPools', config).then(response => {
    serverPoolsLoadingError.value = false;
    serverPools.value = response.data.data;
    serverPoolsCurrentPage.value = page;
    serverPoolsHasNextPage.value = page < response.data.meta.last_page;
  }).catch(error => {
    serverPoolMultiselectRef.value.deactivate();
    serverPoolsLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    serverPoolsLoading.value = false;
  });
}

/**
 * Saves the changes of the room type to the database by making an api call.
 */
function saveRoomType () {
  isBusy.value = true;

  const config = {
    method: props.id === 'new' ? 'post' : 'put',
    data: _.cloneDeep(model.value)
  };

  config.data.server_pool = config.data.server_pool ? config.data.server_pool.id : null;
  config.data.roles = config.data.roles.map(role => role.id);

  api.call(props.id === 'new' ? 'roomTypes' : `roomTypes/${props.id}`, config).then(response => {
    formErrors.clear();
    router.push({ name: 'admin.room_types.view', params: { id: response.data.data.id }, query: { view: '1' } });
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // handle stale errors
      handleStaleError(error.response.data);
    } else if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
      api.error(error);
      router.push({ name: 'admin.room_types' });
    } else {
      api.error(error);
    }
  }).finally(() => {
    isBusy.value = false;
  });
}

function handleStaleError (staleError) {
  confirm.require({
    message: staleError.message,
    header: t('app.errors.stale_error'),
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary',
    rejectLabel: t('app.reload'),
    acceptLabel: t('app.overwrite'),
    accept: () => {
      model.value.updated_at = staleError.new_model.updated_at;
      saveRoomType();
    },
    reject: () => {
      model.value = staleError.new_model;
      name.value = staleError.new_model.name;
    }
  });
}
</script>
