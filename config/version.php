<?php

$versionFile = base_path('version');
$version = file_exists($versionFile) ? file_get_contents($versionFile) : null;

return $version;