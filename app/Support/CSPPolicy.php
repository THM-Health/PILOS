<?php

namespace App\Support;

use Spatie\Csp\Directive;
use Spatie\Csp\Keyword;
use Spatie\Csp\Policies\Policy;

class CSPPolicy extends Policy
{
    public function configure()
    {
        $this
            ->addDirective(Directive::BASE, Keyword::SELF)
            ->addDirective(Directive::CONNECT, Keyword::SELF)
            ->addDirective(Directive::DEFAULT, Keyword::SELF)
            ->addDirective(Directive::FORM_ACTION, Keyword::SELF)
            ->addDirective(Directive::IMG, ['*', 'data:', 'blob:'])
            ->addDirective(Directive::MEDIA, Keyword::SELF)
            ->addDirective(Directive::OBJECT, Keyword::NONE)
            ->addDirective(Directive::STYLE, [Keyword::SELF, Keyword::UNSAFE_INLINE])
            ->addNonceForDirective(Directive::SCRIPT);

        // Add Vite dev server to CSP in local environment if vite dev server is running
        if (config('app.env') == 'local' && file_exists(public_path('hot'))) {
            $viteURL = file_get_contents(public_path('hot'));
            $viteURLParts = parse_url($viteURL);

            $this->addDirective(Directive::BASE, $viteURL);
            $this->addDirective(Directive::CONNECT, $viteURL);
            $this->addDirective(Directive::CONNECT, 'wss://'.$viteURLParts['host'].':'.$viteURLParts['port']);
            $this->addDirective(Directive::CONNECT, 'ws://'.$viteURLParts['host'].':'.$viteURLParts['port']);
            $this->addDirective(Directive::DEFAULT, $viteURL);
            $this->addDirective(Directive::MEDIA, $viteURL);
            $this->addDirective(Directive::STYLE, $viteURL);
        }
    }
}
