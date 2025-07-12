/**
 * 🛠️ Script de Setup de Deploy
 * 
 * Configura automaticamente os arquivos necessários para deploy
 * em diferentes provedores (Vercel, Netlify, Docker, etc.)
 * 
 * Uso: node scripts/setup-deploy.js [provider]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { 
  vercelConfig, 
  netlifyConfig, 
  githubActionsConfig, 
  dockerConfig 
} = require('../deploy.config.js');

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

const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Setup específico para cada provedor
async function setupVercel() {
  log.title('🔺 CONFIGURANDO VERCEL');
  
  // 1. Criar vercel.json
  log.step('Criando vercel.json...');
  const vercelJsonPath = 'vercel.json';
  
  if (fileExists(vercelJsonPath)) {
    const overwrite = await question('vercel.json já existe. Sobrescrever? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Mantendo vercel.json existente');
    } else {
      writeFile(vercelJsonPath, JSON.stringify(vercelConfig.vercelJson, null, 2));
      log.success('vercel.json criado');
    }
  } else {
    writeFile(vercelJsonPath, JSON.stringify(vercelConfig.vercelJson, null, 2));
    log.success('vercel.json criado');
  }
  
  // 2. Criar script de deploy
  log.step('Criando script de deploy...');
  writeFile('scripts/deploy-vercel.sh', vercelConfig.deployScript);
  
  // Tornar executável
  try {
    fs.chmodSync('scripts/deploy-vercel.sh', '755');
    log.success('Script de deploy criado: scripts/deploy-vercel.sh');
  } catch (error) {
    log.warning('Não foi possível tornar o script executável');
  }
  
  // 3. Atualizar package.json
  log.step('Atualizando package.json...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts) packageJson.scripts = {};
    packageJson.scripts['deploy:vercel'] = 'bash scripts/deploy-vercel.sh';
    packageJson.scripts['vercel:dev'] = 'vercel dev';
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    log.success('Scripts adicionados ao package.json');
  } catch (error) {
    log.error('Erro ao atualizar package.json');
  }
  
  // 4. Instruções
  console.log(`\n${colors.cyan}📋 PRÓXIMOS PASSOS PARA VERCEL:${colors.reset}`);
  console.log(`${colors.yellow}1. Instale o Vercel CLI: npm i -g vercel${colors.reset}`);
  console.log(`${colors.yellow}2. Faça login: vercel login${colors.reset}`);
  console.log(`${colors.yellow}3. Configure variáveis de ambiente:${colors.reset}`);
  console.log(`${colors.cyan}   vercel env add VITE_SUPABASE_URL production${colors.reset}`);
  console.log(`${colors.cyan}   vercel env add VITE_SUPABASE_ANON_KEY production${colors.reset}`);
  console.log(`${colors.cyan}   vercel env add VITE_SITE_URL production${colors.reset}`);
  console.log(`${colors.yellow}4. Deploy: npm run deploy:vercel${colors.reset}`);
}

async function setupNetlify() {
  log.title('🟢 CONFIGURANDO NETLIFY');
  
  // 1. Criar netlify.toml
  log.step('Criando netlify.toml...');
  const netlifyTomlPath = 'netlify.toml';
  
  if (fileExists(netlifyTomlPath)) {
    const overwrite = await question('netlify.toml já existe. Sobrescrever? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Mantendo netlify.toml existente');
    } else {
      writeFile(netlifyTomlPath, netlifyConfig.netlifyToml);
      log.success('netlify.toml criado');
    }
  } else {
    writeFile(netlifyTomlPath, netlifyConfig.netlifyToml);
    log.success('netlify.toml criado');
  }
  
  // 2. Criar _redirects como backup
  log.step('Criando arquivo _redirects...');
  const redirectsContent = [
    '/auth/callback /auth/confirm 302',
    '/api/* /.netlify/functions/:splat 200',
    '/* /index.html 200'
  ].join('\n');
  
  writeFile('public/_redirects', redirectsContent);
  log.success('Arquivo _redirects criado');
  
  // 3. Criar script de deploy
  log.step('Criando script de deploy...');
  writeFile('scripts/deploy-netlify.sh', netlifyConfig.deployScript);
  
  // Tornar executável
  try {
    fs.chmodSync('scripts/deploy-netlify.sh', '755');
    log.success('Script de deploy criado: scripts/deploy-netlify.sh');
  } catch (error) {
    log.warning('Não foi possível tornar o script executável');
  }
  
  // 4. Atualizar package.json
  log.step('Atualizando package.json...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts) packageJson.scripts = {};
    packageJson.scripts['deploy:netlify'] = 'bash scripts/deploy-netlify.sh';
    packageJson.scripts['netlify:dev'] = 'netlify dev';
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    log.success('Scripts adicionados ao package.json');
  } catch (error) {
    log.error('Erro ao atualizar package.json');
  }
  
  // 5. Instruções
  console.log(`\n${colors.cyan}📋 PRÓXIMOS PASSOS PARA NETLIFY:${colors.reset}`);
  console.log(`${colors.yellow}1. Instale o Netlify CLI: npm i -g netlify-cli${colors.reset}`);
  console.log(`${colors.yellow}2. Faça login: netlify login${colors.reset}`);
  console.log(`${colors.yellow}3. Conecte o site: netlify init${colors.reset}`);
  console.log(`${colors.yellow}4. Configure variáveis de ambiente no dashboard${colors.reset}`);
  console.log(`${colors.yellow}5. Deploy: npm run deploy:netlify${colors.reset}`);
}

async function setupGitHubActions() {
  log.title('🐙 CONFIGURANDO GITHUB ACTIONS');
  
  // 1. Criar diretório .github/workflows
  log.step('Criando workflow do GitHub Actions...');
  const workflowPath = '.github/workflows/deploy.yml';
  
  if (fileExists(workflowPath)) {
    const overwrite = await question('Workflow já existe. Sobrescrever? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Mantendo workflow existente');
      return;
    }
  }
  
  writeFile(workflowPath, githubActionsConfig.workflow);
  log.success('Workflow criado: .github/workflows/deploy.yml');
  
  // 2. Instruções
  console.log(`\n${colors.cyan}📋 PRÓXIMOS PASSOS PARA GITHUB ACTIONS:${colors.reset}`);
  console.log(`${colors.yellow}1. Configure secrets no repositório GitHub:${colors.reset}`);
  console.log(`${colors.cyan}   Settings → Secrets and variables → Actions${colors.reset}`);
  console.log(`${colors.yellow}2. Adicione os seguintes secrets:${colors.reset}`);
  console.log(`${colors.cyan}   - VITE_SUPABASE_URL${colors.reset}`);
  console.log(`${colors.cyan}   - VITE_SUPABASE_ANON_KEY${colors.reset}`);
  console.log(`${colors.cyan}   - VITE_SITE_URL${colors.reset}`);
  console.log(`${colors.cyan}   - VERCEL_TOKEN (se usando Vercel)${colors.reset}`);
  console.log(`${colors.cyan}   - NETLIFY_AUTH_TOKEN (se usando Netlify)${colors.reset}`);
  console.log(`${colors.yellow}3. Faça push para a branch main para ativar${colors.reset}`);
}

async function setupDocker() {
  log.title('🐳 CONFIGURANDO DOCKER');
  
  // 1. Criar Dockerfile
  log.step('Criando Dockerfile...');
  if (fileExists('Dockerfile')) {
    const overwrite = await question('Dockerfile já existe. Sobrescrever? (y/N): ');
    if (overwrite.toLowerCase() === 'y') {
      writeFile('Dockerfile', dockerConfig.dockerfile);
      log.success('Dockerfile criado');
    }
  } else {
    writeFile('Dockerfile', dockerConfig.dockerfile);
    log.success('Dockerfile criado');
  }
  
  // 2. Criar nginx.conf
  log.step('Criando nginx.conf...');
  writeFile('nginx.conf', dockerConfig.nginxConfig);
  log.success('nginx.conf criado');
  
  // 3. Criar docker-compose.yml
  log.step('Criando docker-compose.yml...');
  if (fileExists('docker-compose.yml')) {
    const overwrite = await question('docker-compose.yml já existe. Sobrescrever? (y/N): ');
    if (overwrite.toLowerCase() === 'y') {
      writeFile('docker-compose.yml', dockerConfig.dockerCompose);
      log.success('docker-compose.yml criado');
    }
  } else {
    writeFile('docker-compose.yml', dockerConfig.dockerCompose);
    log.success('docker-compose.yml criado');
  }
  
  // 4. Criar .dockerignore
  log.step('Criando .dockerignore...');
  const dockerignoreContent = [
    'node_modules',
    'npm-debug.log*',
    '.npm',
    '.nyc_output',
    '.coverage',
    '.git',
    '.gitignore',
    'README.md',
    '.env*',
    '.DS_Store',
    'Thumbs.db'
  ].join('\n');
  
  writeFile('.dockerignore', dockerignoreContent);
  log.success('.dockerignore criado');
  
  // 5. Atualizar package.json
  log.step('Atualizando package.json...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts) packageJson.scripts = {};
    packageJson.scripts['docker:build'] = 'docker build -t edublin .';
    packageJson.scripts['docker:run'] = 'docker run -p 3000:80 edublin';
    packageJson.scripts['docker:compose'] = 'docker-compose up -d';
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    log.success('Scripts Docker adicionados ao package.json');
  } catch (error) {
    log.error('Erro ao atualizar package.json');
  }
  
  // 6. Instruções
  console.log(`\n${colors.cyan}📋 PRÓXIMOS PASSOS PARA DOCKER:${colors.reset}`);
  console.log(`${colors.yellow}1. Build da imagem: npm run docker:build${colors.reset}`);
  console.log(`${colors.yellow}2. Executar container: npm run docker:run${colors.reset}`);
  console.log(`${colors.yellow}3. Ou usar docker-compose: npm run docker:compose${colors.reset}`);
  console.log(`${colors.yellow}4. Acesse: http://localhost:3000${colors.reset}`);
}

// Menu interativo
async function showMenu() {
  console.log(`\n${colors.bold}${colors.cyan}🛠️  SETUP DE DEPLOY - EDUBLIN${colors.reset}\n`);
  
  console.log('Escolha o provedor de deploy:');
  console.log(`${colors.cyan}1.${colors.reset} Vercel`);
  console.log(`${colors.cyan}2.${colors.reset} Netlify`);
  console.log(`${colors.cyan}3.${colors.reset} GitHub Actions`);
  console.log(`${colors.cyan}4.${colors.reset} Docker`);
  console.log(`${colors.cyan}5.${colors.reset} Todos`);
  console.log(`${colors.cyan}0.${colors.reset} Sair`);
  
  const choice = await question('\nDigite sua escolha (1-5): ');
  
  switch (choice) {
    case '1':
      await setupVercel();
      break;
    case '2':
      await setupNetlify();
      break;
    case '3':
      await setupGitHubActions();
      break;
    case '4':
      await setupDocker();
      break;
    case '5':
      await setupVercel();
      await setupNetlify();
      await setupGitHubActions();
      await setupDocker();
      log.success('Todos os provedores configurados!');
      break;
    case '0':
      log.info('Saindo...');
      process.exit(0);
      break;
    default:
      log.error('Escolha inválida');
      await showMenu();
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const provider = args[0];
  
  if (provider) {
    // Modo não-interativo
    switch (provider.toLowerCase()) {
      case 'vercel':
        await setupVercel();
        break;
      case 'netlify':
        await setupNetlify();
        break;
      case 'github':
      case 'actions':
        await setupGitHubActions();
        break;
      case 'docker':
        await setupDocker();
        break;
      case 'all':
        await setupVercel();
        await setupNetlify();
        await setupGitHubActions();
        await setupDocker();
        break;
      default:
        log.error(`Provedor não reconhecido: ${provider}`);
        log.info('Provedores disponíveis: vercel, netlify, github, docker, all');
        process.exit(1);
    }
  } else {
    // Modo interativo
    await showMenu();
  }
  
  console.log(`\n${colors.green}✅ Setup concluído!${colors.reset}`);
  console.log(`\n${colors.cyan}📚 Próximos passos:${colors.reset}`);
  console.log(`${colors.yellow}1. Configure suas variáveis de ambiente${colors.reset}`);
  console.log(`${colors.yellow}2. Execute: node scripts/verify-migration.js${colors.reset}`);
  console.log(`${colors.yellow}3. Execute: node scripts/deploy-production.js${colors.reset}`);
  
  rl.close();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log.error(`Erro: ${error.message}`);
    rl.close();
    process.exit(1);
  });
}

module.exports = { 
  setupVercel, 
  setupNetlify, 
  setupGitHubActions, 
  setupDocker 
};