<?php

use App\FileController;
use Pecee\SimpleRouter\SimpleRouter as Router;

Router::get('/', [FileController::class, 'index']);

Router::get('/test', [FileController::class, 'index']);

Router::get('/files', [FileController::class, 'files']);

Router::get('/content', [FileController::class, 'content']);
Router::post('/content', [FileController::class, 'save']);
