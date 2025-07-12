/**
 * Script de Verificação de Migração Demo → Produção
 * 
 * Execute este script para verificar se a migração foi bem-sucedida
 * 
 * Uso: node scripts/verify-migration.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`)
};

// Verificar se arquivo existe
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

// Ler arquivo .env
const readEnvFile = () => {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fileExists(envPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    log.error(`Erro ao ler .env: ${error.message}`);
    return null;
  }
};

// Verificar URL
const checkUrl = (url) => {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      resolve({
        success: response.statusCode >= 200 && response.statusCode < 400,
        status: response.statusCode,
        headers: response.headers
      });
    });
    
    request.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    request.setTimeout(5000, () => {
      resolve({
        success: false,
        error: 'Timeout'
      });
    });
  });
};

// Verificar Supabase API
const checkSupabaseApi = async (url, apiKey) => {
  const apiUrl = `${url}/rest/v1/`;
  
  return new Promise((resolve) => {
    const options = {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const request = https.get(apiUrl, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          success: response.statusCode >= 200 && response.statusCode < 400,
          status: response.statusCode,
          response: data
        });
      });
    });
    
    request.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    request.setTimeout(5000, () => {
      resolve({
        success: false,
        error: 'Timeout'
      });
    });
  });
};

// Função principal de verificação
async function verifyMigration() {
  console.log(`\n${colors.cyan}🚀 Verificação de Migração Demo → Produção${colors.reset}\n`);
  
  let allChecksPass = true;
  const issues = [];
  
  // 1. Verificar arquivo .env
  log.step('Verificando arquivo .env...');
  const env = readEnvFile();
  
  if (!env) {
    log.error('Arquivo .env não encontrado');
    log.info('Execute: cp .env.example .env');
    allChecksPass = false;
    issues.push('Arquivo .env ausente');
  } else {
    log.success('Arquivo .env encontrado');
    
    // Verificar variáveis obrigatórias
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    requiredVars.forEach(varName => {
      if (!env[varName] || env[varName].trim() === '') {
        log.error(`Variável ${varName} não definida`);
        allChecksPass = false;
        issues.push(`Variável ${varName} ausente`);
      } else if (env[varName].includes('SEU_PROJECT_ID') || env[varName].includes('your-project-id')) {
        log.warning(`Variável ${varName} contém placeholder - substitua pelos valores reais`);
        allChecksPass = false;
        issues.push(`Variável ${varName} com placeholder`);
      } else {
        log.success(`Variável ${varName} configurada`);
      }
    });
  }
  
  // 2. Verificar conectividade Supabase
  if (env && env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
    log.step('Testando conectividade com Supabase...');
    
    // Verificar URL base
    const urlCheck = await checkUrl(env.VITE_SUPABASE_URL);
    if (urlCheck.success) {
      log.success('URL do Supabase acessível');
    } else {
      log.error(`URL do Supabase inacessível: ${urlCheck.error || urlCheck.status}`);
      allChecksPass = false;
      issues.push('URL Supabase inacessível');
    }
    
    // Verificar API
    const apiCheck = await checkSupabaseApi(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
    if (apiCheck.success) {
      log.success('API do Supabase funcionando');
    } else {
      log.error(`API do Supabase com problemas: ${apiCheck.error || apiCheck.status}`);
      allChecksPass = false;
      issues.push('API Supabase com problemas');
    }
  }
  
  // 3. Verificar arquivos essenciais
  log.step('Verificando arquivos essenciais...');
  
  const essentialFiles = [
    'database/setup.sql',
    'lib/supabase.ts',
    'lib/auth.ts',
    'lib/search.ts'
  ];
  
  essentialFiles.forEach(file => {
    if (fileExists(file)) {
      log.success(`Arquivo ${file} presente`);
    } else {
      log.error(`Arquivo ${file} ausente`);
      allChecksPass = false;
      issues.push(`Arquivo ${file} ausente`);
    }
  });
  
  // 4. Verificar package.json
  log.step('Verificando dependências...');
  
  if (fileExists('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredDeps = [
        '@supabase/supabase-js',
        'react',
        'typescript'
      ];
      
      requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          log.success(`Dependência ${dep} instalada`);
        } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          log.success(`Dependência ${dep} instalada (dev)`);
        } else {
          log.warning(`Dependência ${dep} não encontrada`);
          issues.push(`Dependência ${dep} ausente`);
        }
      });
    } catch (error) {
      log.error(`Erro ao ler package.json: ${error.message}`);
      allChecksPass = false;
      issues.push('package.json inválido');
    }
  } else {
    log.error('package.json não encontrado');
    allChecksPass = false;
    issues.push('package.json ausente');
  }
  
  // 5. Verificar estrutura de diretórios
  log.step('Verificando estrutura de diretórios...');
  
  const requiredDirs = [
    'components',
    'lib',
    'database',
    'styles'
  ];
  
  requiredDirs.forEach(dir => {
    if (fileExists(dir)) {
      log.success(`Diretório ${dir} presente`);
    } else {
      log.error(`Diretório ${dir} ausente`);
      allChecksPass = false;
      issues.push(`Diretório ${dir} ausente`);
    }
  });
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  
  if (allChecksPass) {
    log.success('🎉 MIGRAÇÃO VERIFICADA COM SUCESSO!');
    console.log(`${colors.green}
✅ Sua aplicação está configurada para produção!

Próximos passos:
1. Execute o setup do banco: database/setup.sql no Supabase
2. Teste criação de usuário na aplicação
3. Verifique se emails de confirmação chegam
4. Faça deploy em produção
${colors.reset}`);
  } else {
    log.error('❌ MIGRAÇÃO INCOMPLETA - PROBLEMAS ENCONTRADOS');
    console.log(`${colors.red}
Problemas encontrados:${colors.reset}`);
    
    issues.forEach(issue => {
      console.log(`${colors.red}  • ${issue}${colors.reset}`);
    });
    
    console.log(`${colors.yellow}
📋 AÇÕES NECESSÁRIAS:

1. Corrija os problemas listados acima
2. Execute novamente: node scripts/verify-migration.js
3. Consulte o MIGRATION_GUIDE.md para mais detalhes
${colors.reset}`);
  }
  
  console.log('='.repeat(50) + '\n');
  
  return allChecksPass;
}

// Executar verificação
if (require.main === module) {
  verifyMigration().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log.error(`Erro durante verificação: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { verifyMigration };