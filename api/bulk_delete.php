<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  error('Method not allowed', 405);
}

requireAdmin();

$input = json_decode(file_get_contents('php://input'), true);
$ids = $input['ids'] ?? [];

if (empty($ids) || !is_array($ids)) {
  error('شناسه‌هایی برای حذف ارسال نشده است');
}

$users = getUsers();
$idSet = array_map('strval', $ids);

$users = array_values(array_filter($users, function($user) use ($idSet) {
  $id = strval($user['id'] ?? $user['timestamp'] ?? '');
  return !in_array($id, $idSet, true);
}));

saveUsers($users);
response(['success' => true, 'deleted' => count($ids) - count($users)]);
