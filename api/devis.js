// Future Events — envoi des demandes de devis vers contact@future-events.fr
// Fonction Vercel (Node). L'e-mail part de la boîte contact@ via le SMTP de LWS.
// Variables à créer dans Vercel > Settings > Environment Variables :
//   SMTP_USER = contact@future-events.fr
//   SMTP_PASS = mot de passe de cette boîte (saisi par Thomas, jamais dans le code)
//   SMTP_HOST = mail.future-events.fr (facultatif, valeur par défaut)
const nodemailer = require('nodemailer');

const DESTINATAIRE = 'contact@future-events.fr';
const PAGE_MERCI = '/merci/';
const PAGE_ERREUR = '/?envoi=erreur#devis';

function lire(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 20000) req.destroy(); });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(data))));
    req.on('error', reject);
  });
}

function court(v, max) {
  return String(v ?? '').replace(/[\r\n]+/g, ' ').replace(/<[^>]*>/g, '').trim().slice(0, max);
}

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mailHtml(d) {
  const ligne = (label, val) => `<tr><td style="padding:10px 0;border-bottom:1px solid #E1E5E7;color:#46555C;font-size:14px;width:150px;vertical-align:top">${label}</td><td style="padding:10px 0;border-bottom:1px solid #E1E5E7;color:#1B2A30;font-size:16px;font-weight:bold">${val ? esc(val) : '<span style="color:#9AA6AB;font-weight:normal">non précisé</span>'}</td></tr>`;
  const formule = (d.message.match(/formule (Essentiel|Expérience|Performance|Grand Soir|Afterwork & Entreprise)/) || [])[1];
  const sujetRep = encodeURIComponent('Votre demande de devis Future Events');
  const tel = d.telephone.replace(/[^0-9+]/g, '');
  const bouton = (href, txt, bg, fg) => `<a href="${href}" style="display:inline-block;background:${bg};color:${fg};text-decoration:none;font-weight:bold;font-size:15px;padding:13px 22px;border-radius:999px;margin:0 8px 8px 0">${txt}</a>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F1F3F4;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F3F4"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#00B6CC;padding:28px 28px 24px">
<img src="https://future-events.fr/assets/img/logo-future-events.png" width="44" height="44" alt="" style="display:block;border-radius:50%;margin-bottom:14px">
<div style="font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#06262B;opacity:.75">Nouvelle demande de devis</div>
<div style="font-size:28px;font-weight:bold;color:#06262B;line-height:1.2;margin-top:4px">${esc(d.nom)}</div>
${d.date ? `<div style="display:inline-block;margin-top:12px;background:#06262B;color:#ffffff;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:bold">📅 ${esc(d.date)}${d.lieu ? ' · ' + esc(d.lieu) : ''}</div>` : ''}
${formule ? `<div style="display:inline-block;margin-top:12px;margin-left:6px;background:#FFC400;color:#2B2100;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:bold">⭐ Formule ${esc(formule)}</div>` : ''}
</td></tr>
<tr><td style="padding:24px 28px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${ligne('E-mail', d.email)}${ligne('Téléphone', d.telephone)}${ligne("Date de l'événement", d.date)}${ligne('Lieu de réception', d.lieu)}${ligne("Nombre d'invités", d.invites)}
</table></td></tr>
<tr><td style="padding:16px 28px 8px">
<div style="font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#46555C;margin-bottom:8px">Leur projet</div>
<div style="background:#F1F3F4;border-left:6px solid #D10072;border-radius:12px;padding:16px 18px;font-size:16px;line-height:1.55;color:#1B2A30;white-space:pre-wrap">${esc(d.message)}</div>
</td></tr>
<tr><td style="padding:20px 28px 28px">
${bouton(`mailto:${encodeURIComponent(d.email)}?subject=${sujetRep}`, 'Répondre par e-mail', '#1B2A30', '#ffffff')}
${tel ? bouton(`tel:${tel}`, 'Appeler', '#00B6CC', '#06262B') : ''}
<div style="font-size:13px;color:#9AA6AB;margin-top:10px">Objectif : répondre en moins de 24 h. Le bouton « Répondre » de votre messagerie écrit aussi directement au client.</div>
</td></tr>
</table>
<div style="font-size:12px;color:#9AA6AB;padding:16px">Envoyé par le formulaire de future-events.fr</div>
</td></tr></table></body></html>`;
}

function rediriger(res, url) {
  res.statusCode = 303;
  res.setHeader('Location', url);
  res.end();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return rediriger(res, '/');
  let f;
  try { f = await lire(req); } catch { return rediriger(res, PAGE_ERREUR); }

  if (f.site_web) return rediriger(res, PAGE_MERCI); // piège à robots

  const nom = court(f.nom, 120);
  const email = court(f.email, 160);
  const message = String(f.message ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 3000);
  if (!nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return rediriger(res, PAGE_ERREUR);
  }
  const telephone = court(f.telephone, 30);
  let date = court(f.date, 20);
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) date = `${m[3]}/${m[2]}/${m[1]}`;
  const lieu = court(f.lieu, 150);
  const invites = court(f.invites, 10);

  const corps = [
    'Nouvelle demande de devis depuis future-events.fr', '',
    `Nom : ${nom}`,
    `E-mail : ${email}`,
    `Téléphone : ${telephone || '—'}`,
    `Date de l'événement : ${date || '—'}`,
    `Lieu de réception : ${lieu || '—'}`,
    `Nombre d'invités : ${invites || '—'}`, '',
    'Message :', message,
  ].join('\n');

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.future-events.fr',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transport.sendMail({
      from: `"Future Events (site)" <${process.env.SMTP_USER}>`,
      to: DESTINATAIRE,
      replyTo: { name: nom, address: email },
      subject: `Demande de devis — ${nom}${date ? ' — ' + date : ''}`,
      text: corps,
      html: mailHtml({ nom, email, telephone, date, lieu, invites, message }),
    });
    return rediriger(res, PAGE_MERCI);
  } catch (e) {
    console.error('Envoi impossible :', e.message);
    return rediriger(res, PAGE_ERREUR);
  }
};
