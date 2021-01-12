<?php

return [
    'errors' => [
        'stale_model'                 => 'Der :model-Datensatz wurde in der Zwischenzeit geändert!',
        'room_start'                  => 'Starten fehlgeschlagen! Der Raum konnte nicht gestartet werden.',
        'not_running'                 => 'Teilnahme fehlgeschlagen! Der Raum ist aktuell geschlossen.',
        'membership_disabled'         => 'Mitgliedschaft fehlgeschlagen! Eine Mitgliedschaft ist in diesem Raum aktuell nicht möglich.',
        'not_member_of_room'          => 'Die Person ist nicht (mehr) Mitglied dieses Raums.',
        'file_not_found'              => 'Die Datei konnte nicht gefunden werden.',
        'no_server_available'         => 'Zur Zeit sind keine Server verfügbar.',
        'room_limit_exceeded'         => 'Raumerstellung fehlgeschlagen! Sie haben die max. Anzahl an Räumen erreicht.',
        'role_delete_linked_users'    => 'Die Rolle ist mit Benutzern verknüpft und kann deshalb nicht gelöscht werden!',
        'role_update_permission_lost' => 'Die Änderungen an der Rolle würden für Sie zum Verlust der Rechte zum Bearbeiten oder Anzeigen von Rollen führen!',
        'server_delete_failed'        => 'Der Server konnte nicht gelöscht werden. Um den Server zu löschen, muss dieser deaktivert werden und es dürfen keine Meetings laufen.'
    ],
    'model' => [
        'roles'        => 'Rollen',
        'users'        => 'Benutzer',
        'room_types'   => 'Raumarten',
        'servers'      => 'Server',
        'server_pools' => 'Serverpool',
    ]
];
