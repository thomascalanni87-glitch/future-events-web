<?php
/*
 * Future Events — envoi des demandes de devis vers contact@future-events.fr
 * Hébergement : LWS (fonction mail() de PHP).
 * À déposer à la racine du site, à côté de index.html.
 */

$destinataire = 'contact@future-events.fr';
$expediteur   = 'site@future-events.fr';   // adresse du domaine, sinon LWS peut bloquer l'envoi
$page_merci   = '/merci.html';
$page_erreur  = '/#devis';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /');
    exit;
}

// Piège à robots : ce champ est invisible pour les humains.
if (!empty($_POST['site_web'])) {
    header('Location: ' . $page_merci);
    exit;
}

function champ(string $nom, int $max = 200): string {
    $v = trim((string)($_POST[$nom] ?? ''));
    $v = str_replace(["\r", "\n"], ' ', $v);          // pas de saut de ligne dans les champs courts
    return mb_substr(strip_tags($v), 0, $max);
}

$nom       = champ('nom', 120);
$email     = filter_var(trim((string)($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: '';
$telephone = champ('telephone', 30);
$date      = champ('date', 20);
$lieu      = champ('lieu', 150);
$invites   = champ('invites', 10);
$message   = mb_substr(strip_tags(trim((string)($_POST['message'] ?? ''))), 0, 3000);

if ($nom === '' || $email === '') {
    header('Location: ' . $page_erreur);
    exit;
}

$date_lisible = $date;
if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $m)) {
    $date_lisible = "$m[3]/$m[2]/$m[1]";
}

$sujet = 'Demande de devis — ' . $nom . ($date_lisible ? ' — ' . $date_lisible : '');

$corps  = "Nouvelle demande de devis depuis future-events.fr\n\n";
$corps .= "Nom : $nom\n";
$corps .= "E-mail : $email\n";
$corps .= "Téléphone : " . ($telephone ?: '—') . "\n";
$corps .= "Date de l'événement : " . ($date_lisible ?: '—') . "\n";
$corps .= "Lieu de réception : " . ($lieu ?: '—') . "\n";
$corps .= "Nombre d'invités : " . ($invites ?: '—') . "\n\n";
$corps .= "Message :\n" . ($message ?: '—') . "\n";

$entetes  = 'From: Future Events (site) <' . $expediteur . ">\r\n";
$entetes .= 'Reply-To: ' . $nom . ' <' . $email . ">\r\n";
$entetes .= "MIME-Version: 1.0\r\n";
$entetes .= "Content-Type: text/plain; charset=UTF-8\r\n";
$entetes .= "Content-Transfer-Encoding: 8bit\r\n";

$sujet_encode = '=?UTF-8?B?' . base64_encode($sujet) . '?=';

$ok = mail($destinataire, $sujet_encode, $corps, $entetes, '-f' . $expediteur);

header('Location: ' . ($ok ? $page_merci : $page_erreur));
exit;
