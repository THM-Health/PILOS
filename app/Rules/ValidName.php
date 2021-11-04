<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class ValidName implements Rule
{
    const ALLOWED_CHARS = "A-Za-zàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ∂ð ,.'\-+/&";
    private $failedChars;
    private $attribute;

    public function __construct()
    {
        //
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (preg_match('#^['.self::ALLOWED_CHARS.']+$#u', $value)) {
            return true;
        }
        $this->attribute   = $attribute;
        $this->failedChars = array_unique(str_split(preg_replace('#['.self::ALLOWED_CHARS.']+#u', '', $value)));

        return false;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        $invalidChars = implode('', $this->failedChars);
        $validUTF8    = mb_check_encoding($invalidChars, 'UTF-8');
        if ($validUTF8) {
            return __('validation.validname', ['attribute' => __('validation.attributes.'.$this->attribute),'chars'=> $invalidChars]);
        } else {
            return __('validation.validname_error', ['attribute' => __('validation.attributes.'.$this->attribute)]);
        }
    }
}
