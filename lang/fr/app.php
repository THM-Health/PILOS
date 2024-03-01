<?php

return [
    'actions'       => 'Actions',
    'back'          => 'Retour',
    'browse'        => 'Parcourir',
    'button_styles' => [
        'danger'    => 'Danger',
        'dark'      => 'Nuit',
        'info'      => 'Info',
        'light'     => 'Jour',
        'link'      => 'Lien',
        'primary'   => 'Primaire',
        'secondary' => 'Secondaire',
        'success'   => 'Succes',
        'warning'   => 'Avertissement',
    ],
    'cancel'      => 'Annuler',
    'close'       => 'Fermer',
    'continue'    => 'Continuer',
    'delete'      => 'Supprimer',
    'description' => 'Description',
    'disable'     => 'Désactiver',
    'disabled'    => 'Désactivé',
    'email'       => 'E-mail',
    'enable'      => 'Activer',
    'enabled'     => 'Activé',
    'error'       => 'Une erreur est survenue',
    'errors'      => [
        'attendance_agreement_missing' => 'Le consentement à l\'enregistrement des présences est requis.',
        'file_not_found'               => 'Le fichier n\'a pas pu être trouvé.',
        'meeting_attendance_disabled'  => 'L\'enregistrement des présences n\'est pas disponible.',
        'meeting_attendance_not_ended' => 'L\'enregistrement des présences n\'est pas encore terminé pour cette salle.',
        'meeting_statistics_disabled'  => 'Les données d\'utilisations sont indisponibles.',
        'membership_disabled'          => 'Accès échoué ! L\'accès à cette salle n\'est actuellement pas disponible.',
        'no_room_access'               => 'Vous ne disposez pas des autorisations nécessaires pour modifier cette salle.',
        'no_server_available'          => 'Actuellement, il n\'y a pas de serveurs disponibles.',
        'not_member_of_room'           => 'Cette personne n\'est pas (plus) membre de cette salle.',
        'not_running'                  => 'Accès échoué ! La salle est actuellement fermée.',
        'role_delete_linked_users'     => 'Ce rôle est associé à certains utilisateurs et ne peut donc pas être supprimé !',
        'role_update_permission_lost'  => 'Ces modifications du rôle vous feraient perdre vos permissions d\'accès et de modification des rôles !',
        'room_limit_exceeded'          => 'La création de la salle a échouée ! Vous avez atteint la quantité maximum de salles.',
        'room_start'                   => 'L\'ouverture de la salle a échouée ! La salle n\'a pas pu être démarrée.',
        'room_type_invalid'            => 'Le type de salle est restreint pour des groupes d\'utilisateurs spécifiques. Si vous êtes le propriétaire de la salle, vous pouvez modifier le type de salle.',
        'server_delete_failed'         => 'Le serveur n\'a pas pu être supprimé. Pour supprimer le serveur, il doit être désactivé et aucune réunion ne doit être en cours.',
        'server_pool_delete_failed'    => 'Le groupe de serveurs n\'a pas pu être supprimé. Pour supprimer ce groupe, il ne doit être assigné à aucun type de salle.',
        'stale_model'                  => 'L\'entité :model a été mise à jour entre-temps !',
        'token_not_found'              => 'Le lien de la salle personnalisée est introuvable.',
    ],
    'firstname' => 'Prénom',
    'flash'     => [
        'client_error' => 'Une erreur inconnue s\'est produite dans l\'application !',
        'guests_only'  => 'La demande ne peut être faite que par les invités !',
        'server_error' => [
            'empty_message' => 'Une erreur s\'est produite sur le serveur lors de la requête !',
            'error_code'    => 'Code d\'erreur: :statusCode',
            'message'       => ':message',
        ],
        'too_large'         => 'Les données transmises étaient trop volumineuses !',
        'too_many_requests' => 'Trop de demandes. Veuillez réessayer plus tard svp.',
        'unauthenticated'   => 'Vous devez être authentifié pour continuer !',
        'unauthorized'      => 'Vous n\'avez pas les droits nécessaires pour continuer !',
    ],
    'footer' => [
        'legal_notice'   => 'Mentions légales',
        'privacy_policy' => 'Politique de confidentialité',
    ],
    'help'         => 'Vous avez besoin d\'aide ?',
    'home'         => 'Accueil',
    'id'           => 'ID',
    'lastname'     => 'Nom',
    'link_targets' => [
        'blank' => 'Ouvrir dans un nouvel onglet',
        'self'  => 'Ouvrir dans l\'onglet actuel',
    ],
    'model' => [
        'roles'        => 'rôle',
        'room_types'   => 'type de salle',
        'server_pools' => 'groupe de serveurs',
        'servers'      => 'serveur',
        'users'        => 'utilisateur',
    ],
    'model_name'  => 'Nom',
    'next'        => 'Suivant',
    'next_page'   => 'Page suivante',
    'no'          => 'Non',
    'not_found'   => '404 | Cette resource n\'a pas été trouvé',
    'overwrite'   => 'Écraser',
    'permissions' => [
        'application_settings' => [
            'title'    => 'Application',
            'update'   => 'Modifier les paramètres',
            'view_any' => 'Voir tous les paramètres',
        ],
        'meetings' => [
            'title'    => 'Réunions',
            'view_any' => 'Voir toutes les réunions',
        ],
        'roles' => [
            'create'   => 'Créer des rôles',
            'delete'   => 'Supprimer des rôles',
            'title'    => 'Rôles',
            'update'   => 'Modifier les rôles',
            'view'     => 'Voir les rôles',
            'view_any' => 'Voir tous les rôles',
        ],
        'room_types' => [
            'create' => 'Créer des types de salle',
            'delete' => 'Supprimer des types de salle',
            'title'  => 'Types de salle',
            'update' => 'Modifier les types de salle',
            'view'   => 'Voir les types de salle',
        ],
        'rooms' => [
            'create'   => 'Créer des salles',
            'manage'   => 'Gérer toutes les salles',
            'title'    => 'Salles',
            'view_all' => 'Voir toutes les salles',
        ],
        'server_pools' => [
            'create'   => 'Créer des groupes de serveurs',
            'delete'   => 'Supprimer des groupes de serveurs',
            'title'    => 'Groupes de serveurs',
            'update'   => 'Modifier les groupes de serveurs',
            'view'     => 'Voir les groupes de serveurs',
            'view_any' => 'Voir tous les groupes de serveurs',
        ],
        'servers' => [
            'create'   => 'Créer des serveurs',
            'delete'   => 'Supprimer des serveurs',
            'title'    => 'Serveurs',
            'update'   => 'Modifier des serveurs',
            'view'     => 'Voir les serveurs',
            'view_any' => 'Voir tous les serveurs',
        ],
        'settings' => [
            'manage' => 'Gérer les paramètres',
            'title'  => 'Paramètres',
        ],
        'users' => [
            'create'                => 'Créer des utilisateurs',
            'delete'                => 'Supprimer des utilisateurs',
            'title'                 => 'Utilisateurs',
            'update'                => 'Modifier les utilisateurs',
            'update_own_attributes' => 'Mettre à jour son nom et son adresse e-mail',
            'view'                  => 'Voir les utilisateurs',
            'view_any'              => 'Voir tous les utilisateurs',
        ],
    ],
    'previous_page' => 'Page précédente',
    'profile'       => 'Profil',
    'reload'        => 'Recharger',
    'reset'         => 'Réinitialiser',
    'roles'         => 'Rôles',
    'room_limit'    => 'Limitation de salle',
    'room_types'    => 'Types de salle',
    'rooms'         => 'Salles',
    'save'          => 'Enregistrer',
    'search'        => 'Rechercher',
    'security'      => 'Securité',
    'select_locale' => 'Merci de choisir une langue',
    'server'        => 'Serveur',
    'server_pool'   => 'Groupe de serveurs',
    'server_pools'  => 'Groupes de serveurs',
    'servers'       => 'Serveurs',
    'undo_delete'   => 'Annuler la suppression',
    'unlimited'     => 'Illimité',
    'user'          => 'Utilisateur',
    'user_name'     => 'Nom',
    'users'         => 'Utilisateurs',
    'validation'    => [
        'too_large' => 'Le fichier sélectionné est trop volumineux.',
    ],
    'verify_email' => [
        'fail'    => 'Votre adresse e-mail n\'a pas pu être vérifiée !',
        'invalid' => 'Le lien de vérification est invalide ou a expiré !',
        'success' => 'Votre adresse e-mail a été vérifiée avec succès !',
        'title'   => 'Vérification de l\'e-mail',
    ],
    'version' => 'Version',
    'view'    => 'Voir',
    'wait'    => 'Veuillez patienter...',
    'yes'     => 'Oui',
];
