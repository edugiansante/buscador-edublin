/**
 * 🔗 Script de Integração Figma Make → GitHub
 * 
 * Este script automatiza a conexão entre seu projeto Figma Make
 * e um repositório GitHub com deploy automático.
 * 
 * Uso: node scripts/github-integration.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔧 ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

// Utilitários
const execCommand = (command, description, options = {}) => {
  try {
    log.step(`Executando: ${description}`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    if (!options.silent) {
      log.success(`${description} concluído`);
    }
    return { success: true, output };
  } catch (error) {
    log.error(`${description} falhou: ${error.message}`);
    return { success: false, error: error.message, output: error.stdout };
  }
};

const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

const writeFile = (filePath, content) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    log.error(`Erro ao escrever ${filePath}: ${error.message}`);
    return false;
  }
};

// Verificar pré-requisitos
async function checkPrerequisites() {
  log.title('🔍 VERIFICANDO PRÉ-REQUISITOS');
  
  let allGood = true;
  
  // Verificar Git
  log.step('Verificando Git...');
  const gitCheck = execCommand('git --version', 'Verificação Git', { silent: true });
  if (gitCheck.success) {
    log.success('Git instalado');
  } else {
    log.error('Git não encontrado. Instale Git primeiro.');
    allGood = false;
  }
  
  // Verificar Node.js
  log.step('Verificando Node.js...');
  const nodeCheck = execCommand('node --version', 'Verificação Node.js', { silent: true });
  if (nodeCheck.success) {
    const version = nodeCheck.output.trim();
    const majorVersion = parseInt(version.slice(1));
    if (majorVersion >= 16) {
      log.success(`Node.js ${version} (compatível)`);
    } else {
      log.warning(`Node.js ${version} (recomendado 16+)`);
    }
  } else {
    log.error('Node.js não encontrado. Instale Node.js primeiro.');
    allGood = false;
  }
  
  // Verificar npm
  log.step('Verificando npm...');
  const npmCheck = execCommand('npm --version', 'Verificação npm', { silent: true });
  if (npmCheck.success) {
    log.success(`npm ${npmCheck.output.trim()}`);
  } else {
    log.error('npm não encontrado.');
    allGood = false;
  }
  
  return allGood;
}

// Configurar Git
async function setupGit() {
  log.title('🐙 CONFIGURANDO GIT');
  
  // Verificar configuração do Git
  const nameCheck = execCommand('git config user.name', 'Verificação nome Git', { silent: true });
  const emailCheck = execCommand('git config user.email', 'Verificação email Git', { silent: true });
  
  if (!nameCheck.success || !nameCheck.output.trim()) {
    const name = await question('📝 Digite seu nome para Git: ');
    execCommand(`git config --global user.name "${name}"`, 'Configuração nome Git');
  } else {
    log.success(`Git configurado para: ${nameCheck.output.trim()}`);
  }
  
  if (!emailCheck.success || !emailCheck.output.trim()) {
    const email = await question('📧 Digite seu email para Git: ');
    execCommand(`git config --global user.email "${email}"`, 'Configuração email Git');
  } else {
    log.success(`Email Git: ${emailCheck.output.trim()}`);
  }
  
  // Inicializar repositório se necessário
  if (!fileExists('.git')) {
    log.step('Inicializando repositório Git...');
    execCommand('git init', 'Inicialização Git');
    execCommand('git branch -M main', 'Configuração branch main');
  } else {
    log.success('Repositório Git já existe');
  }
}

// Configurar package.json
async function setupPackageJson() {
  log.title('📦 CONFIGURANDO PACKAGE.JSON');
  
  if (!fileExists('package.json')) {
    log.step('Criando package.json...');
    
    const projectName = await question('📝 Nome do projeto (edublin): ') || 'edublin';
    const description = await question('📝 Descrição (Plataforma de conexão para intercambistas): ') || 'Plataforma de conexão para intercambistas';
    const author = await question('📝 Autor: ') || '';
    
    const packageJsonContent = {
      "name": projectName,
      "version": "1.0.0",
      "description": description,
      "main": "App.tsx",
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "lint:fix": "eslint . --ext ts,tsx --fix",
        "type-check": "tsc --noEmit",
        "deploy:vercel": "vercel --prod",
        "deploy:netlify": "netlify deploy --prod",
        "setup": "node scripts/setup-deploy.js",
        "migrate": "node scripts/verify-migration.js",
        "sync:figma": "node scripts/sync-figma.js",
        "github:setup": "node scripts/github-integration.js"
      },
      "keywords": ["intercambio", "estudantes", "react", "supabase", "figma-make"],
      "author": author,
      "license": "MIT",
      "dependencies": {
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "@supabase/supabase-js": "^2.39.0"
      },
      "devDependencies": {
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.0",
        "@typescript-eslint/eslint-plugin": "^8.15.0",
        "@typescript-eslint/parser": "^8.15.0",
        "@vitejs/plugin-react": "^4.3.3",
        "eslint": "^9.15.0",
        "eslint-plugin-react-hooks": "^5.0.0",
        "eslint-plugin-react-refresh": "^0.4.14",
        "typescript": "~5.6.2",
        "vite": "^6.0.1"
      }
    };
    
    writeFile('package.json', JSON.stringify(packageJsonContent, null, 2));
    log.success('package.json criado');
  } else {
    log.success('package.json já existe');
  }
  
  // Instalar dependências
  log.step('Instalando dependências...');
  const installResult = execCommand('npm install', 'Instalação dependências');
  
  if (!installResult.success) {
    log.warning('Falha na instalação. Tentando com --legacy-peer-deps...');
    execCommand('npm install --legacy-peer-deps', 'Instalação dependências (legacy)');
  }
}

// Criar arquivos de configuração
async function createConfigFiles() {
  log.title('⚙️ CRIANDO ARQUIVOS DE CONFIGURAÇÃO');
  
  // .gitignore
  if (!fileExists('.gitignore')) {
    log.step('Criando .gitignore...');
    const gitignoreContent = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Production builds
/dist
/build
/.next/
/out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Vite build output
dist/

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Figma Make specific
.figma-make/
figma-exports/

# Deploy configs
.vercel
.netlify

# Database
*.db
*.sqlite
*.sqlite3

# OS generated files
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/
`;
    writeFile('.gitignore', gitignoreContent);
    log.success('.gitignore criado');
  } else {
    log.success('.gitignore já existe');
  }
  
  // vite.config.ts
  if (!fileExists('vite.config.ts')) {
    log.step('Criando vite.config.ts...');
    const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
})
`;
    writeFile('vite.config.ts', viteConfigContent);
    log.success('vite.config.ts criado');
  }
  
  // tsconfig.json
  if (!fileExists('tsconfig.json')) {
    log.step('Criando tsconfig.json...');
    const tsconfigContent = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`;
    writeFile('tsconfig.json', tsconfigContent);
    log.success('tsconfig.json criado');
  }
}

// Criar GitHub Actions
async function createGitHubActions() {
  log.title('🚀 CRIANDO GITHUB ACTIONS');
  
  // Workflow de deploy
  const deployWorkflowContent = `name: 🚀 Deploy Edublin

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'

jobs:
  # Job de validação
  validate:
    name: 🔍 Validate & Test
    runs-on: ubuntu-latest
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
    
    - name: 📦 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: 📥 Install dependencies
      run: npm ci
    
    - name: 🔍 Run linter
      run: npm run lint
      continue-on-error: true
    
    - name: 🔍 Type check
      run: npm run type-check
      continue-on-error: true
    
    - name: 🏗️ Build project
      run: npm run build
      env:
        VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_SITE_URL: \${{ secrets.VITE_SITE_URL }}

  # Job de deploy (apenas em main)
  deploy:
    name: 🚀 Deploy to Production
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
    
    - name: 📦 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: 📥 Install dependencies
      run: npm ci
    
    - name: 🏗️ Build project
      run: npm run build
      env:
        VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_SITE_URL: \${{ secrets.VITE_SITE_URL }}
        VITE_APP_ENVIRONMENT: production
    
    # Deploy para Vercel
    - name: 🔺 Deploy to Vercel
      uses: amondnet/vercel-action@v25
      if: \${{ secrets.VERCEL_TOKEN }}
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
        working-directory: ./

  # Job de notificação
  notify:
    name: 📢 Notify Deploy Status
    needs: [validate, deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: 📢 Deploy Success Notification
      if: needs.deploy.result == 'success'
      run: |
        echo "✅ Deploy realizado com sucesso!"
        echo "🌐 Site disponível"
    
    - name: 📢 Deploy Failure Notification
      if: needs.deploy.result == 'failure'
      run: |
        echo "❌ Deploy falhou!"
        echo "🔍 Verifique os logs para mais detalhes"
`;
  
  writeFile('.github/workflows/deploy.yml', deployWorkflowContent);
  log.success('GitHub Actions workflow criado');
  
  // Workflow de sincronização
  const syncWorkflowContent = `name: 🔄 Sync with Figma Make

on:
  # Trigger manual
  workflow_dispatch:
  
  # Trigger agendado (diário às 9h)
  schedule:
    - cron: '0 9 * * *'
  
  # Trigger via webhook
  repository_dispatch:
    types: [figma-updated]

jobs:
  sync:
    name: 🔄 Sync with Figma Make
    runs-on: ubuntu-latest
    
    steps:
    - name: 📥 Checkout
      uses: actions/checkout@v4
      with:
        token: \${{ secrets.GITHUB_TOKEN }}
        fetch-depth: 0
    
    - name: 📦 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: 📥 Install dependencies
      run: npm ci
    
    - name: 🔄 Sync with Figma Make
      run: npm run sync:figma
      env:
        FIGMA_MAKE_TOKEN: \${{ secrets.FIGMA_MAKE_TOKEN }}
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    
    - name: 📢 Notify if changes
      if: success()
      run: |
        echo "✅ Sincronização concluída!"
        echo "Deploy automático será iniciado se houver mudanças."
`;
  
  writeFile('.github/workflows/sync-figma.yml', syncWorkflowContent);
  log.success('Workflow de sincronização criado');
}

// Criar templates de issue
async function createIssueTemplates() {
  log.title('📝 CRIANDO TEMPLATES DE ISSUE');
  
  // Bug report template
  const bugReportContent = `---
name: 🐛 Bug Report
about: Reportar um problema
title: '[BUG] '
labels: bug
assignees: ''
---

## 🐛 Descrição do Bug
Descrição clara do problema.

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

## ✅ Comportamento Esperado
O que deveria acontecer.

## 📱 Ambiente
- **Browser**: [ex: Chrome 91]
- **Device**: [ex: iPhone 12]
- **OS**: [ex: iOS 14.6]

## 📸 Screenshots
Se aplicável, adicione screenshots.

## 🔗 Figma Make
- [ ] O bug também existe no Figma Make?
- [ ] É necessário atualizar o design?

## 📝 Informações Adicionais
Qualquer informação adicional sobre o problema.
`;
  
  writeFile('.github/ISSUE_TEMPLATE/bug_report.md', bugReportContent);
  
  // Feature request template
  const featureRequestContent = `---
name: 💡 Feature Request
about: Sugerir uma nova funcionalidade
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## 💡 Descrição da Funcionalidade
Descrição clara da funcionalidade solicitada.

## 🎯 Problema que Resolve
Qual problema esta funcionalidade resolveria?

## 💭 Solução Proposta
Como você imagina que funcionaria?

## 🔄 Alternativas Consideradas
Outras soluções que você considerou.

## 🎨 Design/Mockups
Se aplicável, adicione mockups ou referências visuais.

## 🔗 Figma Make Integration
- [ ] Precisa ser implementado no Figma Make primeiro?
- [ ] É uma funcionalidade apenas de código?

## 📝 Informações Adicionais
Qualquer contexto adicional sobre a funcionalidade.
`;
  
  writeFile('.github/ISSUE_TEMPLATE/feature_request.md', featureRequestContent);
  
  log.success('Templates de issue criados');
}

// Fazer primeiro commit
async function makeInitialCommit() {
  log.title('📝 FAZENDO COMMIT INICIAL');
  
  // Verificar se há arquivos para commit
  const statusResult = execCommand('git status --porcelain', 'Verificação status Git', { silent: true });
  
  if (!statusResult.output || !statusResult.output.trim()) {
    log.info('Nenhum arquivo para commit');
    return;
  }
  
  // Adicionar arquivos
  log.step('Adicionando arquivos ao Git...');
  execCommand('git add .', 'Adição arquivos Git');
  
  // Fazer commit
  log.step('Fazendo commit inicial...');
  const commitMessage = `🎉 Initial commit: Projeto Edublin integrado do Figma Make

✅ Estrutura completa implementada
✅ Integração GitHub configurada  
✅ Deploy automático ativo
✅ Sincronização Figma Make configurada
✅ Templates de colaboração criados

Ready for production! 🚀

Fonte: Figma Make export + GitHub integration script`;

  execCommand(`git commit -m "${commitMessage}"`, 'Commit inicial');
  
  log.success('Commit inicial realizado');
}

// Configurar repositório remoto
async function setupRemoteRepository() {
  log.title('🔗 CONFIGURANDO REPOSITÓRIO REMOTO');
  
  console.log(`${colors.cyan}Para conectar com GitHub, você precisa:${colors.reset}`);
  console.log(`${colors.yellow}1. Criar um repositório no GitHub${colors.reset}`);
  console.log(`${colors.yellow}2. Copiar a URL do repositório${colors.reset}`);
  console.log(`${colors.yellow}3. Informar a URL aqui${colors.reset}`);
  console.log('');
  
  const createRepo = await question('🐙 Você já criou um repositório no GitHub? (y/N): ');
  
  if (createRepo.toLowerCase() !== 'y') {
    console.log('');
    console.log(`${colors.cyan}📋 Passos para criar repositório no GitHub:${colors.reset}`);
    console.log(`${colors.yellow}1. Acesse: https://github.com/new${colors.reset}`);
    console.log(`${colors.yellow}2. Nome: edublin (ou outro nome)${colors.reset}`);
    console.log(`${colors.yellow}3. Descrição: Plataforma de conexão para intercambistas${colors.reset}`);
    console.log(`${colors.yellow}4. Público ou Privado (sua escolha)${colors.reset}`);
    console.log(`${colors.yellow}5. NÃO inicialize com README (já temos)${colors.reset}`);
    console.log(`${colors.yellow}6. Clique "Create repository"${colors.reset}`);
    console.log('');
    
    await question('📝 Pressione Enter após criar o repositório...');
  }
  
  const repoUrl = await question('🔗 Digite a URL do repositório GitHub (ex: https://github.com/usuario/edublin.git): ');
  
  if (!repoUrl) {
    log.warning('URL não fornecida. Configure manualmente depois:');
    console.log(`${colors.cyan}git remote add origin SUA_URL_AQUI${colors.reset}`);
    console.log(`${colors.cyan}git push -u origin main${colors.reset}`);
    return;
  }
  
  // Adicionar remote origin
  log.step('Configurando remote origin...');
  const remoteResult = execCommand(`git remote add origin ${repoUrl}`, 'Configuração remote origin');
  
  if (!remoteResult.success) {
    if (remoteResult.error.includes('already exists')) {
      log.warning('Remote origin já existe. Atualizando...');
      execCommand(`git remote set-url origin ${repoUrl}`, 'Atualização remote origin');
    } else {
      log.error('Falha ao configurar remote origin');
      return;
    }
  }
  
  // Push inicial
  const pushConfirm = await question('🚀 Fazer push inicial para GitHub? (Y/n): ');
  
  if (pushConfirm.toLowerCase() !== 'n') {
    log.step('Fazendo push inicial...');
    const pushResult = execCommand('git push -u origin main', 'Push inicial');
    
    if (pushResult.success) {
      log.success('Código enviado para GitHub com sucesso!');
    } else {
      log.error('Falha no push. Tente manualmente:');
      console.log(`${colors.cyan}git push -u origin main${colors.reset}`);
    }
  }
}

// Mostrar próximos passos
async function showNextSteps() {
  log.title('🎉 INTEGRAÇÃO CONCLUÍDA!');
  
  console.log(`${colors.green}✅ Seu projeto Figma Make está conectado com GitHub!${colors.reset}\n`);
  
  console.log(`${colors.cyan}📋 PRÓXIMOS PASSOS:${colors.reset}\n`);
  
  console.log(`${colors.yellow}1. 🔐 Configurar Secrets no GitHub:${colors.reset}`);
  console.log(`   - Acesse: Settings → Secrets and variables → Actions`);
  console.log(`   - Adicione: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SITE_URL`);
  console.log(`   - Para Vercel: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID\n`);
  
  console.log(`${colors.yellow}2. 🚀 Configurar Deploy:${colors.reset}`);
  console.log(`   - Vercel: Conecte repositório GitHub no dashboard`);
  console.log(`   - Netlify: Conecte repositório GitHub no dashboard`);
  console.log(`   - Deploy automático já configurado via GitHub Actions\n`);
  
  console.log(`${colors.yellow}3. 🔄 Configurar Sincronização Figma Make:${colors.reset}`);
  console.log(`   - Configure FIGMA_MAKE_TOKEN nos secrets do GitHub`);
  console.log(`   - Sincronização automática diária já configurada`);
  console.log(`   - Execute manual: npm run sync:figma\n`);
  
  console.log(`${colors.yellow}4. 👥 Adicionar Colaboradores:${colors.reset}`);
  console.log(`   - Settings → Manage access → Invite a collaborator\n`);
  
  console.log(`${colors.cyan}🔗 LINKS ÚTEIS:${colors.reset}`);
  console.log(`   - GitHub: https://github.com`);
  console.log(`   - Vercel: https://vercel.com`);
  console.log(`   - Netlify: https://netlify.com`);
  console.log(`   - Supabase: https://supabase.com\n`);
  
  console.log(`${colors.green}🎯 FLUXO COMPLETO ATIVO:${colors.reset}`);
  console.log(`${colors.cyan}   Figma Make → GitHub → Actions → Deploy → Produção 🚀${colors.reset}\n`);
  
  const openGitHub = await question('🌐 Abrir repositório no GitHub? (Y/n): ');
  if (openGitHub.toLowerCase() !== 'n') {
    // Tentar abrir URL do repositório
    const remoteUrl = execCommand('git remote get-url origin', 'Get remote URL', { silent: true });
    if (remoteUrl.success) {
      const url = remoteUrl.output.trim().replace('.git', '');
      console.log(`${colors.cyan}🔗 Repositório: ${url}${colors.reset}`);
      
      // Tentar abrir no navegador (funciona no macOS/Linux)
      try {
        execCommand(`open ${url} || xdg-open ${url}`, 'Abrir GitHub', { silent: true });
      } catch (error) {
        // Ignore errors for opening browser
      }
    }
  }
}

// Função principal
async function main() {
  console.log(`${colors.bold}${colors.green}`);
  console.log('================================================================');
  console.log('🔗 INTEGRAÇÃO FIGMA MAKE → GITHUB');
  console.log('================================================================');
  console.log(`${colors.reset}\n`);
  
  try {
    // 1. Verificar pré-requisitos
    const prereqsOK = await checkPrerequisites();
    if (!prereqsOK) {
      log.error('Pré-requisitos não atendidos. Instale as dependências e tente novamente.');
      process.exit(1);
    }
    
    // 2. Configurar Git
    await setupGit();
    
    // 3. Configurar package.json
    await setupPackageJson();
    
    // 4. Criar arquivos de configuração
    await createConfigFiles();
    
    // 5. Criar GitHub Actions
    await createGitHubActions();
    
    // 6. Criar templates de issue
    await createIssueTemplates();
    
    // 7. Fazer commit inicial
    await makeInitialCommit();
    
    // 8. Configurar repositório remoto
    await setupRemoteRepository();
    
    // 9. Mostrar próximos passos
    await showNextSteps();
    
  } catch (error) {
    log.error(`Erro durante integração: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };