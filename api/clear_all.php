<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  error('Method not allowed', 405);
}

requireAdmin();

saveUsers([]);
response(['success' => true, 'message' => 'تمام اطلاعات پاک شد']);
