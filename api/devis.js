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

const LOGO_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAARZElEQVR42u1de3RW1ZX/7X3OvV+ekCiIilaLtlJECyQ8BKlmrBIIz46lVTvjVGyd1TpWl6N2WSti2+VqV+3Y6tJxLZeusaNinBYEDFisYeRhDF9AEaQjKKhVeQfy/u495+z540tC5Jkbvkd47H/ICjn33Lt/Z7/33ZfQy4ja/51avaVonW380qdtbRfmeP5FodhBrVbOYMIAESlSQA5BNAAIYBy4zYHqwdiWS9jdV6tPfNCGwhhv+nKu92lV6eBdkvzbXvm8Wb+JoYvWFX+C8BKnMT7hZKQDhljgTEdUCFYAU5J74tq5KAdfhQAQJ38UAVkLEmliop1K6N0Cjbp89pafZeid2vKhe9zJDAABGLhk/WmNCL/RKjLVirvSAedLLEYQANYCziUZfkwbcRI8pQBiUCIBj+QjRby8r+L55/bxl8VHD9ktJwsABEBVrRlJLDdYwVRh/rJoDzAGcBaQNLOCCGAGlAY7C3Z2ay6pRbk+Pber7Os17kQFoLKyUs0quHBCM+FfBXKN+LEYjEme9GxqZqUA7YGDROgRLy1S+om5eteSsrIyc0IAQAAKXlkzsZXdnRZ8lXgeEAbpP+k9kQzPB5sQPuj1vgq/2/bNYVVEJMctAH0Xx0c0gn4uwDTxPEIY9j7GHwoI7YFMKD7zwgKWX+65esRqOZ4AGLQ03vcTw3cZwm2ivcJeeeK7LxFNHuTRM2P8m4/Khu/t9QAULI6PbxV6xMZiIxAGSU/meCZmwPOhTbimCO6O3RNK3pDeCMAVs6v1ypGF/24V3yda5yMMcEKR54Otac4BfnlXbN9v56TISKcEgPw/rTyjLS/3D9bT30m6kw4nJDGDtIYXmheLufW27RPG7cg6AKdV1QypJ+9Z8WMlSCR6YbCfBorlQIVBfKDDjR9PGvFe1gDQ89/6hs3xnxWtz0OQwElFfgzKmo9ynf2npomlyzMOgKqKX2OJn4dWpyMMcVKS54Gs25UHc31z+cilGQNALYhfY32eC1bFMCcp8zvVgAcSt8c35ruJiuggRAZAL6wZb7Q/D0qdftIzvysIzu2KOTujbVLpirQBkL+wdmizVouh9Tknrdo5ojoyf88TU948cfSGbjtW3Wb+y28OaFX8R3j+KeYfisIQov1zWkQ/W1C1pn9KASiJx71WrZ5wsZxhJ523E4WCBCQWG9Ei7vGSJ+NeygB4Z5u928VyZyDRdorJR6NEAi7mX/vuQNyZEhtQVFV7xT7WiwXIPWEj3HREzEBLvnMTmo5ilI8oAcVL4333Cf1elD7F/CjkHETpvGbg0eLKeN8eA9AUyt2Sk/P1Ey6xlhGjHEBiOcMa8t1dPVJBeVW1w1tJvyGEglOn/xhUkUhTLtHlLeUj3um2BMwW4TahOeL5p5h/rKrI8wsC5x6YPXs2d1sCCl+JT25S6mURx8ddJau3ERGI2RaJm1xfXrLkqBIwpHK93wTcI1qdYn4qSASilGqw8tOS+MGxwUEAfNY3MQGKxyE4Fe2mMkq2Wo3fuIOvPiIAs0W4ycitoj06KQorGZQCKM2tcLfOni18WBvQZ+HqUQ2algPkn1I/abAFQKIPY9y+CSV1Hb/W+0ES8l6p+wHyC320tSaxofaG11RiIS5ZM+5t3hVRso9UcfLnVJ8/AsTPibU0NNxMQJ0cCMAtdXX6rJj+oB/Lon0eDwidBJ8ngp3GiU1N7V7aO5zlfACDoVQ+RHrSL+QgQiBKXUsNc3uLpPsMhtaD0ABJZcuOACDVnxD7Up/Y3snVoueUkTlIBTEAK0IAfADCREHKFdGCeD9odzEcfw9MN4LI63YHtIiA4CDglAGgNGDCLRD8GkqvQKO3CTOHpiX0FxHK1UrarDt6JJx2qqz0kT/oHjDfD4jOis1RCrD2fU/R9WEXvZxRzZdVvRuP52G7ex5ebFrGy5tEgJME4G5ExagXs5atOEBGMgtIaWkLwE8hDJvBnNkn1xqALEdYWJXVdFHW5WEAXoVIJSiDmxMDJqwH8BtM/1pj7wBAhADKvCIuLQ3h6AEYswFKZ0brEgAnj6KiZ708x27/RKE9IOMuOjF7kdfU0o8BfhbikHZJUAow7gPAPZe15/02HOYkIw1Gb6E8eRrGrEirLSBKxh2EuagY/X4Wgz7p0DYMEcJhctUZpbLSXRC+F9bUpw0EVoCx70LFnuwt5673SAAAfIYaCBalBQBmwJpGEO5F+SWf9JZH1u26v3dk3m4pDbF49dMwZjJYFcPZFANgX8OOptd6Reqpnek6b0nd97+Sm9PPU5S7tTXY2xgGbYBKxRaaSNa2TSx5M9Kyxi3LkXf+c1Dq1pQy35hmReop+/2yaM1NC+J5OUquFSAPxCnJIGqWvEv65OeJdWuJq+LrOCf3EnEOzjlI0kgdJp8UMcfS2rISrGdg0oidke5w0fozQa0L4PkjUxIhex4QBM+Bds7CpEnRWvuq4jMAzIXn+93KWR2NT4LON224pWWNJufyTBAgpeIOJLOLnj8Oxt4FkXsiubmTh25DVfwZWDMCROqY8kRKA0GwAYYfwLSIzJ+/ohDiboYX81PammMBcRYQV8BEyEFqc68dgV073O5GLF5bGv3U4nlY+zrUMahDIkCcZab/wrSSzdF1Rc6PofQE2DS8NC8CAuUy2msCabHC1gLaOwPO3BQ5z3R16T6Q3Isw3AbuIQiczHbGxLwQee3C2qEg/AjEKl2ZWiJRnPYIWARgno5F8ZGR104aVQfgzz2KjokAZwXA462Txvw94k0TmP4ZWp2bltP/hThAxKZ1B2cBrc8EyUOoXlsU9Yho8DMw4Y7IqogZcPZ/oPc8E/meF60ZDOC76XZFRcQyBG1pT4NaC2h1BVrsDVGXmkkj6gB6ugduZz0s/wETJjRHdTtB9kEofW6yTJnGSIC4hR1TPQjwklX7NKohrUDyL5hfd3bkvInFwzB2GbTXTQAUALyCwpKa6F6TXAvw9EzMLXJAPYvQDhAj7T0KJgSUVwpt70OlRNMnU0t3gfAUnEmAjpKmUAoIgz1gfhzthe/uq551xSCaBc/TxzypqxsACNF2LtS8HQCsSPrzEeIA5utU/ltXRAcQ8+BkyRFtQbLMGAL0W0SNwAGAg0kAxqXb8HZQH8Xb2Ti3ucMJTXtNyjlA6yILddOQyvV+RCloAamfIQy3HBYEVoCzb0P8/4x8b1XxCwDcA06f23mgWg6d28wesInajU1GMnLOAUQV7+W2jo28duLwDQBe7DztB55+ax2In8LkS+sjXbe6WsO5O+F5l2SqYYysFY/UJvat3QQnTUfVrakEQKkiMH4V5XXOLmH8EzB2/UHBmfYAcW8BNC/yNRvzh4Pw7fR6PQd4aeKamMLNfHa+v5Ug29pfLMscCKzGtoi7OfKeU0s/hnM/g+nSScEMhOFuQP0icuKvslJBYRa03y9j7ZLEYNBnX+lb9DGvS47h2giVwdpMMjqGg3xPFr95fuT1rWYpgL92AkAMQF7ApOFLIqec8i4YBsG30u717Pf+AaUgkPdWj/lqAwsADaoBJbv9MiYH1gBaD4HzHkBUgzxzbCtInoIxzdAaMOF2wD0dOa3yTHVOSPITaK9/pk6/tNsrH6gRtJckfXIrkWgTB8BlsjiWrD1cqwoT5dEXF/0FggXwPEDkJTRtXRf5Ev0LbgDz9Zk6/Z3OQqLNaa1XogOA03O9d1jkI7DKbG+Wc4D28q1zs/Dq2/nREnVfTUDoF2htWQyFxzBzZiQLWlC1pj8It2bM7eziKrNgy5k28W4nAB+XDd+rid5ItutlmKwFiL6J0FwZee3kko0IEjejfGTkFpMmcTOh1MUpL0QdjbSGz1j2waQxDZ0ACIBchflkTOTKY0qiY6XyQDIHC9cOjLx++uWfRdb9i+rOA3ATiL1Md2WTCZHD9HLHrp2uz0AJ/pds+BGUBqczMXf4CLkEyvw47Xs9GfcAex98b0SmUg5dTz8Z++F5PnfOmOsEYGP52D0eMB9aZyYvdKAxTori9VgQH5zWvc4x48Eqc0FXV1IaHmHeui4TeLmre5Sj+I8IEomMdip3tQVanweFB7FqVW5a9qiu1hA9C1r1zfg7asSgRFtbjlP/3fVwfyH6un3VgrXayV/h+dl5cyPplk7DbvWttFy/paAMLBOz8oKg50EL/rK3YtgXZkZ8AYA5c+a4Qs2PkTFOsiEFSVvgg9UszItYvjwaLa69CKBfQ3nFmT/9BLLGFip+7MBx+AflH+q3utdgzHJ43v7QOdOqCHIFtJ2WWuniHyIWG55xwwsAng+EZtme2L7qg8KCg/74ltKwUHkPkbEWRJn3iEQApRgKP8WSFBnkeW+eD+CarDCfCGSM6cP8EA4x8PuQGbg7auYtJWtehu9n3iPqUEWeNxhW/g2VlcfeqKrVdSAamhXd78fA1vx578QRrx8Sn8Oty6+qu7SFsEKICrNy48yAddsRuomYPmptz3V/fDxAfwJR/4w/BzPIYV9eGI5rnnboWaKHzUE3TypZFxN5uMMWZMcgqwHQ9CDmbyzs0TUWxPNg5W5o3T9bno8S9/DhmH9EAAAgP2j7HbW11cH3swcCUwW8pht6eIGrwFSWlaDL90FtidrivMb/OKKQHOk/d0+/vLFAyW2Ujfd4Owyy1gSRWXh15RmR1q5alQtFN0N7+ZlXPQpkTGOx4LadZWVNPQYAABrLR61SVh6A0shahMw8AqE/I9K6ev+HUFyecc+HCFAM5cz9eyaXvnVUrLpzzXGrGx9RQTAXfiw7UsCKQXSHX7VmSLfWLKwdCsjtYJX5uUd+DCoRPDejaeuj3cKru9ctXPrW6c2BWuxisZFZmR+tNRCGNXDyA0wZtf6wf7ek9lw4ehLamwhjMs58TrTVFDSHFQ0zx+5JKQAAULi49qJG4Vfh+edlZZir9oAw/Bsgv4foGuTv/ZtceWVw8Usb9Ht5iQuY3EgB/Ui0Gp1xw+v7QBh+WGiC8sYpl23qtsaKzINF8dFG0QIofUZWPuDAjPZBT9tIsJkgbSD4EBokhHMkOYIm4+4mjNmmQzvVTB21OpLJ6Ml+auHqK62nXoJS/bLyLYGO8WLcPl4Msn8MWqZ1vueBjN2hTHCtmTIm8sd8ev4RnyQIc6H0gJN2trTnA9Z8rsPgOz1hfre9oEN6h1NGLtOJYDoZ82GHd0QnE/P9GMiYzTow03rK/GMCAADMtDE1pzueSGFQg1gOslJDyIb6i+WAwmBlP5KJUXV+SgEAgF0Vw94vpESFTrQ9C+3hmF4r7e2kFKA0dBA83ce2TNlZ3oNXX1NlAw6Ol4S8Rat/Yj3vAdGqL4LgBFQ5wV5l3P3h5JGPpWqyaMp1Rp+Fq0c1K3rE+rHLOr8TfwKcehUGK/Odub2hYnQ8pV51qu+3YcrI2ouVvtoPg58TXD1iOZ05pOPKQnToeuf2+GHi3ot37pqQauannSfewtqhTvF9jvgfxfP0cfFl7fYvaVMQGCZUKqFfBcf4xdSsAdCxQZ+quqtaCHca4BrxfAUTAs6BQRBI7xhWxJz8JGEYWE20JM+4hxsml1ZLBviTERIRKqqqK2tSdItzqJBYLB/WJNMG2ZIKok4djyDRpECLCkBPNk4cvixTFYSMq2UCkFdVd2lAuM4C0x0wGL6fBKIdjAMHtlO7pKSa6RQkQKCNSmSer9QLLROGrZcs8CNrdNGKjYWfNDaPDUFTreAfRORCicWSPfLO7s/t9FRCqH0EP3PH2/OgRMIQYZMCvZ7L9PJZbS01/zf98qwNb+0VjgkB+Fr1+oJtiXBIk7WXARjjCEOt4GxAikVp6iyJSpcRd3LgU9D+qp1zIGsEoHpF+JSB9XCoKWR+c6Di996dMKxZesmz9z5HBMANr76d/zpj4F5rB7GTQWC+sNm6sxRhAJw7jYA8UPvIAyErRM0A1VuibfmaP4eTzc7IlmI/54PhpxV9+krpwJbe6H/9P8E5dMy9BI+sAAAAAElFTkSuQmCC', 'base64');

// Mise en page pensée pour Outlook (moteur Word) : tableaux, bgcolor, pas de border-radius ni d'inline-block indispensables.
function mailHtml(d) {
  const F = "font-family:Helvetica,Arial,sans-serif;";
  const ligne = (label, val) => `<tr>
<td width="150" valign="top" style="${F}padding:10px 0;border-bottom:1px solid #E1E5E7;color:#46555C;font-size:14px">${label}</td>
<td valign="top" style="${F}padding:10px 0;border-bottom:1px solid #E1E5E7;color:#1B2A30;font-size:16px;font-weight:bold">${val ? esc(val) : '<span style="color:#9AA6AB;font-weight:normal">non précisé</span>'}</td></tr>`;
  const formule = (d.message.match(/formule (Essentiel|Expérience|Performance|Grand Soir|Afterwork & Entreprise)/) || [])[1];
  const tel = d.telephone.replace(/[^0-9+]/g, '');
  const pastille = (txt, bg, fg) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px"><tr>
<td bgcolor="${bg}" style="${F}background:${bg};color:${fg};border-radius:999px;padding:7px 14px;font-size:14px;font-weight:bold">${txt}</td></tr></table>`;
  const bouton = (href, txt, bg, fg) => `<td bgcolor="${bg}" style="background:${bg};border-radius:999px;padding:0">
<a href="${href}" style="${F}display:block;padding:13px 22px;color:${fg};text-decoration:none;font-weight:bold;font-size:15px;border:1px solid ${bg};border-radius:999px">${txt}</a></td>`;
  const sujet = encodeURIComponent('Votre demande de devis Future Events');
  return `<!doctype html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<style>:root{color-scheme:light only}</style></head>
<body style="margin:0;padding:0;background:#F1F3F4" bgcolor="#F1F3F4">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F3F4"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:600px;max-width:100%;background:#ffffff">
<tr><td bgcolor="#00B6CC" style="background:#00B6CC;padding:26px 28px 24px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="56" valign="middle" bgcolor="#ffffff" style="background:#ffffff;border-radius:999px;padding:4px"><img src="cid:logo@future-events" width="48" height="48" alt="" style="display:block;border:0"></td>
<td valign="middle" style="${F}padding-left:12px;font-size:20px;color:#06262B"><b>F</b>uture <b>E</b>vents</td></tr></table>
<div style="${F}font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#06262B;margin-top:18px">Nouvelle demande de devis</div>
<div style="${F}font-size:28px;font-weight:bold;color:#06262B;line-height:1.2;margin-top:4px">${esc(d.nom)}</div>
${d.date || d.lieu ? pastille('📅 ' + esc([d.date, d.lieu].filter(Boolean).join(' · ')), '#06262B', '#ffffff') : ''}
${formule ? pastille('⭐ Formule ' + esc(formule), '#FFC400', '#2B2100') : ''}
</td></tr>
<tr><td style="padding:22px 28px 6px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${ligne('E-mail', d.email)}${ligne('Téléphone', d.telephone)}${ligne("Date de l'événement", d.date)}${ligne('Lieu de réception', d.lieu)}${ligne("Nombre d'invités", d.invites)}
</table></td></tr>
<tr><td style="padding:18px 28px 6px">
<div style="${F}font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#46555C;margin-bottom:8px">Leur projet</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="6" bgcolor="#D10072" style="background:#D10072;width:6px"></td>
<td bgcolor="#F1F3F4" style="${F}background:#F1F3F4;padding:16px 18px;font-size:16px;line-height:1.55;color:#1B2A30">${esc(d.message).replace(/\n/g, '<br>')}</td>
</tr></table></td></tr>
<tr><td style="padding:22px 28px 26px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
${bouton(`mailto:${encodeURIComponent(d.email)}?subject=${sujet}`, 'Répondre par e-mail', '#1B2A30', '#ffffff')}
${tel ? '<td width="12" style="width:12px"></td>' + bouton(`tel:${tel}`, 'Appeler', '#00B6CC', '#06262B') : ''}
</tr></table>
<div style="${F}font-size:13px;color:#7A878C;margin-top:14px">Objectif : répondre en moins de 24 h. Le bouton « Répondre » de votre messagerie écrit aussi directement au client.</div>
</td></tr>
</table>
<div style="${F}font-size:12px;color:#7A878C;padding:16px">Envoyé par le formulaire de future-events.fr</div>
</td></tr></table></body></html>`;
}

function estSpam(f) {
  if (f.site_web) return true;                                   // champ piège rempli
  const t = Number(f.fe_t || 0);                                 // horodatage posé par le navigateur
  const age = Date.now() - t;
  if (!t || age < 4000 || age > 2 * 24 * 3600 * 1000) return true; // pas de JavaScript, ou envoyé en moins de 4 s
  const tout = [f.nom, f.message, f.lieu, f.telephone].join(' ');
  const liens = (tout.match(/https?:\/\/|www\.|\.(ru|cn|xyz|top|click)\b/gi) || []).length;
  if (liens >= 1 && /https?:\/\/|www\./i.test(String(f.nom || '') + String(f.lieu || ''))) return true;
  if (liens >= 2) return true;                                   // plusieurs liens = publicité
  if (/[\u0400-\u04FF\u4E00-\u9FFF\u0E00-\u0E7F]/.test(tout)) return true; // cyrillique, chinois, thaï
  if (/\b(seo|backlinks?|crypto|bitcoin|casino|viagra|loan|rank(ing)? your|guest post|web ?design services?)\b/i.test(tout)) return true;
  const msg = String(f.message || '');
  if (msg.length > 40 && !/[àâçéèêëîïôûùüœ]/i.test(msg) && /\b(the|your|you|we|our|business|website)\b/i.test(msg) && !/\b(le|la|les|nous|vous|mariage|soirée)\b/i.test(msg)) return true; // message entièrement en anglais commercial
  return false;
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

  // Anti-spam, invisible pour les vrais visiteurs : on fait comme si tout allait bien
  if (estSpam(f)) { console.log('Spam bloqué :', court(f.email, 80)); return rediriger(res, PAGE_MERCI); }

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
      attachments: [{ filename: 'logo.png', content: LOGO_PNG, cid: 'logo@future-events' }],
    });
    return rediriger(res, PAGE_MERCI);
  } catch (e) {
    console.error('Envoi impossible :', e.message);
    return rediriger(res, PAGE_ERREUR);
  }
};
