<?php
/* Приём заявки с формы и брифа. Сохраняет на сервере и отправляет в Telegram.
   Токен бота и id чата лежат НЕ здесь, а в файле tg-config.php уровнем выше public_html
   (его нет в архиве сайта и он недоступен из интернета). Образец: tg-config.example.php */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function out($ok, $code = 200, $extra = []) {
    http_response_code($code);
    echo json_encode(array_merge(['ok' => $ok], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { out(false, 405); }

/* Принимаем только с самого сайта */
$host = $_SERVER['HTTP_HOST'] ?? '';
$src = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($src !== '' && parse_url($src, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) { out(false, 403); }

/* Настройки */
$cfgFile = getenv('TG_CONFIG') ?: __DIR__ . '/../tg-config.php';
$cfg = is_file($cfgFile) ? include $cfgFile : null;
if (!is_array($cfg) || empty($cfg['token']) || empty($cfg['chat_id'])) { out(false, 500, ['error' => 'config']); }
$api = rtrim($cfg['api_base'] ?? 'https://api.telegram.org', '/');
$dataDir = dirname($cfgFile) . '/leads';
if (!is_dir($dataDir)) { @mkdir($dataDir, 0700, true); }

/* Не больше 6 отправок с одного адреса за 10 минут */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$rl = $dataDir . '/rl-' . md5($ip) . '.json';
$now = time();
$hits = is_file($rl) ? (json_decode((string)@file_get_contents($rl), true) ?: []) : [];
$hits = array_values(array_filter($hits, function ($t) use ($now) { return $t > $now - 600; }));
if (count($hits) >= 6) { out(false, 429, ['error' => 'rate']); }
$hits[] = $now;
@file_put_contents($rl, json_encode($hits), LOCK_EX);

function esc($s) { return htmlspecialchars((string)$s, ENT_NOQUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function clip($s, $n) { $s = trim((string)$s); return mb_strlen($s) > $n ? mb_substr($s, 0, $n) . '…' : $s; }

const SAFE = 3800;

/* Режет блоки на сообщения не длиннее лимита Telegram */
function splitBlocks($blocks, $title = '') {
    $msgs = [];
    $cur = $title;
    $flush = function () use (&$cur, &$msgs, $title) {
        if (trim($cur) !== '' && $cur !== $title) { $msgs[] = $cur; }
        $cur = $title !== '' ? $title . ' (продолжение)' : '';
    };
    foreach ($blocks as $block) {
        $pieces = [];
        if (mb_strlen($block) <= SAFE) { $pieces[] = $block; }
        else {
            for ($i = 0; $i < mb_strlen($block); $i += SAFE) { $pieces[] = mb_substr($block, $i, SAFE); }
        }
        foreach ($pieces as $p) {
            $add = ($cur !== '' ? "\n\n" : '') . $p;
            if (mb_strlen($cur) + mb_strlen($add) > SAFE) { $flush(); $cur .= ($cur !== '' ? "\n\n" : '') . $p; }
            else { $cur .= $add; }
        }
    }
    if (trim($cur) !== '' && $cur !== $title) { $msgs[] = $cur; }
    return $msgs;
}

function tg($api, $token, $method, $fields) {
    $ch = curl_init($api . '/bot' . $token . '/' . $method);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $fields, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25]);
    $res = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code === 429) { sleep(2); return tg($api, $token, $method, $fields); }
    return $code === 200;
}

/* Приложенные файлы: сохраняем на сервере и отправим документами */
$files = [];
$MAX = 10 * 1024 * 1024;
foreach ($_FILES as $f) {
    if (!is_array($f) || ($f['error'] ?? 1) !== UPLOAD_ERR_OK || $f['size'] > $MAX || count($files) >= 6) { continue; }
    $safe = preg_replace('/[^\p{L}\p{N}._-]+/u', '_', basename($f['name']));
    $dest = $dataDir . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '-' . $safe;
    if (move_uploaded_file($f['tmp_name'], $dest)) { $files[] = ['path' => $dest, 'name' => $f['name']]; }
}

$messages = [];
$title = 'заявка';

if (isset($_POST['payload'])) {
    /* Бриф */
    $title = 'бриф';
    $payload = json_decode((string)$_POST['payload'], true);
    if (!is_array($payload)) { out(false, 400, ['error' => 'payload']); }
    $sum = $payload['summary']['items'] ?? [];
    $by = function ($k) use ($sum) { foreach ($sum as $i) { if (($i['key'] ?? '') === $k) { return $i['answer'] ?? ''; } } return ''; };
    $head = ['<b>Новый бриф на сайт</b>', ''];
    if ($by('name')) { $head[] = '<b>Имя:</b> ' . esc($by('name')); }
    if ($by('company')) { $head[] = '<b>Компания:</b> ' . esc($by('company')); }
    if ($by('contact')) { $head[] = '<b>Контакт:</b> ' . esc($by('contact')); }
    $blocks = [implode("\n", $head)];
    foreach ($sum as $i) {
        if (in_array($i['key'] ?? '', ['name', 'company', 'contact'], true)) { continue; }
        $blocks[] = '<b>' . esc($i['label'] ?? '') . "</b>\n" . esc($i['answer'] ?? '');
    }
    if ($files) { $blocks[] = 'Файлов приложено: ' . count($files) . ' (придут следом)'; }
    $messages = splitBlocks($blocks);
    foreach (($payload['stages'] ?? []) as $st) {
        if (empty($st['items'])) { continue; }
        $t = '<b>' . esc($st['num'] ?? '') . ' · ' . esc($st['title'] ?? '') . '</b>';
        $qa = [];
        foreach ($st['items'] as $i) { $qa[] = '<b>' . esc($i['label'] ?? '') . "</b>\n" . esc($i['answer'] ?? ''); }
        $messages = array_merge($messages, splitBlocks($qa, $t));
    }
    $record = ['kind' => 'brief', 'payload' => $payload];
} else {
    /* Заявка с главной */
    $name = clip($_POST['name'] ?? '', 200);
    $contact = clip($_POST['contact'] ?? '', 300);
    if ($name === '' || $contact === '' || empty($_POST['agree'])) { out(false, 400, ['error' => 'fields']); }
    $type = clip($_POST['type'] ?? '', 200) ?: 'Не выбрано';
    $msg = clip($_POST['message'] ?? '', 3000);
    $text = "<b>Новая заявка с сайта</b>\n\n<b>Имя:</b> " . esc($name) . "\n<b>Контакт:</b> " . esc($contact) . "\n<b>Что нужно:</b> " . esc($type);
    if ($msg !== '') { $text .= "\n\n" . esc($msg); }
    if ($files) { $text .= "\n\nФайл придёт следом."; }
    $messages = [$text];
    $record = ['kind' => 'lead', 'name' => $name, 'contact' => $contact, 'type' => $type, 'message' => $msg];
}

/* Сначала сохраняем у себя, чтобы заявка не потерялась, что бы ни случилось с Telegram */
$record['time'] = date('c');
$record['files'] = array_map(function ($f) { return basename($f['path']); }, $files);
$saved = @file_put_contents($dataDir . '/leads-' . date('Y-m') . '.jsonl', json_encode($record, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;

/* Отправка в Telegram */
$sent = true;
foreach ($messages as $m) {
    $sent = tg($api, $cfg['token'], 'sendMessage', ['chat_id' => $cfg['chat_id'], 'text' => $m, 'parse_mode' => 'HTML', 'disable_web_page_preview' => 'true']) && $sent;
}
foreach ($files as $f) {
    $sent = tg($api, $cfg['token'], 'sendDocument', [
        'chat_id' => $cfg['chat_id'],
        'document' => new CURLFile($f['path'], '', $f['name']),
        'caption' => 'Файл к ' . ($title === 'бриф' ? 'брифу' : 'заявке') . ': ' . $f['name'],
    ]) && $sent;
}
if (!$sent) { @file_put_contents($dataDir . '/telegram-errors.log', date('c') . " не доставлено в Telegram\n", FILE_APPEND | LOCK_EX); }

/* Успех, если дошло хотя бы одно: Telegram или запись на сервере */
if ($sent || $saved) { out(true); }
out(false, 502);
