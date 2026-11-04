# future-events.fr

Static site for Future Events (Thomas Nuti, Lille): HTML and CSS, a little vanilla JS (Effets carousel, gallery filters) and one PHP script for quote requests. No build step and no external dependencies: the fonts are hosted on the site itself.

## Layout

| URL | File |
|---|---|
| `/` | `index.html` |
| `/prestations/mise-en-lumiere-mariage/` | `prestations/mise-en-lumiere-mariage/index.html` |
| `/prestations/photobooth-retro-mariage/` | `prestations/photobooth-retro-mariage/index.html` |
| `/prestations/atelier-vinyles/` | `prestations/atelier-vinyles/index.html` |
| `/prestations/saxophoniste-mariage/` | `prestations/saxophoniste-mariage/index.html` |
| `/prestations/etincelles-fumee-lourde/` | `prestations/etincelles-fumee-lourde/index.html` |
| `/galerie/` | `galerie/index.html` |
| `/mentions-legales/` | `mentions-legales/index.html` |
| `/merci.html` | page shown after a quote request is sent |
| `/devis.php` | sends the form to contact@future-events.fr |

- `.htaccess`: forces HTTPS without www, plus 301 redirects from the old addresses (`/mariage/`, `/entreprise/`, `/mobilier/`, `/medias/`, `/contact/`).
- `robots.txt` and `sitemap.xml`: for Google.

## Putting it online on LWS

1. Open FileZilla (or the LWS file manager) and connect with your FTP credentials.
2. Go into the site folder (`htdocs` or `www`, depending on the account).
3. Move the old site into a `ancien-site` subfolder, just in case.
4. Upload **all** the files from this repository, **except** `.git` and `README.md`. Remember `.htaccess`: it is hidden by default, so turn on "show hidden files".
5. Test it: open https://future-events.fr, submit a test quote request, then check that the email reaches contact@future-events.fr. Also check your spam folder.

If the email does not arrive: in the LWS panel, check that the address `site@future-events.fr` exists (create it if needed). `devis.php` uses it as the sender address.

## Still to fill in before or after launch

Search for the brackets `[` in the HTML files:

- **Home**: Signature and Expérience prices; name of the first venue in the "Lieux" section.
- **Legal notice**: name and contact details of the consumer mediator (mandatory for a business that sells to consumers).
- **Saxophone**: duration of the sets; 3 videos of David.
- **Effets**: 2 Lightbands photos; the audio clip of the medley.
- **Mise en lumière**: the before/after photo; the photo of the dimmed lighting.
- "Emplacement vidéo" badges: replace them with the real videos once they are edited.

The original mockup (Claude Design) remains the reference for visual changes.
