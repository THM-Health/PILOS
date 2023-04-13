<?php

namespace App\Auth\SAML2;

use DateTime;
use LightSaml\Helper;
use LightSaml\Model\Assertion\Issuer;
use LightSaml\Model\Assertion\NameID;
use LightSaml\Model\Protocol\AuthnRequest;
use LightSaml\Model\Protocol\LogoutRequest;
use LightSaml\Model\Protocol\NameIDPolicy;
use LightSaml\SamlConstants;
use SocialiteProviders\Saml2\Provider;

class Saml2Provider extends Provider
{

    
    public function redirect()
    {
        $bindingType = $this->getConfig('idp_binding_method', SamlConstants::BINDING_SAML2_HTTP_REDIRECT);

        $identityProviderConsumerService = $this->getIdentityProviderEntityDescriptor()
            ->getFirstIdpSsoDescriptor()
            ->getFirstSingleSignOnService($bindingType);

        $authnRequest = new AuthnRequest();
        $authnRequest
            ->setID(Helper::generateID())
            ->setProtocolBinding($this->getDefaultAssertionConsumerServiceBinding())
            ->setIssueInstant(new DateTime())
            ->setForceAuthn(true)
            ->setDestination($identityProviderConsumerService->getLocation())
            ->setNameIDPolicy((new NameIDPolicy())->setFormat($this->getNameIDFormat()))
            ->setIssuer(new Issuer($this->getServiceProviderEntityDescriptor()->getEntityID()))
            ->setAssertionConsumerServiceURL($this->getServiceProviderAssertionConsumerUrl());

        if ($this->usesState()) {
            $this->request->session()->put('state', $state = $this->getState());
            $authnRequest->setRelayState($state);
        }

        return $this->sendMessage($authnRequest, $identityProviderConsumerService->getBinding());
    }
   
}