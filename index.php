<?php

require_once 'vendor/autoload.php';
require_once 'helpers.php';

use Pecee\SimpleRouter\SimpleRouter as Router;

global $baseUrl;
$baseUrl = dirname($_SERVER['SCRIPT_NAME']);
$baseUrl = str_replace('\\', '/', $baseUrl);

global $manifest;
$manifest = json_decode(file_get_contents('mix-manifest.json'), true);

Router::group(['prefix' => $baseUrl], function () {
    include 'routes.php';
});

Router::start();