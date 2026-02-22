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
3. **Plan**: Basic shared CPU; **$6/mo** (1 GB RAM) is enough to start; use **$12/mo** (2 GB) if you run Sidekiq or more traffic.
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

You should see your Rails app. If something fails, check logs:

```bash
docker compose logs -f app
```

---

## Useful commands

| Task                      | Command                                                |
| ------------------------- | ------------------------------------------------------ |
| View logs                 | `docker compose logs -f app`                           |
| Stop stack                | `docker compose down`                                  |
| Start stack               | `docker compose up -d`                                 |
| Rebuild after code change | `docker compose build app && docker compose up -d app` |
| Run Rails console         | `docker compose exec app bin/rails console`            |
| Run migrations by hand    | `docker compose exec app bin/rails db:migrate`         |

---

## Optional: domain and HTTPS

1. Point a domain’s A record to your droplet IP.
2. On the droplet, install a reverse proxy (e.g. Caddy or Nginx) in front of the app, or add a Caddy/Nginx service to `docker-compose.yml` that listens on 80/443 and proxies to `app:3000`, and get a certificate (e.g. Let’s Encrypt).

For a “simple” first deploy, using the droplet IP on port 80 is enough; you can add a domain and HTTPS later.

---

## Frontend (Vercel)

The React frontend is deployed at **https://geckolink.vercel.app**. CORS is configured in `config/initializers/cors.rb` to allow that origin. In Vercel, set the environment variable **`VITE_API_BASE`** to your API URL (e.g. `http://YOUR_DROPLET_IP` or `https://api.yourdomain.com`) with no trailing slash so the app can call the backend.

---

## Summary checklist

- [ ] Droplet created (Ubuntu or Docker one-click)
- [ ] SSH access works
- [ ] Docker and Docker Compose installed
- [ ] App code at `/geckolink` (clone or rsync)
- [ ] `.env` with `SECRET_KEY_BASE` and `POSTGRES_PASSWORD`
- [ ] `docker compose up -d` run
- [ ] Port 80 allowed (firewall)
- [ ] App loads at `http://YOUR_DROPLET_IP`
