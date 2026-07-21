<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  error('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
  $input = $_POST;
}

$password = trim($input['password'] ?? '');

if ($password === ADMIN_PASSWORD) {
  $token = bin2hex(random_bytes(32));
  $expires = time() + 3600 * 4;

  $_SESSION['atrmal_admin'] = true;
  $_SESSION['token'] = $token;
  $_SESSION['expires'] = $expires;

  response(['success' => true, 'token' => $token, 'expires' => $expires]);
}

error('رمز عبور اشتباه است', 401);
