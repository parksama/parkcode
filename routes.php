<?php

use App\FileController;
use Pecee\SimpleRouter\SimpleRouter as Router;

Router::get('/', [FileController::class, 'index']);

Router::get('/test', [FileController::class, 'index']);

Router::get('/files', [FileController::class, 'files']);
Router::post('/files/new', [FileController::class, 'new_file']);
Router::post('/files/rename', [FileController::class, 'rename_file']);

Router::get('/content', [FileController::class, 'content']);
Router::post('/content', [FileController::class, 'save']);
