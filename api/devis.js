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
    });
    return rediriger(res, PAGE_MERCI);
  } catch (e) {
    console.error('Envoi impossible :', e.message);
    return rediriger(res, PAGE_ERREUR);
  }
};
