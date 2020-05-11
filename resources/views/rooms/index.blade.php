@extends('layouts.app')

@section('content')
    <div class="background">
        <div class="container">

            <div class="row pt-7 pt-sm-9">
                <div class="col-lg-8 col-sm-12">

                    <div id="room-title" class="display-3 form-inline">
                        <h1 contenteditable=false id="user-text" class="display-3 text-left mb-3 font-weight-400">
                            Startseite</h1>
                        <a class="disable-click"><i class="fas fa-home align-top home-indicator ml-2"></i></a>
                    </div>
                </div>
            </div>

            <h1>Meine Räume</h1>
            <div id="room_block_container" class="row pb-5">
                @foreach($myRooms as $room)
                <div class="col-lg-4 col-md-6 col-sm-12">
                    <a href="{{route('rooms.show',['room'=>$room])}}">

                        <div id="room-block" data-path="/b/sam-d4h-hxm/update_settings" data-room-access-code=""
                             class="card">
                            <div class="card-body p-1">
                                <table class="table table-hover table-vcenter text-wrap table-no-border">
                                    <tbody class="no-border-top">
                                    <td>
                                      <span class="stamp stamp-md bg-primary">
                                        <i class="fas fa-chalkboard-teacher"></i>
                                      </span>
                                    </td>
                                    <td>
                                        <div id="room-name">
                                            <h4 id="room-name-text" contenteditable="false"
                                                class="m-0 force-text-normal">test</h4>
                                        </div>
                                        <div id="room-name-editable" style="display: none">
                                            <input id="room-name-editable-input" class="form-control input-sm w-100 h-4"
                                                   value="test">
                                        </div>
                                        <div class="small text-muted">
                                            <i>Letzte Konferenz am Mai 01, 2020</i>
                                        </div>
                                    </td>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </a>
                    @endforeach

                </div>


                <div class="col-lg-4 col-md-6 col-sm-12">
                    <div id="create-room-block" class="card-body p-1 mb-5 background" data-toggle="modal"
                         data-target="#createRoomModal">
                        <div class="row p-3">
                            <div class="col-4">
        <span class="stamp stamp-md bg-primary">
          <i class="fas fa-plus"></i>
        </span>
                            </div>
                            <div class="col-8">
                                <h4 class="my-2">Raum erstellen</h4>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
            <h1>Mit mir geteilte Räume</h1>
            <div id="room_block_container" class="row pb-5">

                <div class="col-lg-4 col-md-6 col-sm-12">
                    <i>Keine Räume vorhanden</i>
                </div>
            </div>
            <h1>Kürzlich betretenen Räume</h1>
            <div id="room_block_container" class="row pb-5">
                <div class="col-lg-4 col-md-6 col-sm-12">
                    <a href="/b/sam-d4h-hxm">

                        <div id="room-block" data-room-uid="sam-d4h-hxm"
                             data-room-settings={&quot;muteOnStart&quot;:false,&quot;requireModeratorApproval&quot;:true,&quot;anyoneCanStart&quot;:false,&quot;joinModerator&quot;:false}
                             data-room-access-code="" class="card">
                            <div class="card-body p-1">
                                <table class="table table-hover table-vcenter text-wrap table-no-border">
                                    <tbody class="no-border-top">
                                    <td>
          <span class="stamp stamp-md bg-primary">
            <i class="fas fa-share-alt"></i>
          </span>
                                    </td>
                                    <td>
                                        <div id="room-name">
                                            <h4 contenteditable="false" class="m-0 force-text-normal">test</h4>
                                        </div>
                                        <div class="small text-muted text-break">
                                            Geteilt von Samuel Weirich
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="item-action dropdown" data-display="static">
                                            <a href="javascript:void(0)" data-toggle="dropdown" data-display="static"
                                               class="icon">
                                                <i class="fas fa-ellipsis-v px-4"></i>
                                            </a>
                                            <div class="dropdown-menu dropdown-menu-right dropdown-menu-md-left">
                                                <a href="" data-toggle="modal" data-target="#removeAccessModal"
                                                   class="remove-share-room dropdown-item"
                                                   data-path="/b/sam-d4h-hxm/remove_shared_access">
                                                    <i class="dropdown-icon far fa-trash-alt"></i> Entfernen
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </a></div>
            </div>
        </div>

    </div>

    <div class="modal fade" id="deleteRoomModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content text-center">
                <div class="modal-body">
                    <div class="card-body p-6">
                        <div class="card-title">
                            <h3 id="delete-header"></h3>
                        </div>

                        <button type="button" class="btn btn-info my-1 btn-del-room" data-dismiss="modal">
                            Ich will ihn doch nicht löschen.
                        </button>

                        <form class="button_to" method="post" action="/"><input type="hidden" name="_method"
                                                                                value="delete"/>
                            <button id="delete-confirm" class="btn btn-danger my-1 btn-del-room" data-disable=""
                                    type="submit">
                                Ich will diesen Raum löschen.
                            </button>
                            <input type="hidden" name="authenticity_token"
                                   value="iTUyD+vo1wfW+HbW1ComECAehvR8MauNMPTBYjpWfRhhZVHEWWBUhWThxQ1EbuzLyEDtKcqFQ4h/zzFRenhpTQ=="/>
                        </form>
                    </div>
                    <div class="card-footer">
                        <p id="delete-footer">
                            Sie werden <b>nicht</b> in der Lage sein, diesen Raum wiederherzustellen
                            oder jegliche seiner verknüpften Aufzeichnungen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>



    <di class="modal fade" id="createRoomModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content text-center">
                <div class="modal-body">
                    <div class="card-body p-sm-6">
                        <div class="card-title">
                            <h3 class="create-only">Neuen Raum erstellen</h3>
                            <h3 class="update-only">Raumeinstellungen</h3>
                        </div>

                        <form action="/b/" accept-charset="UTF-8" method="post"><input name="utf8" type="hidden"
                                                                                       value="&#x2713;"/><input
                                    type="hidden" name="authenticity_token"
                                    value="d4/npXtHp1gqvtVTUVyszbZt0z6tAxAt915yiQvxxesKRMKPHmVqxLprfWfBPkLpQsnHx76kWTbC1Z9qbG2vkw=="/>
                            <div class="input-icon mb-2">
              <span class="input-icon-addon">
                <i class="fas fa-chalkboard-teacher"></i>
              </span>
                                <input id="create-room-name" class="form-control text-center" value=""
                                       placeholder="Geben Sie einen Raumnamen ein..." autocomplete="off" type="text"
                                       name="room[name]"/>
                                <div class="invalid-feedback text-left">Es muss ein Raumname angegeben werden.</div>
                            </div>

                            <div class="input-icon mb-2">
              <span onclick="generateAccessCode()" class="input-icon-addon allow-icon-click cursor-pointer">
                <i class="fas fa-dice"></i>
              </span>
                                <label id="create-room-access-code" class="form-control" for="room_access_code">Generieren
                                    eines optionalen Raumzugangscodes</label>
                                <input type="hidden" name="room[access_code]" id="room_access_code"/>
                                <span onclick="ResetAccessCode()"
                                      class="input-icon-addon allow-icon-click cursor-pointer">
                <i class="far fa-trash-alt"></i>
              </span>
                            </div>

                            <label class="custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block">
                                <span class="custom-switch-description">Teilnehmer beim Betreten stummschalten</span>
                                <input name="room[mute_on_join]" type="hidden" value="0"/><input
                                        class="custom-switch-input" type="checkbox" value="1" name="room[mute_on_join]"
                                        id="room_mute_on_join"/>
                                <span class="custom-switch-indicator float-right cursor-pointer"></span>
                            </label>

                            <label class="custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block">
                                <span class="custom-switch-description">Freigabe durch Moderator bevor der Raum betreten werden kann</span>
                                <input name="room[require_moderator_approval]" type="hidden" value="0"/><input
                                        class="custom-switch-input" type="checkbox" value="1"
                                        name="room[require_moderator_approval]" id="room_require_moderator_approval"/>
                                <span class="custom-switch-indicator float-right cursor-pointer"></span>
                            </label>

                            <label class="custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block">
                                <span class="custom-switch-description">Jeder Teilnehmer kann das Meeting starten</span>
                                <input name="room[anyone_can_start]" type="hidden" value="0"/><input
                                        class="custom-switch-input" type="checkbox" value="1"
                                        name="room[anyone_can_start]" id="room_anyone_can_start"/>
                                <span class="custom-switch-indicator float-right cursor-pointer"></span>
                            </label>

                            <label class="custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block">
                                <span class="custom-switch-description">Alle Nutzer nehmen als Moderator teil</span>
                                <input name="room[all_join_moderator]" type="hidden" value="0"/><input
                                        class="custom-switch-input" type="checkbox" value="1"
                                        name="room[all_join_moderator]" id="room_all_join_moderator"/>
                                <span class="custom-switch-indicator float-right cursor-pointer"></span>
                            </label>

                            <label id="auto-join-label"
                                   class="create-only custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block">
                                <span class="custom-switch-description">Automatisch dem Raum beitreten</span>
                                <input name="room[auto_join]" type="hidden" value="0"/><input
                                        class="custom-switch-input" type="checkbox" value="1" name="room[auto_join]"
                                        id="room_auto_join"/>
                                <span class="custom-switch-indicator float-right cursor-pointer"></span>
                            </label>
                            <div class="mt-4">
                                <input type="submit" name="commit" value="Raum erstellen" id="create-room-submit"
                                       class="create-only btn btn-primary btn-block"
                                       data-disable-with="Raum erstellen"/>
                                <input type="submit" name="commit" value="Raum aktualisieren" id="create-room-submit"
                                       class="update-only btn btn-primary btn-block"
                                       data-disable-with="Raum aktualisieren"/>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer">
                        <p class="create-only">Sie können den Raum jederzeit wieder löschen.</p>
                        <p class="update-only">Anpassungen des Raums können jederzeit vorgenommen werden.</p>
                    </div>
                </div>
            </div>
        </div>
    </di>
    <div class="modal fade" id="shareRoomModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content text-center">
                <div class="modal-body">
                    <div class="card-body p-6">
                        <div class="card-title">
                            <h3>Raumzugang teilen</h3>
                        </div>
                        <select class="selectpicker" title="Nutzer auswählen" data-live-search="true"
                                data-virtual-scroll="true">
                            <option value="gl-qxgzqujgonet" data-subtext="gl-qxgzqujgonet">Administrator</option>
                            <option value="gl-pymdmkwhcfdt" data-subtext="gl-pymdmkwhcfdt">Thomas Friedl</option>
                            <option value="gl-cndeaeuxatjx" data-subtext="gl-cndeaeuxatjx">Holger Thiemann</option>
                        </select>
                        <div class="mt-5 text-left">
                            <label class="form-label">Geteilt mit</label>
                            <ul id="user-list" class="list-group">
                            </ul>
                        </div>
                        <div class="mt-6">
                            <button id="save-access" class="btn btn-primary btn-block" onclick="saveAccessChanges()">
                                Änderungen speichern
                            </button>
                            <button class="btn btn-secondary text-primary btn-block"
                                    onclick="$('#shareRoomModal').modal('hide')">Änderungen abbrechen
                            </button>
                        </div>
                    </div>
                    <div class="card-footer">
                        <p>Wenn ein Raum mit einem Nutzer geteilt wird, erhält dieser Nutzer dadurch das Recht im Raum
                            eine Konferenz zu starten und die Aufzeichnungen des Raums anzusehen.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="removeAccessModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content text-center">
                <div class="modal-body">
                    <div class="card-body p-6">
                        <div class="card-title">
                            <h3>Sind Sie sicher, dass Sie diesen Raum aus Ihrer Raumliste entfernen wollen?</h3>
                        </div>

                        <form class="button_to" method="post" action="/"><input type="hidden" name="_method"
                                                                                value="delete"/>
                            <button id="remove-shared-confirm" class="btn btn-danger my-1 btn-del-room" type="submit">
                                <input type="hidden" name="user_id" id="user_id" value="2"/>
                                Ich bin mir sicher. Der Raum soll entfernt werden.
                            </button>
                            <input type="hidden" name="authenticity_token"
                                   value="LXDr95zEXfiwpJWYjELHVkFt2uYoJfETAs4JGt9z17nFIIg8LkzeegK9JkMcBg2NqTOxO56RGRZN9fkpn13D7A=="/>
                        </form>
                    </div>
                    <div class="card-footer">
                        <p id="delete-footer">
                            Sie werden <b>keinen</b> Zugriff mehr auf diesen Raum haben.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
