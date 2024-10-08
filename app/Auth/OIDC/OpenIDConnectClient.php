<?php
/**
 * Heavily inspired by https://github.com/jumbojett/OpenID-Connect-PHP/issues/374#issuecomment-1559028131
 */

namespace App\Auth\OIDC;

use App;
use Jumbojett\OpenIDConnectClient as OpenIDConnectClientBase;
use Session;

class OpenIDConnectClient extends OpenIDConnectClientBase
{
    protected function startSession(): void
    {
        // Nothing to do here, as Laravel does the magic
    }

    protected function commitSession(): void
    {
        Session::save();
    }

    /**
     * @param string $key
     */
    protected function getSessionKey($key): mixed
    {
        if (!Session::has($key)) {
            return false;
        }

        return Session::get($key);
    }

    /**
     * @param string $key
     * @param mixed $value mixed
     */
    protected function setSessionKey($key, $value): void
    {
        Session::put($key, $value);
    }

    /**
     * @param string $key
     */
    protected function unsetSessionKey($key): void
    {
        Session::remove($key);
    }

    /**
     * Overwrite the redirect method to use Laravel abort method.
     * Sometimes the error 'Cannot modify header information - headers already sent' was thrown.
     * By using Laravel abort method, this error is prevented.
     * @param string $url
     * @return void
     */
    public function redirect(string $url): void
    {
        App::abort(302, '', ['Location' => $url]);
    }

    /**
     * Checks if an end_session_endpoint is available in the OIDC provider's well-known configuration.
     * @return {boolean}
     */
    public function hasEndSessionEndpoint(): bool
    {
        return (bool) $this->getProviderConfigValue('end_session_endpoint', false);
    }

}
