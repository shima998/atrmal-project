<?php
require_once __DIR__ . '/config.php';

if (!empty($_SESSION['atrmal_admin']) && !empty($_SESSION['expires']) && $_SESSION['expires'] > time()) {
  response(['authenticated' => true]);
}

session_destroy();
response(['authenticated' => false], 401);
