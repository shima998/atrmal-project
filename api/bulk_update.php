<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  error('Method not allowed', 405);
}

requireAdmin();

$input = json_decode(file_get_contents('php://input'), true);
$ids = $input['ids'] ?? [];

if (empty($ids) || !is_array($ids)) {
  error('شناسه‌هایی برای ویرایش ارسال نشده است');
}

$users = getUsers();
$idSet = array_map('strval', $ids);
$updateCount = 0;

foreach ($users as &$user) {
  $id = strval($user['id'] ?? $user['timestamp'] ?? '');
  if (in_array($id, $idSet, true)) {
    if (!empty($input['firstName'])) $user['firstName'] = $input['firstName'];
    if (!empty($input['lastName'])) $user['lastName'] = $input['lastName'];
    if (!empty($input['nationalCode'])) $user['nationalCode'] = $input['nationalCode'];
    if (!empty($input['phone'])) $user['phone'] = $input['phone'];
    $updateCount++;
  }
}
unset($user);

saveUsers($users);
response(['success' => true, 'updated' => $updateCount]);
