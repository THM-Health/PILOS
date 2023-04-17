<?php

namespace App\Auth\SAML2;

use DateTime;
use LightSaml\Credential\KeyHelper;
use LightSaml\Error\LightSamlSecurityException;
use LightSaml\Error\LightSamlValidationException;
use LightSaml\Helper;
use LightSaml\Model\Assertion\Issuer;
use LightSaml\Model\Assertion\NameID;
use LightSaml\Model\Metadata\KeyDescriptor;
use LightSaml\Model\Protocol\AuthnRequest;
use LightSaml\Model\Protocol\LogoutRequest;
use LightSaml\Model\Protocol\NameIDPolicy;
use LightSaml\SamlConstants;
use SocialiteProviders\Saml2\InvalidSignatureException;
use SocialiteProviders\Saml2\Provider;

class Saml2Provider extends Provider
{

    public function logout($nameId, $redirect){
    

        $bindingType = $this->getConfig('idp_binding_method', SamlConstants::BINDING_SAML2_HTTP_REDIRECT);

        $identityProviderConsumerService = $this->getIdentityProviderEntityDescriptor()
            ->getFirstIdpSsoDescriptor()
            ->getFirstSingleSignOnService($bindingType);


        $logoutRequest = new LogoutRequest();
        $logoutRequest
            ->setID(Helper::generateID())
            ->setIssueInstant(new DateTime())
            ->setDestination($identityProviderConsumerService->getLocation())
            ->setIssuer(new Issuer($this->getServiceProviderEntityDescriptor()->getEntityID()))
            ->setNameID((new NameID())->setFormat($this->getNameIDFormat())->setValue($nameId));

        $reponse = $this->sendMessage($logoutRequest, $identityProviderConsumerService->getBinding());
        return $reponse->getTargetUrl();
    }


    public function getLogoutMessageContext()
    {
        $this->receive();
        return $this->messageContext;
    }

    public function getLogoutRequestMessage()
    {
        $logoutRequest = $this->messageContext->asLogoutRequest();

        if ($this->getIdentityProviderEntityDescriptor()->getEntityID() !== $logoutRequest->getIssuer()->getValue()) {
            throw new LightSamlValidationException('The issuer entity id did not match the configured identity provider entity id');
        }

        $idpSsoDescriptor = $this->getIdentityProviderEntityDescriptor()->getFirstIdpSsoDescriptor();

        $keyDescriptors = array_merge(
            $idpSsoDescriptor->getAllKeyDescriptorsByUse(KeyDescriptor::USE_SIGNING),
            $idpSsoDescriptor->getAllKeyDescriptorsByUse(null),
        );

        /** @var SignatureXmlReader $signatureReader */
        $signatureReader = $logoutRequest->getSignature();

        if (!$signatureReader) {
            throw new InvalidSignatureException('The received assertion had no available signature');
        }

        foreach ($keyDescriptors as $keyDescriptor) {
            $key = KeyHelper::createPublicKey($keyDescriptor->getCertificate());

            try {
                if ($signatureReader->validate($key)) {
                    return $logoutRequest->getNameID()->getValue();
                }
            } catch (LightSamlSecurityException $e) {
                continue;
            }
        }

        throw new InvalidSignatureException('The signature of the assertion could not be verified');
    }


    public function validateLogoutResponse(){

        $logoutResponse = $this->messageContext->asLogoutResponse();
        $status = $logoutResponse->getStatus();

        if (!$status->isSuccess()) {
            throw new LightSamlValidationException('Server responded with an unsuccessful status: '.$status->getStatusCode()->getValue());
        }

        if ($this->getIdentityProviderEntityDescriptor()->getEntityID() !== $logoutResponse->getIssuer()->getValue()) {
            throw new LightSamlValidationException('The issuer entity id did not match the configured identity provider entity id');
        }


        $idpSsoDescriptor = $this->getIdentityProviderEntityDescriptor()->getFirstIdpSsoDescriptor();

        $keyDescriptors = array_merge(
            $idpSsoDescriptor->getAllKeyDescriptorsByUse(KeyDescriptor::USE_SIGNING),
            $idpSsoDescriptor->getAllKeyDescriptorsByUse(null),
        );

        /** @var SignatureXmlReader $signatureReader */
        $signatureReader = $logoutResponse->getSignature();

        if (!$signatureReader) {
            throw new InvalidSignatureException('The received assertion had no available signature');
        }

        foreach ($keyDescriptors as $keyDescriptor) {
            $key = KeyHelper::createPublicKey($keyDescriptor->getCertificate());

            try {
                if ($signatureReader->validate($key)) {
                    return;
                }
            } catch (LightSamlSecurityException $e) {
                continue;
            }
        }

        throw new InvalidSignatureException('The signature of the assertion could not be verified');
    }
    
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