# 🐸 Frogstats - Self-Hosted Google Analytics Alternative

Frogstats is an open-source, privacy-focused alternative to Google Analytics. Easily self-host it on your own VPS server and take full control of your analytics data.

## 🚀 Quick Start Guide

### 1. Set Up Your VPS Server

Choose a reliable VPS provider (e.g., DigitalOcean, Linode, AWS, Hetzner) and create a new Ubuntu server instance.

### 2. Clone the Repository

SSH into your server and clone the repository:

```bash
git clone [your-repo-url] frogstats
cd frogstats
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and set the following variables:

- `BASE_URL`: Your domain URL (e.g., `https://analytics.frogstats.com`)
- `BETTER_AUTH_SECRET`: Generate a secure secret using OpenSSL:

```bash
openssl rand -hex 32
```

Copy the generated secret and paste it into your `.env` file.

Your `.env` file should look like this:

```env
BASE_URL=https://analytics.frogstats.com
BETTER_AUTH_SECRET=your_generated_secret_here
```

### 4. Deploy with Docker Compose

Ensure Docker and Docker Compose are installed on your server. Then, run:

```bash
docker compose up --build -d
```

This will build and start all necessary services (ClickHouse, PostgreSQL, backend, and frontend).

### 5. Set Up Nginx and SSL with Certbot

Install Nginx and Certbot:

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/frogstats
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name analytics.frogstats.com;

    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/frogstats /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain SSL certificates with Certbot:

```bash
sudo certbot --nginx -d analytics.frogstats.com
```

Follow the prompts to complete SSL setup.

### 6. Access Your FrogStats Dashboard

Navigate to your domain:

```
https://analytics.frogstats.com
```

Log in with the default admin credentials:

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Important:** Change the default password immediately after logging in.

## 🎉 Congratulations!

Your self-hosted FrogStats instance is now up and running. Enjoy privacy-focused analytics on your own infrastructure!
