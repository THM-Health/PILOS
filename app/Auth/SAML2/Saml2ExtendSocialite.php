<?php

namespace App\Auth\SAML2;

use SocialiteProviders\Manager\SocialiteWasCalled;

class Saml2ExtendSocialite
{
    public function handle(SocialiteWasCalled $socialiteWasCalled)
    {
        $socialiteWasCalled->extendSocialite('saml2', Saml2Provider::class);
    }
}
