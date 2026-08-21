# License system for your Netlify game

Everything runs on Netlify itself: your game's static files, plus a set of
Netlify Functions that handle license keys. Data is stored in **Netlify
Blobs** (Netlify's built-in storage) — no separate database or hosting
needed.

## What's in this folder

```
netlify.toml              <- merge into your existing netlify.toml
package.json              <- merge dependencies into your existing package.json
netlify/functions/        <- copy this whole folder into your project root
```

## 1. Add this to your existing Netlify project

- Copy the `netlify/functions` folder into your project root (next to your
  game's HTML files).
- Open your existing `netlify.toml` (or create one if you don't have it)
  and add:
  - `functions = "netlify/functions"` under `[build]`
  - all the `[[redirects]]` blocks from the `netlify.toml` in this folder
  - keep your existing `publish` folder as-is — don't change where your
    game itself is served from
- Add `@netlify/blobs` and `jsonwebtoken` to your project's
  `package.json` dependencies (see the `package.json` here for versions),
  then run `npm install`.

## 2. Set your JWT secret

In the Netlify dashboard: **Site configuration → Environment variables**,
add:

```
JWT_SECRET = <a long random string>
```

This signs the admin login session — pick something you wouldn't mind
being a password (e.g. 40+ random characters).

## 3. Deploy

Push to your git repo (or run `netlify deploy --prod` if you deploy
manually). Netlify will build your site and deploy the functions
together — one deploy, one domain.

## 4. Test it

Once live, from any terminal:

```bash
curl https://your-game.netlify.app/api/health
# {"ok":true}

curl -X POST https://your-game.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Tora","password":"admin123"}'
# {"token":"...", "username":"Tora"}
```

Change the default password immediately from the admin panel after your
first login (`Your account` section).

## 5. Point the admin panel and game at your Netlify domain

- In `LicenseAdmin.jsx`, set `API_BASE = "https://your-game.netlify.app"`.
- In your game's HTML (see `game-license-check.html` from before), set
  `API_BASE = "https://your-game.netlify.app"` — or leave it as an empty
  string `""` if the license-check script lives on the same Netlify site
  as the game, since then `/api/verify` is already same-origin.

## Setting how many days a key lasts

When generating keys from the admin panel:

- **Plan: weekly / monthly / lifetime** — fixed lengths (7 days, 30 days,
  no expiry).
- **Plan: custom** — set any exact number of days in the "Days" field,
  e.g. 3, 14, 90, 365. This is what you'd use for a trial key, a
  time-limited promo, or a custom package length for a specific customer.

The `/api/verify` response also now includes `daysLeft`, so if you want
to show "X days remaining" inside the game itself, you can read that
value straight from the verify response.

## A note on Netlify Blobs

Netlify Blobs works automatically once your site is deployed on Netlify —
no extra sign-up. For local testing before deploying, run:

```bash
netlify dev
```

which emulates Blobs locally. Running the function files directly with
plain `node` (outside `netlify dev` or a real deploy) will not have a
working Blobs connection — that's expected, test through `netlify dev` or
the deployed site.
