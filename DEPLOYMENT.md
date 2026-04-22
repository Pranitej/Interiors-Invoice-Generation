# CraftQuote — VPS Deployment Guide

## Server Details

| Property | Value |
|----------|-------|
| VPS IP | 187.127.155.94 |
| OS | Ubuntu (Questing) |
| Domain | pmsoftwaresolutions.in |
| App URL | https://pmsoftwaresolutions.in/craftquote/ |
| Node.js | v20 |
| MongoDB | v7.0 |
| Process Manager | PM2 |
| Web Server | Nginx 1.28.0 |
| SSL | Let's Encrypt (Certbot) |

---

## 1. Initial Server Access

SSH into the VPS as root:

```bash
ssh root@187.127.155.94
```

---

## 2. Remove Broken Pre-installed Repo

The VPS came with a broken Monarx repo. Remove it:

```bash
rm /etc/apt/sources.list.d/monarx.list
apt update
```

---

## 3. System Update & Base Packages

```bash
apt update && apt upgrade -y && apt install -y curl git nginx certbot python3-certbot-nginx ufw
```

---

## 4. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

---

## 5. Install MongoDB 7.0

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update && apt install -y mongodb-org
systemctl enable mongod && systemctl start mongod
```

---

## 6. Install PM2, Chromium Dependencies & MongoDB Tools

```bash
npm install -g pm2
apt install -y libgbm-dev libnss3 libatk-bridge2.0-0t64 libgtk-3-0t64 libxss1 libasound2t64 mongodb-database-tools
```

> **Note:** On Ubuntu Questing, `libatk-bridge2.0-0` and `libgtk-3-0` are renamed to `libatk-bridge2.0-0t64` and `libgtk-3-0t64`. Use the `t64` suffix. `libasound2` is replaced by `libasound2t64`.

---

## 7. Install Chromium (for Puppeteer PDF generation)

Ubuntu Questing installs Chromium via Snap. The process is:

```bash
apt install -y chromium-browser fonts-liberation libgbm1
```

> **Note:** This installs Chromium via Snap (slow, takes several minutes). If the install hangs:
> - Open a second SSH session
> - Run `snap changes` to find the change ID
> - Run `snap abort <ID>` to cancel
> - Then run `dpkg --configure -a` to fix broken state
> - Then `dpkg --remove --force-remove-reinstreq chromium-browser`
> - Then re-run the install command

The actual Chromium binary location after Snap install:

```
/snap/chromium/3416/usr/lib/chromium-browser/chrome
```

> **Important:** The version number `3416` may change on updates. If PDF stops working after an update, run:
> ```bash
> find /snap -name "chrome" | grep chromium
> ```
> And update the path in `ecosystem.config.cjs`.

---

## 8. Install Fonts for Rupee Symbol (₹)

Without this, the ₹ symbol renders as a box in PDFs:

```bash
apt install -y fonts-noto fonts-noto-core
fc-cache -fv
```

---

## 9. Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

---

## 10. Clone & Configure the App

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Pranitej/Interiors-Invoice-Generation.git craftquote
cd craftquote/server
cp .env.example .env
nano .env
```

Fill in the `.env` with production values:

```env
MONGO_URI=mongodb://localhost:27017/craftquote_db
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://pmsoftwaresolutions.in
TRUST_PROXY=true
JWT_SECRET=<your-secret>
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=<your-strong-password>
APP_NAME=CraftQuote
PUPPETEER_EXECUTABLE_PATH=/snap/chromium/3416/usr/lib/chromium-browser/chrome
BACKUP_ENABLED=true
BACKUP_DIR=/backups
```

Install server dependencies:

```bash
npm install
```

---

## 11. Build the React Client

```bash
cd /var/www/craftquote/client
cp .env.example .env
nano .env
```

Set:

```env
VITE_API_BASE=https://pmsoftwaresolutions.in/craftquote
```

Then build:

```bash
npm install && npm run build
```

---

## 12. Start Server with PM2

Create the PM2 ecosystem file:

```bash
cd /var/www/craftquote/server
nano ecosystem.config.cjs
```

> **Note:** Must use `.cjs` extension because `package.json` has `"type": "module"` which makes `.js` files ES modules — PM2 ecosystem files must be CommonJS.

Paste:

```js
module.exports = {
  apps: [{
    name: "craftquote",
    script: "server.js",
    cwd: "/var/www/craftquote/server",
    env: {
      PUPPETEER_EXECUTABLE_PATH: "/snap/chromium/3416/usr/lib/chromium-browser/chrome"
    }
  }]
}
```

Start and save:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

> **Note:** PM2 does NOT automatically read `.env` files. The `PUPPETEER_EXECUTABLE_PATH` must be set in `ecosystem.config.cjs` because setting it only in `.env` is not picked up by PM2. All other env vars are loaded by `dotenv` inside the app itself.

---

## 13. Configure Nginx

Create the site config:

```bash
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
nano /etc/nginx/sites-available/pmsoftwaresolutions.in
```

Paste:

```nginx
server {
    listen 80;
    server_name pmsoftwaresolutions.in www.pmsoftwaresolutions.in;

    # Redirect /craftquote (no trailing slash) to /craftquote/
    location = /craftquote {
        return 301 /craftquote/;
    }

    # CraftQuote — React frontend
    location /craftquote/ {
        alias /var/www/craftquote/client/dist/;
        index index.html;
        try_files $uri $uri/ /craftquote/index.html;
    }

    # CraftQuote — Express API proxy
    location /craftquote/api/ {
        rewrite ^/craftquote/api/(.*) /api/$1 break;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # CraftQuote — uploaded images (logos, QR codes)
    location /craftquote/public/ {
        alias /var/www/craftquote/server/public/;
    }

    # Portfolio site (placeholder)
    location / {
        root /var/www/portfolio;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```

Enable and test:

```bash
ln -s /etc/nginx/sites-available/pmsoftwaresolutions.in /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Create portfolio placeholder:

```bash
mkdir -p /var/www/portfolio
echo "<h1>PM Software Solutions</h1>" > /var/www/portfolio/index.html
```

Fix permissions if getting 403:

```bash
chmod -R 755 /var/www/craftquote/client/dist
```

---

## 14. Configure DNS (Hostinger)

In Hostinger hPanel → Domains → DNS Records:

1. **Edit** existing A record `@` → set to `187.127.155.94`
2. **Delete** the CNAME `www` record
3. **Add** new A record: Name `www`, Content `187.127.155.94`, TTL `300`
4. **Delete** any other A record pointing to old IP (e.g. `2.57.91.91`)

Wait 5–30 minutes for propagation.

---

## 15. SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d pmsoftwaresolutions.in -d www.pmsoftwaresolutions.in
```

Certbot automatically updates the Nginx config with SSL and sets up auto-renewal.

---

## 16. Vite Base Path & React Router (Code Changes)

These changes were required for the app to work under the `/craftquote/` subpath:

**`client/vite.config.js`** — tells Vite to prefix all asset URLs with `/craftquote/`:
```js
base: "/craftquote/"
```

**`client/src/App.jsx`** — tells React Router all routes are under `/craftquote`:
```jsx
<BrowserRouter basename="/craftquote">
```

After any code change, rebuild on the VPS:

```bash
cd /var/www/craftquote
git pull
cd client
npm run build
```

---

## 17. Useful PM2 Commands

```bash
pm2 list                          # show all running apps
pm2 logs craftquote               # tail live logs
pm2 logs craftquote --lines 50    # last 50 log lines
pm2 restart craftquote            # restart app
pm2 restart craftquote --update-env  # restart and reload env vars
pm2 env 0                         # show env vars for app id 0
pm2 stop craftquote               # stop app
pm2 delete craftquote             # remove from PM2
pm2 start ecosystem.config.cjs    # start from ecosystem file
pm2 save                          # save process list for reboot persistence
```

---

## 18. Redeployment (After Code Changes)

```bash
cd /var/www/craftquote
git pull
cd server && npm install          # only if server dependencies changed
cd ../client && npm run build     # always rebuild frontend
pm2 restart craftquote
```

---

## 19. Backup Configuration

Nightly backups are enabled via the built-in cron job (`BACKUP_ENABLED=true` in `.env`).

Backups are stored at `/backups/YYYY-MM-DD/` and automatically deleted after 7 days.

Requires `mongodb-database-tools` to be installed (done in step 6).

To manually trigger a backup:
```bash
mongodump --uri="mongodb://localhost:27017/craftquote_db" --out=/backups/manual-$(date +%Y-%m-%d)
```

---

## 20. Known Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| PDF download fails | Wrong Chromium path | Check `/snap/chromium/*/usr/lib/chromium-browser/chrome` path and update `ecosystem.config.cjs` |
| ₹ symbol missing in PDF | Missing Noto fonts | `apt install -y fonts-noto fonts-noto-core && fc-cache -fv` |
| 403 on `/craftquote/` | Wrong permissions | `chmod -R 755 /var/www/craftquote/client/dist` |
| Assets 404 (JS/CSS) | Missing Vite base path | Set `base: "/craftquote/"` in `vite.config.js` and rebuild |
| PM2 env vars not loaded | PM2 doesn't read `.env` | Set vars in `ecosystem.config.cjs` env block |
| Chromium Snap install hangs | Slow Snap store | Open new SSH session, run `snap changes`, then `snap abort <ID>` |
| `dpkg` interrupted error | Snap abort left dpkg broken | Run `dpkg --configure -a` then `dpkg --remove --force-remove-reinstreq chromium-browser` |
