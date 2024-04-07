<template>
  <div>
    <h2>
      {{ id === 'new' ? $t('settings.room_types.new') : (
        viewOnly ? $t('settings.room_types.view', { name })
        : $t('settings.room_types.edit', { name })
      ) }}
    </h2>
    <div class="flex justify-content-between">
      <router-link
        class="p-button p-button-secondary"
        :disabled="isBusy"
        :to="{ name: 'settings.room_types' }"
      >
        <i class="fa-solid fa-arrow-left mr-2"/> {{$t('app.back')}}
      </router-link>
      <div v-if="model.id && id !== 'new'" class="flex gap-2">
        <router-link
          v-if="!viewOnly && userPermissions.can('view', model)"
          class="p-button p-button-secondary"
          :disabled="isBusy"
          :to="{ name: 'settings.room_types.view', params: { id: model.id }, query: { view: '1' } }"
        >
          <i class="fa-solid fa-times mr-2" /> {{$t('app.cancel_editing')}}
        </router-link>
        <router-link
          v-if="viewOnly && userPermissions.can('update', model)"
          class="p-button p-button-secondary"
          :disabled="isBusy"
          :to="{ name: 'settings.room_types.view', params: { id: model.id } }"
        >
          <i class="fa-solid fa-edit mr-2" /> {{$t('app.edit')}}
        </router-link>
        <SettingsRoomTypesDeleteButton
          v-if="userPermissions.can('delete', model)"
          :id="model.id"
          :name="name"
          @deleted="$router.push({ name: 'settings.room_types' })"
        />
      </div>
    </div>

    <Divider/>
    <OverlayComponent :show="isBusy || modelLoadingError">
      <template #loading>
        <LoadingRetryButton :error="modelLoadingError" @reload="loadRoomType"></LoadingRetryButton>
      </template>
      <form @submit.prevent="saveRoomType">
        <h3>{{ $t('rooms.settings.general.title') }}</h3>
        <div class="field grid">
          <label for="name" class="col-12 md:col-4 md:mb-0">{{$t('app.model_name')}}</label>
          <div class="col-12 md:col-8">
            <InputText
              class="w-full"
              id="name"
              v-model="model.name"
              type="text"
              :invalid="formErrors.fieldInvalid('name')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('name')"></p>
          </div>
        </div>

        <div class="field grid">
          <label for="description" class="col-12 md:col-4 md:mb-0">{{$t('app.description')}}</label>
          <div class="col-12 md:col-8">
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

        <div class="field grid">
          <label for="color" class="col-12 md:col-4 md:mb-0 align-items-start">{{ $t('settings.room_types.color') }}</label>
          <div class="col-12 md:col-8">
            <ColorSelect
              id="color"
              class="mb-2"
              :disabled='isBusy || modelLoadingError || viewOnly'
              :colors="colors"
              v-model="model.color"
            />
            <label for="color">{{ $t('settings.room_types.custom_color') }}</label>
            <InputText
              class="w-full"
              id="color"
              v-model="model.color"
              type="text"
              :invalid="formErrors.fieldInvalid('color')"
              :disabled="isBusy || modelLoadingError || viewOnly"
            />
            <p class="p-error" v-html="formErrors.fieldError('color')"></p>
          </div>
        </div>

        <div class="field grid">
          <label class="col-12 md:col-4 md:mb-0">{{$t('settings.room_types.preview')}}</label>
          <div class="col-12 md:col-8 flex align-items-center">
            <RoomTypeBadge :room-type="model" />
          </div>
        </div>

        <div class="field grid">
          <label for="server_pool" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('app.server_pool')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
              <multiselect
                id="server_pool"
                ref="serverPoolMultiselectRef"
                v-model="model.server_pool"
                :placeholder="$t('settings.room_types.select_server_pool')"
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
                  {{ $t('settings.server_pools.no_data') }}
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
            <small id="server_pool-help">{{$t('settings.room_types.server_pool_description')}}</small>
          </div>
        </div>

        <div class="field grid">
          <label for="restrict" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.restrict')}}</label>
          <div class="col-12 md:col-8">
            <div>
              <InputSwitch
                input-id="restrict"
                v-model="model.restrict"
                :invalid="formErrors.fieldInvalid('restrict')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                aria-describedby="restrict-help"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('restrict')"></p>
            <small id="restrict-help">{{$t('settings.room_types.restrict_description')}}</small>
          </div>
        </div>

        <div class="field grid" v-if="model.restrict">
          <label for="roles" class="col-12 md:col-4 md:mb-0">{{$t('app.roles')}}</label>
          <div class="col-12 md:col-8">
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

        <div class="field grid">
          <label for="max_participants" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.max_participants')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
              <InputNumber
                id="max_participants"
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

        <div class="field grid">
          <label for="max_duration" class="col-12 md:col-4 md:mb-0 align-items-start">{{$t('settings.room_types.max_duration')}}</label>
          <div class="col-12 md:col-8">
            <InputGroup>
              <InputNumber
                id="max_duration"
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
        <h3>Default Settings</h3>

        <h4>{{ $t('rooms.settings.general.title') }}</h4>

<!--        ToDo fix problem when enforcing Access Code (Rooms without an access code will stay without an access code)
            (Problem already existed before???)-->
        <div class="field grid">
          <label for="has_access_code_default" class="col-12 md:col-4 md:m-0 align-items-center"> Has Access Code</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="has_access_code_default"
                v-model="model.has_access_code_default"
                :invalid="formErrors.fieldInvalid('has_access_code_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.has_access_code_enforced"
                :invalid="formErrors.fieldInvalid('has_access_code_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4 ">
              <p class="p-error" v-html="formErrors.fieldError('has_access_code_default')"></p>
              <p class="p-error" v-html="formErrors.fieldError('has_access_code_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="allow_guests_default" class="col-12 md:col-4 md:m-0 align-items-center">{{$t('rooms.settings.security.allow_guests')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="allow_guests_default"
                v-model="model.allow_guests_default"
                :invalid="formErrors.fieldInvalid('allow_guests_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.allow_guests_enforced"
                :invalid="formErrors.fieldInvalid('allow_guests_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4 ">
              <p class="p-error" v-html="formErrors.fieldError('allow_guests_default')"></p>
              <p class="p-error" v-html="formErrors.fieldError('allow_guests_enforced')"></p>
            </div>
          </div>
        </div>

        <h4>Videokonferenz</h4>

        <div class="field grid">
          <label for="everyone_can_start_default" class="col-12 md:col-4  md:mb-0  align-items-center">{{$t('rooms.settings.permissions.everyone_start')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="everyone_can_start_default"
                v-model="model.everyone_can_start_default"
                :invalid="formErrors.fieldInvalid('everyone_can_start_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.everyone_can_start_enforced"
                :invalid="formErrors.fieldInvalid('everyone_can_start_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('everyone_can_start_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('everyone_can_start_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="mute_on_start_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.permissions.mute_mic')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="mute_on_start_default"
                v-model="model.mute_on_start_default"
                :invalid="formErrors.fieldInvalid('mute_on_start_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.mute_on_start_enforced"
                :invalid="formErrors.fieldInvalid('mute_on_start_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('mute_on_start_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('mute_on_start_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="default_role_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{ $t('rooms.settings.participants.waiting_room.title') }}</label>
          <div class="col-12 md:col-8 mb-2">
            <div class="flex flex-row justify-content-between align-items-center">
              <div class="flex flex-column gap-2">
                <div class="flex align-items-center gap-2">
                  <RadioButton
                    v-model.number="model.lobby_default"
                    :disabled="isBusy || modelLoadingError || viewOnly"
                    :value="0"
                    name="lobby"
                  />
                  <label>{{ $t('app.disabled') }}</label>
                </div>
                <div class="flex align-items-center gap-2">
                  <RadioButton
                    v-model.number="model.lobby_default"
                    :disabled="isBusy || modelLoadingError || viewOnly"
                    :value="1"
                    name="lobby"
                  />
                  <label>{{ $t('app.enabled') }}</label>
                </div>
                <div class="flex align-items-center gap-2">
                  <RadioButton
                    v-model.number="model.lobby_default"
                    :disabled="isBusy || modelLoadingError || viewOnly"
                    :value="2"
                    name="lobby"
                  />
                  <label>{{ $t('rooms.settings.participants.waiting_room.only_for_guests_enabled') }}</label>
                </div>
              </div>
              <ToggleButton
                v-model="model.lobby_enforced"
                :invalid="formErrors.fieldInvalid('lobby_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('lobby_default')"/>
              <p class="p-error text-right" v-html="formErrors.fieldError('lobby_enforced')"></p>
            </div>
          </div>
          <div class="col-12">
            <!-- Alert shown when default role is moderator and waiting room is active -->
            <InlineNote
              class="w-full"
              v-if="showLobbyAlert"
              severity="warn"
            >
              {{ $t('rooms.settings.participants.waiting_room_alert') }}
            </InlineNote>
          </div>
        </div>

        <div class="field grid">
          <label for="record_attendance_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{ $t('rooms.settings.recordings.record_attendance') }}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="record_attendance_default"
                v-model="model.record_attendance_default"
                :invalid="formErrors.fieldInvalid('record_attendance_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.record_attendance_enforced"
                :invalid="formErrors.fieldInvalid('record_attendance_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('record_attendance_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('record_attendance_enforced')"></p>
            </div>
          </div>
        </div>

        <h4>{{ $t('rooms.settings.restrictions.title') }}</h4>
        <div class="field grid">
          <label for="lock_settings_disable_cam_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_cam')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="lock_settings_disable_cam_default"
                v-model="model.lock_settings_disable_cam_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_cam_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_disable_cam_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_cam_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_cam_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_cam_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="webcams_only_for_moderator_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.restrictions.only_mod_see_cam')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="webcams_only_for_moderator_default"
                v-model="model.webcams_only_for_moderator_default"
                :invalid="formErrors.fieldInvalid('webcams_only_for_moderator_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />

              <ToggleButton
                v-model="model.webcams_only_for_moderator_enforced"
                :invalid="formErrors.fieldInvalid('webcams_only_for_moderator_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('webcams_only_for_moderator_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('webcams_only_for_moderator_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="lock_settings_disable_mic_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_mic')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="lock_settings_disable_mic_default"
                v-model="model.lock_settings_disable_mic_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_mic_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />
              <ToggleButton
                v-model="model.lock_settings_disable_mic_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_mic_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_mic_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_mic_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="lock_settings_disable_public_chat_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_public_chat')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="lock_settings_disable_public_chat_default"
                v-model="model.lock_settings_disable_public_chat_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_public_chat_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />

              <ToggleButton
                v-model="model.lock_settings_disable_public_chat_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_public_chat_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_public_chat_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_public_chat_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="lock_settings_disable_private_chat_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_private_chat')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="lock_settings_disable_private_chat_default"
                v-model="model.lock_settings_disable_private_chat_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_private_chat_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />

              <ToggleButton
                v-model="model.lock_settings_disable_private_chat_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_private_chat_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_private_chat_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_private_chat_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="lock_settings_disable_public_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_note_edit')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="lock_settings_disable_public_default"
                v-model="model.lock_settings_disable_note_default"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_note_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />

              <ToggleButton
                v-model="model.lock_settings_disable_note_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_note_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_note_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_disable_note_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="lock_settings_hide_user_list_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.restrictions.hide_participants_list')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="lock_settings_hide_user_list_default"
                v-model="model.lock_settings_hide_user_list_default"
                :invalid="formErrors.fieldInvalid('lock_settings_hide_user_list_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />

              <ToggleButton
                v-model="model.lock_settings_hide_user_list_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_hide_user_list_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_hide_user_list_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('lock_settings_hide_user_list_enforced')"></p>
            </div>
          </div>
        </div>

        <h4>{{ $t('rooms.settings.participants.title') }}</h4>
        <div class="field grid">
          <label for="allow_membership_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{$t('rooms.settings.security.allow_new_members')}}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <InputSwitch
                input-id="allow_membership_default"
                v-model="model.allow_membership_default"
                :invalid="formErrors.fieldInvalid('allow_membership_default')"
                :disabled="isBusy || modelLoadingError || viewOnly"
              />

              <ToggleButton
                v-model="model.allow_membership_enforced"
                :invalid="formErrors.fieldInvalid('allow_membership_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('allow_membership_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('allow_membership_enforced')"></p>
            </div>
          </div>
        </div>

        <div class="field grid">
          <label for="default_role_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-start md:align-items-center flex-column md:flex-row gap-2">
              <SelectButton
                v-model="model.default_role_default"
                :allowEmpty="false"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('default_role_default')"
                :options="[
                    { role: 1, label: $t('rooms.roles.participant')},
                    { role: 2, label: $t('rooms.roles.moderator')}
                  ]"
                class="flex-shrink-0"
                dataKey="role"
                input-id="default-role"
                optionLabel="label"
                optionValue="role"
              />
              <ToggleButton
                v-model="model.default_role_enforced"
                :invalid="formErrors.fieldInvalid('default_role_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('default_role_default')"/>
              <p class="p-error text-right" v-html="formErrors.fieldError('default_role_enforced')"></p>
            </div>
          </div>
        </div>
        <h4>Erweitert</h4>

        <div class="field grid">
          <label for="visibility_default" class="col-12 md:col-4 md:mb-0 align-items-center">{{ $t('rooms.settings.security.listed') }}</label>
          <div class="col-12 md:col-8">
            <div class="flex justify-content-between align-items-center">
              <SelectButton
                v-model="model.visibility_default"
                :allowEmpty="false"
                :disabled="isBusy || modelLoadingError || viewOnly"
                :invalid="formErrors.fieldInvalid('visibility_default')"
                :options="[
                    { visibility: 0, label: 'Private'},
                    { visibility: 1, label: 'Public'}
                  ]"
                class="flex-shrink-0"
                dataKey="visibility"
                input-id="visibility_default"
                optionLabel="label"
                optionValue="visibility"
              />
              <ToggleButton
                v-model="model.visibility_enforced"
                :invalid="formErrors.fieldInvalid('visibility_enforced')"
                :disabled="isBusy || modelLoadingError || viewOnly"
                on-label="Enforced"
                off-label="Default"
                on-icon="fa-solid fa-lock"
                off-icon="fa-solid fa-lock-open"
              />
            </div>
            <div class="flex justify-content-between gap-4">
              <p class="p-error" v-html="formErrors.fieldError('visibility_default')"></p>
              <p class="p-error text-right" v-html="formErrors.fieldError('visibility_enforced')"></p>
            </div>
          </div>
        </div>

        <div v-if="!viewOnly">
          <Divider/>
          <div class="flex justify-content-end">
            <Button
              :disabled="isBusy || modelLoadingError || serverPoolsLoadingError || serverPoolsLoading || rolesLoading || rolesLoadingError"
              severity="success"
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
import env from '@/env.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useFormErrors } from '@/composables/useFormErrors.js';
import { useApi } from '@/composables/useApi.js';
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import _ from 'lodash';
import { Multiselect } from 'vue-multiselect';
import { useConfirm } from 'primevue/useconfirm';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from 'primevue/confirmdialog';

const formErrors = useFormErrors();
const userPermissions = useUserPermissions();
const api = useApi();
const router = useRouter();
const confirm = useConfirm();
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
  color: env.ROOM_TYPE_COLORS[0],
  server_pool: null,
  max_duration: null,
  max_participants: null,
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
  visibility_default: 0,
  visibility_enforced: false,
  has_access_code_default: true,
  has_access_code_enforced: false
});

const name = ref('');

const rolesLoading = ref(false);
const colors = env.ROOM_TYPE_COLORS;

const serverPoolsLoading = ref(false);
const serverPools = ref([]);
const serverPoolsCurrentPage = ref(1);
const serverPoolsHasNextPage = ref(false);

const rolesLoadingError = ref(false);
const modelLoadingError = ref(false);
const serverPoolsLoadingError = ref(false);

const serverPoolMultiselectRef = ref();

/**
 * Loads the role from the backend and also a part of permissions that can be selected.
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
        router.push({ name: 'settings.room_types' });
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
    router.push({ name: 'settings.room_types.view', params: { id: response.data.data.id }, query: { view: '1' } });
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      // handle stale errors
      handleStaleError(error.response.data);
    } else if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
      api.error(error);
      router.push({ name: 'settings.room_types' });
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
