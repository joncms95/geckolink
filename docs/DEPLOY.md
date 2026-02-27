# Deploy GeckoLink (DigitalOcean + Docker)

Deploy the Rails API on a DigitalOcean droplet with Docker Compose. Set up HTTPS with Nginx and Let's Encrypt, then connect the React frontend on Vercel.

---

## Table of contents

| Section                         | Contents                                          |
| ------------------------------- | ------------------------------------------------- |
| **[Backend](#backend)**         | Droplet setup, Docker, run the API over HTTP      |
| **[HTTPS setup](#https-setup)** | Domain, Nginx, Let's Encrypt, certificate renewal |
| **[Frontend](#frontend)**       | Vercel deployment, `VITE_API_BASE`, SPA rewrites  |

---

## Backend

Get the Rails API running on a single droplet over HTTP. You need a **DigitalOcean account**, a **SECRET_KEY_BASE** (e.g. `openssl rand -hex 64`), and **Git** to clone the repo.

### 1. Create the droplet

1. In [DigitalOcean](https://cloud.digitalocean.com), go to **Droplets** → **Create Droplet**.
2. **Image**: **Ubuntu 24.04 LTS** (or **Docker** one-click app).
3. **Plan**: Basic shared CPU; **$6/mo** (1 GB RAM) is enough to start.
4. **Datacenter**: Pick one close to your users.
5. **Authentication**: Add your SSH key (recommended) or use a password.
6. Create the droplet and note its **IP address**.

### 2. SSH into the droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Install Docker and Docker Compose

On **Ubuntu**:

```bash
apt-get update && apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify:

```bash
docker --version
docker compose version
```

### 4. Get the app on the server

```bash
git clone https://github.com/joncms95/geckolink.git
cd geckolink
```

### 5. Create production `.env`

In the app directory:

```bash
nano .env
```

Add (replace with your real values):

```env
# Required
SECRET_KEY_BASE=your_secret_key_here
POSTGRES_PASSWORD=your_secure_random_password_here

# Required when using IP without HTTPS (so Rails doesn't redirect to broken HTTPS)
DISABLE_SSL_REDIRECT=1
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

The Compose file already sets `DATABASE_URL` and `REDIS_URL` for the app. Override `REDIS_URL` in `.env` only if you use a different Redis instance.

### 6. Build and start the stack

```bash
docker compose build --no-cache
docker compose up -d
```

Check containers:

```bash
docker compose ps
```

You should see `app`, `worker`, `db`, and `redis`. The app is bound to **port 80** on the droplet. The **worker** service runs Sidekiq and processes background jobs (click recording and geolocation); it uses the same image as `app` with the command overridden to `bundle exec sidekiq`.

### 7. Open port 80 (firewall)

If UFW is enabled:

```bash
ufw allow 80/tcp
ufw allow 22/tcp
ufw --force enable
ufw status
```

### 8. Test the API

In a browser:

```text
http://YOUR_DROPLET_IP
```

You should see the Rails app. If it redirects to `https://...` and fails, add `DISABLE_SSL_REDIRECT=1` to `.env` and run `docker compose up -d` again.

Troubleshoot:

```bash
docker compose logs -f app
```

### Backend: useful commands

| Task                       | Command                                                |
| -------------------------- | ------------------------------------------------------ |
| View app logs              | `docker compose logs -f app`                           |
| View worker (Sidekiq) logs | `docker compose logs -f worker`                        |
| Stop stack                 | `docker compose down`                                  |
| Start stack                | `docker compose up -d`                                 |
| Rebuild after code change  | `docker compose build app && docker compose up -d app` |
| Rails console              | `docker compose exec app bin/rails console`            |
| Run migrations             | `docker compose exec app bin/rails db:migrate`         |

**Using HTTPS?** Prepend `-f docker-compose.yml -f docker-compose.https.yml` to every `docker compose` command (e.g. `docker compose -f docker-compose.yml -f docker-compose.https.yml up -d`).

---

## HTTPS setup

Serve the API over HTTPS with Nginx and a Let's Encrypt certificate. Do this after the [Backend](#backend) is running.

### Prerequisites

- A **domain** you control (e.g. **geckolink.click**) with an **A record** pointing to your droplet IP.
- Port **443** allowed in the firewall (see step 1 below).

The repo’s Nginx configs are set for **geckolink.click**. For another domain (e.g. api.geckolink.click), replace the domain in `nginx/nginx.conf` and `nginx/nginx-https.conf`.

### 1. Point the domain at the droplet

1. In your registrar’s DNS settings, add an **A record**: **Type** `A`, **Name** `@` (or blank for root), **Value** = your droplet IP (e.g. `188.166.235.241`). For a subdomain use **Name** `api` (or your subdomain).
2. Wait for DNS (minutes to hours). Check: `dig geckolink.click +short` or [whatsmydns.net](https://www.whatsmydns.net/).

### 2. Allow HTTPS in the firewall

On the droplet:

```bash
ufw allow 443/tcp
ufw reload
```

### 3. Start the stack with the HTTPS override

From the app directory:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

This starts app, db, redis, and Nginx. Nginx listens on 80 and 443 and proxies to the app. The app’s direct port 80 binding is overridden.

**If you see "network not found" or other compose errors**, tear down and start fresh:

```bash
docker compose down
docker compose -f docker-compose.yml -f docker-compose.https.yml down
docker network prune -f
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

### 4. Get a Let’s Encrypt certificate

Run Certbot once (use your real email):

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d geckolink.click \
  -d api.geckolink.click \
  -d www.geckolink.click \
  -d www.api.geckolink.click \
  --email you@example.com \
  --agree-tos --no-eff-email
```

On success, the certificate is in the `certbot_conf` volume.

### 5. Switch Nginx to HTTPS and restart

```bash
cp nginx/nginx-https.conf nginx/nginx.conf
docker compose -f docker-compose.yml -f docker-compose.https.yml restart nginx
```

Nginx will redirect HTTP to HTTPS and serve the app over TLS.

### 6. Enable Rails SSL redirect (optional)

In `.env` on the server, remove `DISABLE_SSL_REDIRECT` or set it to `0`. Restart the app:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d app
```

### 7. Renew the certificate

Let’s Encrypt certs expire after 90 days. Renew:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml run --rm certbot renew
docker compose -f docker-compose.yml -f docker-compose.https.yml restart nginx
```

Add a cron job or systemd timer to run this periodically (e.g. monthly).

### HTTPS checklist

- [ ] Domain A record points to droplet IP
- [ ] Port 443 allowed (firewall)
- [ ] Domain correct in `nginx/nginx.conf` and `nginx/nginx-https.conf`
- [ ] Stack started with `-f docker-compose.https.yml`
- [ ] Certbot run once for your domain
- [ ] `nginx/nginx.conf` replaced with `nginx-https.conf`, nginx restarted
- [ ] `DISABLE_SSL_REDIRECT` removed or set to 0 in `.env`, app restarted

---

## Frontend

The React SPA is deployed on **Vercel** (e.g. **https://geckolink.vercel.app**). CORS in `config/initializers/cors.rb` allows that origin.

### Configure the API URL

In the Vercel project, set the environment variable **`VITE_API_BASE`** to your API URL **with no trailing slash**:

| Backend setup                | `VITE_API_BASE`               |
| ---------------------------- | ----------------------------- |
| HTTPS (e.g. geckolink.click) | `https://www.geckolink.click` |

Redeploy after changing env vars so the client bundle picks up the new base URL.

### SPA routing (reload / direct URLs)

`client/vercel.json` rewrites all routes to `index.html`, so reloading or opening `/dashboard` (or any client route) works instead of 404.

---

## Summary checklist

**Backend (HTTP)**

- [ ] Droplet created (Ubuntu or Docker one-click)
- [ ] SSH access works
- [ ] Docker and Docker Compose installed
- [ ] App cloned (e.g. into `geckolink`)
- [ ] `.env` with `SECRET_KEY_BASE`, `POSTGRES_PASSWORD`, `DISABLE_SSL_REDIRECT=1` (when using IP without HTTPS)
- [ ] `docker compose up -d` run
- [ ] Port 80 allowed (firewall)
- [ ] App loads at `http://YOUR_DROPLET_IP`

**HTTPS**

- [ ] Follow [HTTPS setup](#https-setup) above

**Frontend**

- [ ] Frontend deployed on Vercel
- [ ] `VITE_API_BASE` set in Vercel to your API URL (no trailing slash)
