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

foreach ($users as &$user) {
  $id = $user['id'] ?? $user['timestamp'] ?? '';
  if ((string)$id === (string)$userId) {
    if (isset($input['firstName'])) $user['firstName'] = $input['firstName'];
    if (isset($input['lastName'])) $user['lastName'] = $input['lastName'];
    if (isset($input['nationalCode'])) $user['nationalCode'] = $input['nationalCode'];
    if (isset($input['phone'])) $user['phone'] = $input['phone'];
    $found = true;
    break;
  }
}
unset($user);

if (!$found) {
  error('کاربر یافت نشد', 404);
}

saveUsers($users);
response(['success' => true, 'user' => $found ? $user : null]);
