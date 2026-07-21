<?php
require_once __DIR__ . '/config.php';

requireAdmin();

$users = getUsers();

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="atrmal-users-' . date('Y-m-d') . '.csv"');

$output = fopen('php://output', 'w');
fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

fputcsv($output, ['نام', 'نام خانوادگی', '۴ رقم آخر شماره ملی', 'شماره تماس', 'تاریخ ثبت', 'ساعت ثبت']);

foreach (array_reverse($users) as $user) {
  fputcsv($output, [
    $user['firstName'] ?? '',
    $user['lastName'] ?? '',
    $user['nationalCode'] ?? '',
    $user['phone'] ?? '',
    $user['date'] ?? '',
    $user['time'] ?? '',
  ]);
}

fclose($output);
exit;
