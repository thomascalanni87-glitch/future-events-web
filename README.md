# future-events.fr

Static site for Future Events (Thomas Nuti, Lille): HTML and CSS, a little vanilla JS (Effets carousel, gallery filters) and one Vercel function for quote requests. No build step and no external dependencies: the fonts are hosted on the site itself.

## Layout

| URL | File |
|---|---|
| `/` | `index.html` |
| `/prestations/…/` | one folder per service |
| `/galerie/` | `galerie/index.html` |
| `/mentions-legales/` | `mentions-legales/index.html` |
| `/merci/` | page shown after a quote request is sent |
| `/api/devis` | Vercel function that sends the form to contact@future-events.fr |

- `vercel.json`: clean URLs and 301 redirects from the old addresses.
- `package.json`: a single dependency (nodemailer) for sending email.

## Hosting: Vercel

1. Vercel > Add New > Project > import `future-events-web` (Framework: Other, no build command).
2. Settings > Environment Variables:
   - `SMTP_USER` = `contact@future-events.fr`
   - `SMTP_PASS` = the password of that mailbox (typed by Thomas, never in the code)
   - `SMTP_HOST` = `mail.future-events.fr` (optional)
3. Settings > Domains: add `future-events.fr` and `www.future-events.fr`.
4. LWS DNS zone: `@` A record → `76.76.21.21`, `www` CNAME → `cname.vercel-dns.com`. **Leave the MX records alone** (email stays at LWS).

Every push to `main` redeploys the site.

## Still to fill in before or after launch

Search for the brackets `[` in the HTML files:

- **Legal notice**: name and contact details of the consumer mediator (mandatory for a business that sells to consumers).
- **Saxophone**: duration of the sets; 3 videos of David.
- **Effets**: 2 Lightbands photos; the audio clip of the medley.
- **Mise en lumière**: the before/after photo; the photo of the dimmed lighting.
- "Emplacement vidéo" badges: replace them with the real videos once they are edited.

The original mockup (Claude Design) remains the reference for visual changes.
