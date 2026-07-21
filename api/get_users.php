<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  error('Method not allowed', 405);
}

requireAdmin();

$users = getUsers();

$today = (new DateTime('now', new DateTimeZone('Asia/Tehran')))->format('Y/m/d');
$totalCount = count($users);
$todayCount = count(array_filter($users, fn($u) => ($u['date'] ?? '') === $today));
$phoneCount = count(array_filter($users, fn($u) => !empty($u['phone'])));

response([
  'success' => true,
  'users' => array_reverse($users),
  'stats' => [
    'total' => $totalCount,
    'today' => $todayCount,
    'withPhone' => $phoneCount,
  ],
]);
