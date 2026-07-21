<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  error('Method not allowed', 405);
}

requireAdmin();

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['id'] ?? '';

if (!$userId) {
  error('شناسه کاربر ارسال نشده است');
}

$users = getUsers();
$found = false;

$users = array_values(array_filter($users, function($user) use ($userId, &$found) {
  $id = $user['id'] ?? $user['timestamp'] ?? '';
  if ((string)$id === (string)$userId) {
    $found = true;
    return false;
  }
  return true;
}));

if (!$found) {
  error('کاربر یافت نشد', 404);
}

saveUsers($users);
response(['success' => true]);
