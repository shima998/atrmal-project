<?php
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

define('DATA_DIR', __DIR__ . '/../data');
define('USERS_FILE', DATA_DIR . '/users.json');
define('ADMIN_PASSWORD', 'atrmal@1405');

function getUsers() {
  if (!file_exists(USERS_FILE)) {
    file_put_contents(USERS_FILE, '[]', LOCK_EX);
    return [];
  }
  $data = file_get_contents(USERS_FILE);
  return json_decode($data, true) ?: [];
}

function saveUsers($users) {
  file_put_contents(USERS_FILE, json_encode($users, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

function response($data, $status = 200) {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function error($msg, $status = 400) {
  response(['success' => false, 'error' => $msg], $status);
}

function requireAdmin() {
  if (empty($_SESSION['atrmal_admin']) || empty($_SESSION['expires']) || $_SESSION['expires'] < time()) {
    session_destroy();
    error('Unauthorized', 401);
  }
}
