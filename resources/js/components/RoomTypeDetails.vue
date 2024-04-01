<template>
  <div class="flex flex-column gap-2 w-full">
      <RoomTypeBadge :roomType="roomType" class="w-full text-base" />

      <div class="overflow-y-auto w-full" style="height:220px">
      <div class="flex flex-column gap-2 border-1 border-200 border-round p-3">
        <span class="font-bold">{{ $t('app.description') }}</span>
        <div>{{roomType.description? roomType.description: 'Keine Beschreibung vorhanden'}}</div>

        <Accordion>
          <AccordionTab header="Room Settings">

<!--            ToDo think about moving outside (could maybe be used again for message/information when changing
                room type while in expert mode)-->

            <h4 class="my-2">{{ $t('rooms.settings.general.title') }}</h4>
            <div class="field grid">
              <label for="allow_guests_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.security.allow_guests')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="allow_guests_default"
                    :model-value="roomType.allow_guests_default"
                    disabled
                  />
                  <Tag v-if="roomType.allow_guests_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary">
                    Default
                  </Tag>
              </div>
            </div>

            <h4 class="my-2">Videokonferenz</h4>

            <div class="field grid">
              <label for="everyone_can_start_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.permissions.everyone_start')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="everyone_can_start_default"
                    :model-value="roomType.everyone_can_start_default"
                    disabled
                  />
                  <Tag v-if="roomType.everyone_can_start_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary">
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="mute_on_start_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.permissions.mute_mic')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="mute_on_start_default"
                    :model-value="roomType.mute_on_start_default"
                    disabled
                  />
                  <Tag v-if="roomType.mute_on_start_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary">
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="default_role_default" class="col-6 mb-0 align-items-center">{{ $t('rooms.settings.participants.waiting_room.title') }}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <span v-if="roomType.lobby_default === 0"> {{ $t('app.disabled') }}</span>
                  <span v-if="roomType.lobby_default === 1"> {{ $t('app.enabled') }}</span>
                  <span v-if="roomType.lobby_default === 2"> {{ $t('rooms.settings.participants.waiting_room.only_for_guests_enabled') }}</span>
                <Tag v-if="roomType.lobby_enforced" severity="danger">
                  Enforced
                </Tag>
                <Tag v-else severity="secondary">
                  Default
                </Tag>
              </div>
<!--              ToDo Delete or add?
                  <div class="col-12 mt-2">-->
<!--                &lt;!&ndash; Alert shown when default role is moderator and waiting room is active &ndash;&gt;-->
<!--                <InlineNote-->
<!--                  class="w-full"-->
<!--                  v-if="showLobbyAlert"-->
<!--                  severity="warn"-->
<!--                >-->
<!--                  {{ $t('rooms.settings.participants.waiting_room_alert') }}-->
<!--                </InlineNote>-->
<!--              </div>-->
            </div>

            <h4 class="my-2" >Einschränkungen</h4>
            <div class="field grid">
              <label for="lock_settings_disable_cam_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_cam')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="lock_settings_disable_cam_default"
                    :model-value="roomType.lock_settings_disable_cam_default"
                    disabled
                  />
                  <Tag v-if="roomType.lock_settings_disable_cam_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary" >
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="webcams_only_for_moderator_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.restrictions.only_mod_see_cam')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="webcams_only_for_moderator_default"
                    :model-value="roomType.webcams_only_for_moderator_default"
                    disabled
                  />
                  <Tag v-if="roomType.webcams_only_for_moderator_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary" >
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="lock_settings_disable_mic_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_mic')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="lock_settings_disable_mic_default"
                    :model-value="roomType.lock_settings_disable_mic_default"
                    disabled
                  />
                  <Tag v-if="roomType.lock_settings_disable_mic_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary" >
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="lock_settings_disable_public_chat_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_public_chat')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="lock_settings_disable_public_chat_default"
                    :model-value="roomType.lock_settings_disable_public_chat_default"
                    disabled
                  />
                  <Tag v-if="roomType.lock_settings_disable_public_chat_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary" >
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="lock_settings_disable_private_chat_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_private_chat')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="lock_settings_disable_private_chat_default"
                    :model-value="roomType.lock_settings_disable_private_chat_default"
                    disabled
                  />
                  <Tag v-if="roomType.lock_settings_disable_private_chat_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary" >
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="lock_settings_disable_public_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.restrictions.disable_note_edit')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="lock_settings_disable_public_default"
                    :model-value="roomType.lock_settings_disable_note_default"
                    disabled
                  />
                  <Tag v-if="roomType.lock_settings_disable_note_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary" >
                    Default
                  </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="lock_settings_hide_user_list_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.restrictions.hide_participants_list')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                  <InputSwitch
                    input-id="lock_settings_hide_user_list_default"
                    :model-value="roomType.lock_settings_hide_user_list_default"
                    disabled
                  />
                  <Tag v-if="roomType.lock_settings_hide_user_list_enforced" severity="danger">
                    Enforced
                  </Tag>
                  <Tag v-else severity="secondary" >
                    Default
                  </Tag>
              </div>
            </div>

            <h4 class="my-2">Mitglieder</h4>
            <div class="field grid">
              <label for="allow_membership_default" class="col-6 mb-0 align-items-center">{{$t('rooms.settings.security.allow_new_members')}}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                <InputSwitch
                  input-id="allow_membership_default"
                  :model-value="roomType.allow_membership_default"
                  disabled
                />

                <Tag v-if="roomType.allow_membership_enforced" severity="danger">
                  Enforced
                </Tag>
                <Tag v-else severity="secondary">
                  Default
                </Tag>
              </div>
            </div>

            <div class="field grid">
              <label for="default_role_default" class="col-6 mb-0 align-items-center">{{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}</label>
              <div class="col-6 flex justify-content-between align-items-center gap-2">
                <RoomRoleBadge :role="roomType.default_role_default"/>
                <Tag v-if="roomType.default_role_enforced" severity="danger">
                  Enforced
                </Tag>
                <Tag v-else severity="secondary" >
                  Default
                </Tag>
              </div>
            </div>

            <h4 class="my-2">Erweitert</h4>
          </AccordionTab>
        </Accordion>
      </div>
      </div>

  </div>
</template>

<script setup>

import { computed } from 'vue';

const props = defineProps({
  roomType: {
    type: Object,
    required: true
  }
});

/**
 * Show alert if simultaneously default role is moderator and waiting room is active
 */
const showLobbyAlert = computed(() => { // ToDo delete again or add????
  return props.roomType.default_role_default === 2 && props.roomType.lobby_default === 1;
});

</script>

<style scoped>

</style>
