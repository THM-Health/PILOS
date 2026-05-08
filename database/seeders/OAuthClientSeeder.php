<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Laravel\Passport\ClientRepository;

class OAuthClientSeeder extends Seeder
{
    public function run(ClientRepository $clientRepository): void
    {
        $this->createThunderbirdClient($clientRepository);
    }

    private function createThunderbirdClient(ClientRepository $clientRepository): void
    {
        // Fixed UUID for Thunderbird Client
        $thunderbirdUUID = '019d2999-80a3-73e3-9905-263deb882b25';

        // Only create client if it doesn't already exist
        if (! $clientRepository->find($thunderbirdUUID)) {
            $client = $clientRepository->createAuthorizationCodeGrantClient('Thunderbird', ['http://127.0.0.1/mozoauth2/'], false);
            $client->id = $thunderbirdUUID;
            $client->save();
        }
    }
}
