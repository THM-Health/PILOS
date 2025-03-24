<?php

namespace App\Support;

use Spatie\Csp\Directive;
use Spatie\Csp\Keyword;
use Spatie\Csp\Policy;
use Spatie\Csp\Preset;

class CSPPolicy implements Preset
{
    public function configure(Policy $policy): void
    {
        $policy
            ->add(Directive::BASE, Keyword::SELF)
            ->add(Directive::CONNECT, Keyword::SELF)
            ->add(Directive::DEFAULT, Keyword::SELF)
            ->add(Directive::FORM_ACTION, Keyword::SELF)
            ->add(Directive::IMG, ['*', 'data:', 'blob:'])
            ->add(Directive::MEDIA, Keyword::SELF)
            ->add(Directive::OBJECT, Keyword::NONE)
            ->add(Directive::STYLE, [Keyword::SELF, Keyword::UNSAFE_INLINE])
            ->addNonce(Directive::SCRIPT);

        // Add Vite dev server to CSP in local environment if vite dev server is running
        if (config('app.env') == 'local' && file_exists(public_path('hot'))) {
            $viteURL = file_get_contents(public_path('hot'));
            $viteURLParts = parse_url($viteURL);

            $policy->add(Directive::BASE, $viteURL)
                ->add(Directive::CONNECT, $viteURL)
                ->add(Directive::CONNECT, 'wss://'.$viteURLParts['host'].':'.$viteURLParts['port'])
                ->add(Directive::CONNECT, 'ws://'.$viteURLParts['host'].':'.$viteURLParts['port'])
                ->add(Directive::DEFAULT, $viteURL)
                ->add(Directive::MEDIA, $viteURL)
                ->add(Directive::STYLE, $viteURL);
        }
    }
}
