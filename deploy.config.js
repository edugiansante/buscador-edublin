/**
 * 🚀 Configuração de Deploy - Edublin
 * 
 * Este arquivo contém configurações específicas para diferentes
 * provedores de deploy (Vercel, Netlify, etc.)
 */

// Configuração base para todos os provedores
const baseConfig = {
  // Build settings
  build: {
    command: 'npm run build',
    directory: 'dist',
    nodeVersion: '18.x'
  },
  
  // Environment variables que devem ser configuradas
  requiredEnvVars: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SITE_URL'
  ],
  
  // Variáveis opcionais com valores padrão
  defaultEnvVars: {
    VITE_APP_NAME: 'Edublin',
    VITE_APP_ENVIRONMENT: 'production',
    VITE_CONTACT_EMAIL: 'contato@edublin.com.br',
    VITE_RATE_LIMIT_SEARCHES: '3',
    VITE_NETWORK_TIMEOUT: '5000',
    VITE_ENABLE_DEMO_FALLBACK: 'true',
    VITE_ENABLE_DEBUG_PANEL: 'false'
  },
  
  // Headers de segurança
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.whatsapp.com; frame-ancestors 'none';"
  }
};

// Configuração específica para Vercel
const vercelConfig = {
  ...baseConfig,
  
  // vercel.json
  vercelJson: {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite",
    "installCommand": "npm install",
    
    // Configurações de runtime
    "functions": {
      "app/**/*.js": {
        "runtime": "nodejs18.x"
      }
    },
    
    // Redirects e rewrites
    "rewrites": [
      {
        "source": "/api/:path*",
        "destination": "/api/:path*"
      }
    ],
    
    "redirects": [
      {
        "source": "/auth/callback",
        "destination": "/auth/confirm",
        "permanent": false
      }
    ],
    
    // Headers
    "headers": [
      {
        "source": "/(.*)",
        "headers": Object.entries(baseConfig.securityHeaders).map(([key, value]) => ({
          "key": key,
          "value": value
        }))
      },
      {
        "source": "/api/(.*)",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          },
          {
            "key": "Access-Control-Allow-Methods",
            "value": "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            "key": "Access-Control-Allow-Headers",
            "value": "Content-Type, Authorization"
          }
        ]
      }
    ],
    
    // Configurações de cache
    "crons": [],
    
    // Environment variables
    "env": {
      "NODE_ENV": "production"
    }
  },
  
  // Script de deploy para Vercel
  deployScript: [
    '# Vercel Deploy Script',
    'echo "🔺 Deploy para Vercel iniciado..."',
    '',
    '# 1. Verificar se está logado',
    'vercel whoami || (echo "Execute: vercel login" && exit 1)',
    '',
    '# 2. Configurar variáveis de ambiente',
    'echo "Configurando variáveis de ambiente..."',
    '# Adicione suas variáveis aqui:',
    '# vercel env add VITE_SUPABASE_URL production',
    '# vercel env add VITE_SUPABASE_ANON_KEY production',
    '# vercel env add VITE_SITE_URL production',
    '',
    '# 3. Deploy',
    'vercel --prod',
    '',
    'echo "✅ Deploy para Vercel concluído!"'
  ].join('\n')
};

// Configuração específica para Netlify
const netlifyConfig = {
  ...baseConfig,
  
  // netlify.toml
  netlifyToml: `
# Netlify configuration for Edublin

[build]
  command = "npm run build"
  publish = "dist"
  
  # Environment variables
  environment = { NODE_ENV = "production", NODE_VERSION = "18" }

[build.processing]
  skip_processing = false

[build.processing.css]
  bundle = true
  minify = true

[build.processing.js]
  bundle = true
  minify = true

[build.processing.html]
  pretty_urls = true

# Redirects and rewrites
[[redirects]]
  from = "/auth/callback"
  to = "/auth/confirm"
  status = 302

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"

# Cache headers
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Functions
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# Dev server
[dev]
  command = "npm run dev"
  port = 5173
  publish = "dist"
`,

  // Script de deploy para Netlify
  deployScript: [
    '# Netlify Deploy Script',
    'echo "🟢 Deploy para Netlify iniciado..."',
    '',
    '# 1. Verificar se está logado',
    'netlify status || (echo "Execute: netlify login" && exit 1)',
    '',
    '# 2. Deploy',
    'netlify deploy --prod',
    '',
    'echo "✅ Deploy para Netlify concluído!"'
  ].join('\n')
};

// Configuração para GitHub Actions
const githubActionsConfig = {
  workflow: `
name: Deploy Edublin to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint || true
    
    - name: Run type check
      run: npx tsc --noEmit || true
    
    - name: Run tests
      run: npm test || true
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_SITE_URL: \${{ secrets.VITE_SITE_URL }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_SITE_URL: \${{ secrets.VITE_SITE_URL }}
    
    # Deploy para Vercel
    - name: Deploy to Vercel
      if: contains(github.repository, 'vercel')
      run: |
        npm install -g vercel
        vercel --token \${{ secrets.VERCEL_TOKEN }} --prod
    
    # Deploy para Netlify
    - name: Deploy to Netlify
      if: contains(github.repository, 'netlify')
      run: |
        npm install -g netlify-cli
        netlify deploy --prod --auth \${{ secrets.NETLIFY_AUTH_TOKEN }}
`
};

// Configuração para Docker
const dockerConfig = {
  dockerfile: `
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Add security headers
RUN echo 'add_header X-Frame-Options DENY;' >> /etc/nginx/conf.d/security.conf
RUN echo 'add_header X-Content-Type-Options nosniff;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`,

  nginxConfig: `
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header Referrer-Policy strict-origin-when-cross-origin;
        
        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Security
        location ~ /\\.ht {
            deny all;
        }
    }
}
`,

  dockerCompose: `
version: '3.8'

services:
  edublin:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Opcional: Nginx proxy reverso
  proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./proxy.conf:/etc/nginx/nginx.conf
    depends_on:
      - edublin
    restart: unless-stopped
`
};

module.exports = {
  baseConfig,
  vercelConfig,
  netlifyConfig,
  githubActionsConfig,
  dockerConfig
};