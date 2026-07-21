<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  error('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
  $input = $_POST;
}

$firstName = trim($input['firstName'] ?? '');
$lastName = trim($input['lastName'] ?? '');
$nationalCode = trim($input['nationalCode'] ?? '');
$phone = trim($input['phone'] ?? '');

if (!$firstName || !$lastName || !$nationalCode) {
  error('نام، نام خانوادگی و ۴ رقم آخر شماره ملی اجباری هستند');
}

if (!preg_match('/^\d{4}$/', $nationalCode)) {
  error('۴ رقم آخر شماره ملی باید دقیقاً ۴ رقم باشد');
}

if ($phone && !preg_match('/^[\d\-\(\)\s\+]{6,20}$/', $phone)) {
  error('شماره تماس معتبر نیست');
}

$users = getUsers();

// Check duplicate by normalized name (no spaces)
$inputName = preg_replace('/\s+/', '', $firstName . $lastName);
foreach ($users as $u) {
  $existingName = preg_replace('/\s+/', '', ($u['firstName'] ?? '') . ($u['lastName'] ?? ''));
  if ($existingName === $inputName) {
    error('این نام قبلا ثبت نام کرده است');
  }
}

$user = [
  'id' => time() . rand(100, 999),
  'firstName' => $firstName,
  'lastName' => $lastName,
  'nationalCode' => $nationalCode,
  'phone' => $phone,
  'date' => (new DateTime('now', new DateTimeZone('Asia/Tehran')))->format('Y/m/d'),
  'time' => (new DateTime('now', new DateTimeZone('Asia/Tehran')))->format('H:i:s'),
  'timestamp' => time() * 1000,
];

$users[] = $user;
saveUsers($users);

response(['success' => true, 'user' => $user]);
