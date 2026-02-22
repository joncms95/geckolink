# Deploy to DigitalOcean Droplet (Docker)

Simple deployment using Docker and Docker Compose on a single droplet.

---

## What you need

- A **DigitalOcean account**
- A **SECRET_KEY_BASE**
- **Git** (to clone the repo on the droplet, or another way to copy the app files)

---

## Step 1: Create the droplet

1. In [DigitalOcean](https://cloud.digitalocean.com), go to **Droplets** → **Create Droplet**.
2. **Image**: Choose **Ubuntu 24.04 LTS** (or **Docker** one-click app if you prefer).
3. **Plan**: Basic shared CPU; **$6/mo** (1 GB RAM) is enough to start.
4. **Datacenter**: Pick one close to your users.
5. **Authentication**: Add your SSH key (recommended) or use a password.
6. Create the droplet and note its **IP address**.

---

## Step 2: SSH into the droplet

```bash
ssh root@YOUR_DROPLET_IP
```

(Replace `YOUR_DROPLET_IP` with the IP from Step 1. Use `ubuntu@...` if you chose a non-root user.)

---

## Step 3: Install Docker and Docker Compose

On **Ubuntu** (if you didn’t use the Docker one-click image):

```bash
apt-get update && apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Check:

```bash
docker --version
docker compose version
```

---

## Step 4: Get your app on the server

**Clone with Git (if the repo is public or you have deploy keys):**

```bash
git clone https://github.com/YOUR_USERNAME/geckolink.git
cd geckolink
```

---

## Step 5: Create production `.env`

On the droplet, in the app directory:

```bash
cd /geckolink
nano .env
```

Add (replace with your real values):

```env
# Required:
SECRET_KEY_BASE=your_secret_key_here

# Required: strong password for PostgreSQL (no spaces)
POSTGRES_PASSWORD=your_secure_random_password_here

# Required when using the droplet IP (no domain/HTTPS): allow HTTP so the app doesn't redirect to broken HTTPS
DISABLE_SSL_REDIRECT=1
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

**Optional:** set a dedicated Redis URL or cache URL:

```env
REDIS_URL=redis://redis:6379/0
REDIS_CACHE_URL=redis://redis:6379/1
```

The Compose file already sets `DATABASE_URL` and `REDIS_URL` for the app. You must set `SECRET_KEY_BASE` and `POSTGRES_PASSWORD` in `.env` for this setup.

---

## Step 6: Build and start the stack

```bash
docker compose build --no-cache
docker compose up -d
```

Check that containers are running:

```bash
docker compose ps
```

You should see `app`, `db`, and `redis` running. The app is bound to **port 80** on the droplet.

---

## Step 7: Open port 80 (firewall)

If UFW is enabled, allow HTTP:

```bash
ufw allow 80/tcp
ufw allow 22/tcp
ufw --force enable
ufw status
```

---

## Step 8: Test the app

In a browser:

```text
http://YOUR_DROPLET_IP
```

You should see your Rails app. If the page redirects to `https://...` and then fails to load, add `DISABLE_SSL_REDIRECT=1` to your `.env`, then run `docker compose up -d` again (Rails only redirects to HTTPS when you have a real SSL setup in front).

If something else fails, check logs:

```bash
docker compose logs -f app
```

---

## Useful commands

| Task                      | Command                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| View app logs             | `docker compose logs -f app`                           |
| Stop stack                | `docker compose down`                                  |
| Start stack               | `docker compose up -d`                                 |
| Rebuild after code change | `docker compose build app && docker compose up -d app` |
| Run Rails console         | `docker compose exec app bin/rails console`                            |
| Run migrations by hand    | `docker compose exec app bin/rails db:migrate`                         |

**If you use HTTPS** (Nginx override), add `-f docker-compose.yml -f docker-compose.https.yml` to every `docker compose` command (e.g. `docker compose -f docker-compose.yml -f docker-compose.https.yml up -d`).

---

## Setting up the domain (geckolink.click)

To use **geckolink.click** for your API with HTTPS:

1. **Register or use a domain** you control (e.g. **geckolink.click**) at any registrar (Namecheap, Cloudflare, Porkbun, etc.).
2. **Add a DNS A record** in your registrar's DNS settings: **Type** `A`, **Name** `@` (or leave blank for root), **Value** `188.166.235.241` (your droplet IP). For a subdomain like **api.geckolink.click**, use **Name** `api` instead.
3. **Wait for DNS** (minutes to a few hours). Check with `dig geckolink.click +short` — you should see the IP. Or use [whatsmydns.net](https://www.whatsmydns.net/).
4. Then follow **"Setting up HTTPS with Nginx"** below. The Nginx configs are set for **geckolink.click** (root domain).

---

## Setting up HTTPS with Nginx

The repo includes Nginx and Certbot so you can serve the app over HTTPS with a Let’s Encrypt certificate. Use the HTTPS compose override and the configs in `nginx/`.

**Prerequisites:** A domain whose A record points to your droplet IP (e.g. `geckolink.click` → `188.166.235.241`). The Nginx configs are set for **geckolink.click**; for another domain (e.g. api.geckolink.click), replace it in the Nginx files.

### 1. Allow HTTPS in the firewall

On the droplet:

```bash
ufw allow 443/tcp
ufw reload
```

### 2. Nginx config

The repo’s `nginx/nginx.conf` and `nginx/nginx-https.conf` are set for **geckolink.click**. If you use a different domain (e.g. api.geckolink.click), replace `geckolink.click` in both files.

**Clean reset (if you get "network not found" or other compose errors):** From the app directory, tear down both stacks, prune networks, then start fresh with the HTTPS override:

```bash
docker compose down
docker compose -f docker-compose.yml -f docker-compose.https.yml down
docker network prune -f
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

### 3. Start the stack with the HTTPS override

From the app directory on the droplet:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

This starts the app, db, redis, and Nginx. The app is no longer on port 80; Nginx listens on 80 and 443 and proxies to the app.

### 4. Get a Let’s Encrypt certificate

Run Certbot once (use your real email for `--email`):

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d geckolink.click \
  --email you@example.com \
  --agree-tos --no-eff-email
```

If that succeeds, Certbot has written the certificate into the `certbot_conf` volume.

### 5. Switch Nginx to HTTPS and restart

On the droplet:

```bash
cp nginx/nginx-https.conf nginx/nginx.conf
docker compose -f docker-compose.yml -f docker-compose.https.yml restart nginx
```

Nginx will now redirect HTTP to HTTPS and serve the app over TLS.

### 6. Turn on Rails SSL redirect (optional)

In your `.env` on the server, remove `DISABLE_SSL_REDIRECT` or set it to `0`. Then restart the app so Rails uses `force_ssl` again (HSTS, secure cookies):

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d app
```

### 7. Renewing the certificate

Let’s Encrypt certs expire after 90 days. Renew with:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml run --rm certbot renew
docker compose -f docker-compose.yml -f docker-compose.https.yml restart nginx
```

Add a cron job or systemd timer to run that periodically (e.g. monthly).

### Summary (HTTPS)

- [ ] Domain A record points to droplet IP
- [ ] Port 443 allowed (firewall)
- [ ] Domain in `nginx/nginx.conf` and `nginx/nginx-https.conf` is correct (default: geckolink.click)
- [ ] Stack started with `-f docker-compose.https.yml`
- [ ] Certbot run once for your domain
- [ ] `nginx/nginx.conf` replaced with `nginx-https.conf`, nginx restarted
- [ ] `DISABLE_SSL_REDIRECT` removed or set to 0 in `.env`, app restarted

---

## Frontend (Vercel)

The React frontend is deployed at **https://geckolink.vercel.app**. CORS is configured in `config/initializers/cors.rb` to allow that origin. In Vercel, set the environment variable **`VITE_API_BASE`** to your API URL with no trailing slash so the app can call the backend. For HTTPS: **`https://geckolink.click`** (or your domain, e.g. https://api.geckolink.click). For HTTP-only: `http://YOUR_DROPLET_IP`.

---

## Summary checklist

- [ ] Droplet created (Ubuntu or Docker one-click)
- [ ] SSH access works
- [ ] Docker and Docker Compose installed
- [ ] App code at `/geckolink` (clone or rsync)
- [ ] `.env` with `SECRET_KEY_BASE`, `POSTGRES_PASSWORD`, and `DISABLE_SSL_REDIRECT=1` (when using IP without HTTPS)
- [ ] `docker compose up -d` run
- [ ] Port 80 allowed (firewall)
- [ ] App loads at `http://YOUR_DROPLET_IP`
- [ ] (Optional) HTTPS: see "Setting up HTTPS with Nginx" above
