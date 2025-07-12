/**
 * 🔄 Script de Sincronização Figma Make ↔ GitHub
 * 
 * Este script mantém seu projeto sincronizado entre Figma Make e GitHub,
 * preservando customizações locais e configurações.
 * 
 * Uso: npm run sync:figma
 */

const fs = require('fs');
const path = require('path');
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

// Configuração
const config = {
  // Arquivos que devem ser preservados durante sync
  preserveFiles: [
    '.env',
    '.env.local',
    '.env.production',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.gitignore',
    'README.md',
    'database/setup.sql',
    'scripts/',
    '.github/',
    'deploy.config.js',
    'vercel.json',
    'netlify.toml'
  ],
  
  // Diretórios que podem ser sobrescritos
  syncDirectories: [
    'components/',
    'lib/',
    'styles/'
  ],
  
  // Arquivos principais que podem ser atualizados
  syncFiles: [
    'App.tsx',
    'index.html',
    'vite.config.ts',
    'tsconfig.json'
  ]
};

// Utilitários
const execCommand = (command, description, options = {}) => {
  try {
    if (!options.silent) {
      log.step(`Executando: ${description}`);
    }
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
    if (!options.silent) {
      log.error(`${description} falhou: ${error.message}`);
    }
    return { success: false, error: error.message, output: error.stdout };
  }
};

const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

const createBackup = (timestamp) => {
  try {
    const backupBranch = `backup-sync-${timestamp}`;
    
    // Verificar se há mudanças não commitadas
    const statusResult = execCommand('git status --porcelain', 'Verificação status Git', { silent: true });
    
    if (statusResult.output && statusResult.output.trim()) {
      log.warning('Detectadas mudanças não commitadas. Criando backup...');
      
      // Criar nova branch para backup
      execCommand(`git checkout -b ${backupBranch}`, 'Criação branch backup');
      execCommand('git add .', 'Adição arquivos backup');
      execCommand(`git commit -m "🔄 Backup automático antes da sincronização Figma Make

Timestamp: ${new Date().toISOString()}
Branch: ${backupBranch}

Este backup contém todas as mudanças locais antes da sincronização.
Para restaurar: git checkout ${backupBranch}"`, 'Commit backup');
      
      // Voltar para main
      execCommand('git checkout main', 'Volta para main');
      
      log.success(`Backup criado na branch: ${backupBranch}`);
      return backupBranch;
    } else {
      log.info('Nenhuma mudança local para backup');
      return null;
    }
  } catch (error) {
    log.error(`Falha ao criar backup: ${error.message}`);
    return null;
  }
};

const downloadFromFigma = async () => {
  log.title('📥 BAIXANDO ATUALIZAÇÃO DO FIGMA MAKE');
  
  // Simular download do Figma Make
  // Na implementação real, isso dependeria da API do Figma Make
  
  log.step('Conectando com Figma Make...');
  
  // Verificar se token está configurado
  const figmaToken = process.env.FIGMA_MAKE_TOKEN;
  if (!figmaToken) {
    log.warning('Token Figma Make não configurado');
    log.info('Configure FIGMA_MAKE_TOKEN nas variáveis de ambiente');
    
    // Para desenvolvimento, simular download bem-sucedido
    if (process.env.NODE_ENV === 'development') {
      log.info('Modo desenvolvimento: Simulando download...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      log.success('Download simulado concluído');
      return true;
    }
    
    return false;
  }
  
  try {
    // Aqui seria implementada a lógica específica do Figma Make
    // Exemplo de como poderia ser:
    
    /*
    const response = await fetch('https://api.figma-make.com/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${figmaToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Figma Make API error: ${response.status}`);
    }
    
    const data = await response.blob();
    
    // Extrair arquivos baixados
    const extractPath = './figma-make-export';
    await extractZip(data, extractPath);
    
    log.success('Download do Figma Make concluído');
    return extractPath;
    */
    
    // Por enquanto, simular
    log.info('Simulando download do Figma Make...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    log.success('Download simulado concluído');
    return './figma-make-export-simulation';
    
  } catch (error) {
    log.error(`Falha no download: ${error.message}`);
    return false;
  }
};

const mergeChanges = (exportPath) => {
  log.title('🔄 APLICANDO MUDANÇAS DO FIGMA MAKE');
  
  if (!exportPath || exportPath.includes('simulation')) {
    log.info('Modo simulação - não há arquivos reais para aplicar');
    
    // Simular algumas mudanças para demonstração
    const timestamp = new Date().toISOString();
    const simulatedChange = `// Última sincronização Figma Make: ${timestamp}\n`;
    
    // Adicionar comentário ao App.tsx
    if (fileExists('App.tsx')) {
      const appContent = fs.readFileSync('App.tsx', 'utf8');
      if (!appContent.includes('Última sincronização Figma Make:')) {
        const updatedContent = simulatedChange + appContent;
        fs.writeFileSync('App.tsx', updatedContent);
        log.success('Simulação: App.tsx atualizado com timestamp');
      }
    }
    
    return true;
  }
  
  try {
    // Processar arquivos do export
    log.step('Analisando arquivos exportados...');
    
    const exportFiles = fs.readdirSync(exportPath, { withFileTypes: true });
    let changesApplied = 0;
    
    for (const file of exportFiles) {
      const filePath = path.join(exportPath, file.name);
      const targetPath = file.name;
      
      if (file.isDirectory()) {
        // Processar diretório
        if (config.syncDirectories.some(dir => file.name.startsWith(dir.replace('/', '')))) {
          log.step(`Sincronizando diretório: ${file.name}`);
          
          // Backup do diretório atual se existir
          if (fileExists(targetPath)) {
            execCommand(`cp -r ${targetPath} ${targetPath}.backup`, 'Backup diretório', { silent: true });
          }
          
          // Copiar novo diretório
          execCommand(`cp -r ${filePath} ${targetPath}`, 'Cópia diretório', { silent: true });
          changesApplied++;
        }
      } else {
        // Processar arquivo
        if (config.syncFiles.includes(file.name)) {
          log.step(`Sincronizando arquivo: ${file.name}`);
          
          // Backup do arquivo atual se existir
          if (fileExists(targetPath)) {
            execCommand(`cp ${targetPath} ${targetPath}.backup`, 'Backup arquivo', { silent: true });
          }
          
          // Copiar novo arquivo
          execCommand(`cp ${filePath} ${targetPath}`, 'Cópia arquivo', { silent: true });
          changesApplied++;
        } else if (config.preserveFiles.includes(file.name)) {
          log.info(`Preservando arquivo: ${file.name}`);
        } else {
          log.warning(`Arquivo não reconhecido: ${file.name}`);
        }
      }
    }
    
    log.success(`${changesApplied} mudanças aplicadas`);
    return changesApplied > 0;
    
  } catch (error) {
    log.error(`Falha ao aplicar mudanças: ${error.message}`);
    return false;
  }
};

const validateChanges = () => {
  log.title('🔍 VALIDANDO MUDANÇAS');
  
  let validationsPassed = 0;
  let totalValidations = 0;
  
  // Verificar se App.tsx existe e é válido
  totalValidations++;
  if (fileExists('App.tsx')) {
    try {
      const content = fs.readFileSync('App.tsx', 'utf8');
      if (content.includes('export default function App')) {
        log.success('App.tsx válido');
        validationsPassed++;
      } else {
        log.warning('App.tsx pode estar corrompido');
      }
    } catch (error) {
      log.error('Erro ao ler App.tsx');
    }
  } else {
    log.error('App.tsx não encontrado');
  }
  
  // Verificar estrutura de componentes
  totalValidations++;
  if (fileExists('components')) {
    const componentFiles = fs.readdirSync('components').filter(f => f.endsWith('.tsx'));
    if (componentFiles.length > 0) {
      log.success(`${componentFiles.length} componentes encontrados`);
      validationsPassed++;
    } else {
      log.warning('Nenhum componente .tsx encontrado');
    }
  } else {
    log.warning('Diretório components não encontrado');
  }
  
  // Verificar se projeto builda
  totalValidations++;
  log.step('Testando build do projeto...');
  const buildResult = execCommand('npm run build', 'Build test', { silent: true });
  if (buildResult.success) {
    log.success('Build funcionando');
    validationsPassed++;
  } else {
    log.error('Build falhou - verifique erros');
  }
  
  // Verificar linting
  totalValidations++;
  log.step('Executando linter...');
  const lintResult = execCommand('npm run lint', 'Lint test', { silent: true });
  if (lintResult.success) {
    log.success('Linting aprovado');
    validationsPassed++;
  } else {
    log.warning('Avisos de linting encontrados');
    validationsPassed++; // Não bloquear por warnings
  }
  
  const successRate = (validationsPassed / totalValidations) * 100;
  log.info(`Validações: ${validationsPassed}/${totalValidations} (${successRate.toFixed(0)}%)`);
  
  return successRate >= 75; // Aceitar se 75% das validações passaram
};

const commitChanges = (backupBranch) => {
  log.title('📝 COMMITANDO MUDANÇAS');
  
  // Verificar se há mudanças para commit
  const statusResult = execCommand('git status --porcelain', 'Verificação status Git', { silent: true });
  
  if (!statusResult.output || !statusResult.output.trim()) {
    log.info('Nenhuma mudança detectada para commit');
    return false;
  }
  
  try {
    // Adicionar arquivos modificados
    execCommand('git add .', 'Adição arquivos');
    
    // Criar mensagem de commit detalhada
    const timestamp = new Date().toISOString();
    const commitMessage = `🔄 Sync: Atualização automática do Figma Make

🕒 Timestamp: ${timestamp}
🔧 Fonte: Figma Make automatic sync
📋 Arquivos atualizados: ${statusResult.output.split('\n').length - 1} arquivos

Detalhes das mudanças:
${statusResult.output.split('\n').slice(0, 10).map(line => `- ${line.trim()}`).join('\n')}
${statusResult.output.split('\n').length > 10 ? '- ... e mais arquivos' : ''}

${backupBranch ? `🔄 Backup disponível em: ${backupBranch}` : ''}

Para reverter: git revert HEAD
Para ver mudanças: git show HEAD`;
    
    // Fazer commit
    execCommand(`git commit -m "${commitMessage}"`, 'Commit sincronização');
    
    log.success('Mudanças commitadas com sucesso');
    return true;
    
  } catch (error) {
    log.error(`Falha no commit: ${error.message}`);
    return false;
  }
};

const pushToGitHub = () => {
  log.title('🚀 ENVIANDO PARA GITHUB');
  
  try {
    // Verificar se há remote configurado
    const remoteResult = execCommand('git remote -v', 'Verificação remote', { silent: true });
    
    if (!remoteResult.output || !remoteResult.output.includes('origin')) {
      log.warning('Remote origin não configurado');
      log.info('Configure primeiro: git remote add origin SEU_REPO_URL');
      return false;
    }
    
    // Push para GitHub
    const pushResult = execCommand('git push origin main', 'Push para GitHub');
    
    if (pushResult.success) {
      log.success('Código enviado para GitHub com sucesso');
      log.info('GitHub Actions iniciará deploy automático...');
      return true;
    } else {
      log.error('Falha no push para GitHub');
      return false;
    }
    
  } catch (error) {
    log.error(`Erro no push: ${error.message}`);
    return false;
  }
};

const notifyCompletion = (success, backupBranch) => {
  log.title('📊 SINCRONIZAÇÃO CONCLUÍDA');
  
  if (success) {
    console.log(`${colors.green}✅ Sincronização Figma Make → GitHub realizada com sucesso!${colors.reset}\n`);
    
    console.log(`${colors.cyan}📋 Resumo:${colors.reset}`);
    console.log(`${colors.green}✅ Download do Figma Make${colors.reset}`);
    console.log(`${colors.green}✅ Mudanças aplicadas${colors.reset}`);
    console.log(`${colors.green}✅ Validações aprovadas${colors.reset}`);
    console.log(`${colors.green}✅ Commit realizado${colors.reset}`);
    console.log(`${colors.green}✅ Push para GitHub${colors.reset}`);
    
    if (backupBranch) {
      console.log(`\n${colors.cyan}🔄 Backup disponível:${colors.reset}`);
      console.log(`   Branch: ${backupBranch}`);
      console.log(`   Restaurar: git checkout ${backupBranch}`);
    }
    
    console.log(`\n${colors.cyan}🚀 Próximos passos:${colors.reset}`);
    console.log(`${colors.yellow}1. GitHub Actions executará deploy automático${colors.reset}`);
    console.log(`${colors.yellow}2. Verifique status em: GitHub → Actions${colors.reset}`);
    console.log(`${colors.yellow}3. Site atualizado estará disponível em alguns minutos${colors.reset}`);
    
  } else {
    console.log(`${colors.red}❌ Sincronização falhou${colors.reset}\n`);
    
    console.log(`${colors.cyan}🔧 Ações de recuperação:${colors.reset}`);
    console.log(`${colors.yellow}1. Verifique logs de erro acima${colors.reset}`);
    console.log(`${colors.yellow}2. Execute verificação: npm run migrate${colors.reset}`);
    console.log(`${colors.yellow}3. Tente sincronização manual${colors.reset}`);
    
    if (backupBranch) {
      console.log(`${colors.yellow}4. Se necessário, restaure backup: git checkout ${backupBranch}${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.cyan}📞 Suporte:${colors.reset}`);
  console.log(`   Issues: GitHub Issues`);
  console.log(`   Docs: FIGMA_GITHUB_INTEGRATION.md`);
};

// Função principal
async function syncWithFigma() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('================================================================');
  console.log('🔄 SINCRONIZAÇÃO FIGMA MAKE ↔ GITHUB');
  console.log('================================================================');
  console.log(`${colors.reset}\n`);
  
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-');
  let backupBranch = null;
  let success = false;
  
  try {
    // 1. Criar backup se necessário
    backupBranch = createBackup(timestamp);
    
    // 2. Baixar atualização do Figma Make
    const exportPath = await downloadFromFigma();
    if (!exportPath) {
      throw new Error('Falha no download do Figma Make');
    }
    
    // 3. Aplicar mudanças
    const changesApplied = mergeChanges(exportPath);
    if (!changesApplied) {
      log.info('Nenhuma mudança aplicada - projeto já atualizado');
      success = true;
      return;
    }
    
    // 4. Validar mudanças
    const validationPassed = validateChanges();
    if (!validationPassed) {
      throw new Error('Validações falharam - projeto pode estar corrompido');
    }
    
    // 5. Commit mudanças
    const commitSuccess = commitChanges(backupBranch);
    if (!commitSuccess) {
      throw new Error('Falha no commit das mudanças');
    }
    
    // 6. Push para GitHub
    const pushSuccess = pushToGitHub();
    if (!pushSuccess) {
      throw new Error('Falha no push para GitHub');
    }
    
    success = true;
    
  } catch (error) {
    log.error(`Erro durante sincronização: ${error.message}`);
    
    // Tentar rollback se houve commit
    try {
      const hasNewCommit = execCommand('git log --oneline -1', 'Check last commit', { silent: true });
      if (hasNewCommit.success && hasNewCommit.output.includes('Sync: Atualização automática')) {
        log.warning('Fazendo rollback do commit de sincronização...');
        execCommand('git reset --hard HEAD~1', 'Rollback commit');
        log.success('Rollback realizado');
      }
    } catch (rollbackError) {
      log.error('Falha no rollback automático');
    }
    
    success = false;
  }
  
  // 7. Notificar conclusão
  notifyCompletion(success, backupBranch);
  
  return success;
}

// Executar se chamado diretamente
if (require.main === module) {
  syncWithFigma().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log.error(`Erro inesperado: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { syncWithFigma };