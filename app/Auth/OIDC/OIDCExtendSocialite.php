<?php

namespace App\Auth\OIDC;

use SocialiteProviders\Manager\SocialiteWasCalled;

class OIDCExtendSocialite
{
    public function handle(SocialiteWasCalled $socialiteWasCalled)
    {
        $socialiteWasCalled->extendSocialite('oidc', OIDCProvider::class);
    }
}
