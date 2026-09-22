import type { Express, Request, Response } from "express";
import { PRIVACY_EMAIL, PRIVACY_EN, PRIVACY_TR, type PolicyDocument } from "./src/data/privacyPolicy";
import { TERMS_EN, TERMS_TR } from "./src/data/termsOfUse";

/* THE PUBLIC PAGES OF THE SERVER - Lexistencehub is a phone app, not a website.

   The server keeps only what the stores and the sign-in e-mails need:
   /                 a landing page (and where e-mail links land: "confirmed, go back to the app")
   /privacy          Privacy Policy   (required by the App Store and Google Play)
   /terms            Terms of Use     (required by the App Store and Google Play)
   /account/delete   how to delete the account, with a request form (required by Google Play)

   The texts are the same data files the app shows in Settings. */

const APP_STORE_URL = process.env.APP_STORE_URL || "";
const PLAY_STORE_URL = process.env.PLAY_STORE_URL || "";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #050505; color: #fff; font: 16px/1.6 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  a { color: #F5B82E; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid #262626; margin-bottom: 28px; }
  .brand { font-weight: 600; font-size: 20px; letter-spacing: .01em; color: #fff; text-decoration: none; }
  .brand b { color: #F5B82E; font-weight: 600; }
  nav a { margin-left: 14px; font-size: 13px; color: #A5A5A5; text-decoration: none; }
  h1 { font-size: 26px; line-height: 1.2; margin: 0 0 6px; }
  h2 { font-size: 21px; margin: 40px 0 8px; }
  h3 { font-size: 16px; margin: 22px 0 6px; }
  p, li { color: #C9C9C9; font-size: 15px; }
  ul { padding-left: 20px; }
  li::marker { color: #F5B82E; }
  .muted { color: #A5A5A5; font-size: 13px; }
  .card { background: #0B0B0B; border: 1px solid #262626; border-radius: 20px; padding: 22px; margin: 18px 0; }
  .btn { display: inline-block; background: #F5B82E; color: #0B0B0B; font-weight: 600; text-decoration: none; padding: 12px 20px; border-radius: 14px; margin: 6px 8px 6px 0; }
  .btn.ghost { background: transparent; color: #fff; border: 1px solid #262626; }
  .divider { border: 0; border-top: 1px solid #262626; margin: 40px 0; }
  input, select, textarea { width: 100%; background: #101010; color: #fff; border: 1px solid #262626; border-radius: 12px; padding: 11px 14px; font: inherit; }
  label { display: block; font-size: 13px; color: #A5A5A5; margin: 14px 0 6px; }
  button { background: #F5B82E; color: #0B0B0B; border: 0; border-radius: 14px; padding: 12px 20px; font: inherit; font-weight: 600; cursor: pointer; margin-top: 16px; }
  footer { margin-top: 48px; text-align: center; color: #6F6F6F; font-size: 12px; }
`;

function page(title: string, body: string, lang = "tr"): string {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#050505">
<title>${esc(title)} · Lexistencehub</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<header>
  <a class="brand" href="/">Lexistence<b>hub</b></a>
  <nav><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/account/delete">Delete account</a></nav>
</header>
${body}
<footer>Lexistencehub · Beyond English · <a href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a></footer>
</div>
</body>
</html>`;
}

function policyHtml(doc: PolicyDocument): string {
  const linkMail = (s: string) => esc(s).split(PRIVACY_EMAIL).join(`<a href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a>`);
  const parts = doc.sections
    .map(
      s =>
        `<h3>${esc(s.title)}</h3>` +
        s.parts.map(p => (Array.isArray(p) ? `<ul>${p.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p>${linkMail(p)}</p>`)).join("")
    )
    .join("");
  return `<h2>${esc(doc.heading)}</h2>${doc.intro.map(p => `<p>${esc(p)}</p>`).join("")}${parts}`;
}

const storeButtons = () =>
  (APP_STORE_URL ? `<a class="btn" href="${esc(APP_STORE_URL)}">App Store</a>` : `<span class="btn ghost">App Store · coming soon</span>`) +
  (PLAY_STORE_URL ? `<a class="btn" href="${esc(PLAY_STORE_URL)}">Google Play</a>` : `<span class="btn ghost">Google Play · coming soon</span>`);

export function registerPublicPages(app: Express) {
  app.get("/", (_req: Request, res: Response) => {
    // E-mail links (confirmation, e-mail change) land here with tokens or a code in the address.
    res.type("html").send(
      page(
        "Beyond English",
        `<div id="notice"></div>
<h1>Lexistence<span style="color:#F5B82E">hub</span></h1>
<p class="muted" style="letter-spacing:.3em;text-transform:uppercase">Beyond English</p>
<p>Words, grammar, games and an AI coach - an English learning app for Turkish students, built around your level and your goals.</p>
<div class="card">
  <p style="margin-top:0"><strong style="color:#fff">Get the app</strong></p>
  ${storeButtons()}
</div>
<script>
(function(){
  var q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, ''));
  var err = q.get('error_description') || h.get('error_description') || q.get('error') || h.get('error');
  var ok = q.get('code') || h.get('access_token') || h.get('type');
  var n = document.getElementById('notice');
  if (err) n.innerHTML = '<div class="card" style="border-color:rgba(245,184,46,.5)"><strong style="color:#fff">Bu bağlantı kullanılamadı</strong><p>' + String(err).replace(/\\+/g,' ').replace(/</g,'&lt;') + '</p><p>Uygulamadan yeni bir bağlantı isteyin.</p></div>';
  else if (ok) n.innerHTML = '<div class="card" style="border-color:rgba(245,184,46,.5)"><strong style="color:#fff">İşlem tamamlandı ✓</strong><p>E-posta adresiniz doğrulandı. Lexistencehub uygulamasına dönüp giriş yapabilirsiniz.</p><p class="muted">Confirmed - you can go back to the Lexistencehub app and sign in.</p></div>';
  if (ok || err) history.replaceState(null, '', '/');
})();
</script>`
      )
    );
  });

  app.get("/privacy", (_req: Request, res: Response) => {
    res.type("html").send(page("Privacy Policy", `<h1>Gizlilik Politikası / Privacy Policy</h1>${policyHtml(PRIVACY_TR)}<hr class="divider">${policyHtml(PRIVACY_EN)}`));
  });

  app.get("/terms", (_req: Request, res: Response) => {
    res.type("html").send(page("Terms of Use", `<h1>Kullanım Koşulları / Terms of Use</h1>${policyHtml(TERMS_TR)}<hr class="divider">${policyHtml(TERMS_EN)}`));
  });

  app.get("/account/delete", (_req: Request, res: Response) => {
    res.type("html").send(
      page(
        "Delete account",
        `<h1>Hesap silme / Account deletion</h1>
<div class="card">
  <p style="margin-top:0"><strong style="color:#fff">Uygulama içinden (anında)</strong></p>
  <p>Lexistencehub → <strong>Profile</strong> → sağ üstteki <strong>⚙ Settings</strong> → en alttaki kırmızı <strong>Delete Account</strong>.
  Üç kısa soru sonrasında hesabınız ve tüm verileriniz (profil, ilerleme, istatistikler, cevap kayıtları, üyelik bilgisi) kalıcı olarak silinir.</p>
  <p class="muted">In the app: Profile → Settings → Delete Account. The account and all of its data are deleted permanently.</p>
</div>
<div class="card">
  <p style="margin-top:0"><strong style="color:#fff">Uygulamaya erişemiyorsanız / If you cannot open the app</strong></p>
  <p>Aşağıdaki formla ya da <a href="mailto:${PRIVACY_EMAIL}?subject=Account%20deletion">${PRIVACY_EMAIL}</a> adresine e-posta ile silme talebi gönderin. Talebi, hesabın kayıtlı e-posta adresinden gönderdiğinizi doğruladıktan sonra hesabınızı ve verilerinizi 30 gün içinde sileriz.</p>
  <form id="f">
    <label for="email">Hesabın e-posta adresi / Account e-mail</label>
    <input id="email" name="email" type="email" required placeholder="name@example.com">
    <label for="msg">Not (isteğe bağlı) / Note (optional)</label>
    <textarea id="msg" name="message" rows="3" placeholder="Please delete my Lexistencehub account."></textarea>
    <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
    <button type="submit">Silme talebi gönder / Request deletion</button>
    <p id="out" class="muted"></p>
  </form>
</div>
<p class="muted">Silinen veriler: hesap bilgileri, öğrenme ilerlemesi ve istatistikler, cevap kayıtları, üyelik durumu, bildirim tercihleri. Yasal olarak saklanması gereken kayıtlar (ör. ödeme kayıtları) mağaza tarafından kendi politikalarına göre tutulur.</p>
<script>
document.getElementById('f').addEventListener('submit', async function(e){
  e.preventDefault();
  var out = document.getElementById('out'); out.textContent = 'Gönderiliyor…';
  var email = document.getElementById('email').value.trim();
  var note = document.getElementById('msg').value.trim();
  try {
    var r = await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: 'web-delete-request', topic: 'Account deletion', email: email,
        message: 'ACCOUNT DELETION REQUEST for ' + email + (note ? ' - ' + note : '') + ' (sent from the web form)', website: this.website.value }) });
    var b = await r.json().catch(function(){ return {}; });
    out.textContent = r.ok ? 'Talebiniz alındı (' + b.ref + '). Hesabınızın e-posta adresinden geldiğini doğruladıktan sonra silme işlemini yapıp size bilgi vereceğiz.' : (b.message || 'Gönderilemedi. Lütfen e-posta ile yazın.');
  } catch (err) { out.textContent = 'Gönderilemedi. Lütfen e-posta ile yazın.'; }
});
</script>`
      )
    );
  });
}
