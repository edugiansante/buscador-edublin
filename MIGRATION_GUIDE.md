# 🚀 Guia de Migração: Demo → Produção Real

Este guia explica como migrar sua aplicação Edublin do **modo demonstração** para **modo real** com dados persistentes no Supabase.

## 📋 Pré-requisitos

- [ ] Conta no [Supabase](https://supabase.com)
- [ ] Node.js instalado
- [ ] Acesso ao código da aplicação

## 🔧 Passo 1: Configurar Projeto Supabase

### 1.1 Criar Novo Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"New Project"**
3. Escolha um nome: `edublin-production`
4. Defina uma senha forte para o banco
5. Selecione uma região próxima aos seus usuários
6. Clique em **"Create Project"**

### 1.2 Obter Credenciais

Após o projeto ser criado:

1. Vá para **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://abcdefghijk.supabase.co`)
   - **Project API Key** (anon, public) - chave que começa com `eyJ...`

## 🔐 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Criar Arquivo .env

Na raiz do projeto, crie um arquivo `.env` (copie do `.env.example`):

```bash
# Copie o .env.example
cp .env.example .env
```

### 2.2 Preencher Credenciais

Edite o arquivo `.env` com suas credenciais:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration  
VITE_APP_NAME=Edublin
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# URLs (ajuste para seu domínio)
VITE_SITE_URL=https://seusite.com
VITE_API_URL=https://SEU_PROJECT_ID.supabase.co
```

### ⚠️ IMPORTANTE: Segurança

- **NUNCA** commite o arquivo `.env` para Git
- Use variáveis de ambiente no deploy (Vercel, Netlify, etc.)
- Mantenha as chaves seguras

## 🗄️ Passo 3: Setup do Banco de Dados

### 3.1 Executar Script SQL

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique em **"New Query"**
3. Copie e cole o conteúdo do arquivo `/database/setup.sql`
4. Clique em **"Run"** para executar

### 3.2 Verificar Tabelas

Após executar o script, verifique se as tabelas foram criadas:

1. Vá para **Table Editor**
2. Você deve ver as seguintes tabelas:
   - `users` - Usuários da plataforma
   - `search_criteria` - Critérios de busca
   - `user_matches` - Matches entre usuários
   - `user_reports` - Sistema de denúncias

### 3.3 Configurar RLS (Row-Level Security)

O script já configura RLS automaticamente, mas verifique:

1. Vá para **Authentication** → **Policies**
2. Confirme que existem políticas para todas as tabelas
3. Teste se usuários só veem seus próprios dados

## 🔄 Passo 4: Reset do Modo Demo

### 4.1 Limpar Storage Local

No navegador, abra as **Developer Tools** (F12):

```javascript
// Console do navegador
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage limpo');
```

### 4.2 Reset via Interface

Na aplicação:

1. Abra o **Debug Panel** (canto inferior direito)
2. Clique em **"Reset Circuit Breaker"**
3. Clique em **"Clear Demo Data"**
4. Recarregue a página

### 4.3 Reset Programático

Se necessário, você pode resetar via código:

```typescript
// Execute no console do navegador
AuthService.resetCircuitBreaker();
AuthService.clearDemoData();
location.reload();
```

## ✅ Passo 5: Verificar Migração

### 5.1 Testes de Funcionalidade

1. **Recarregue a aplicação**
2. **Verifique se o banner demo desapareceu**
3. **Crie uma conta real**:
   - Use seu email verdadeiro
   - Confirme no email recebido
4. **Teste funcionalidades**:
   - Fazer login/logout
   - Criar uma busca
   - Ver resultados
   - Contatar usuários

### 5.2 Verificar Dados no Supabase

1. No Supabase Dashboard → **Table Editor**
2. Verifique se os dados aparecem nas tabelas
3. Confirme que usuários são criados em `users`
4. Confirme que buscas são salvas em `search_criteria`

### 5.3 Monitorar Logs

1. Supabase Dashboard → **Logs**
2. Verifique se não há erros críticos
3. Monitore performance das queries

## 🚨 Troubleshooting

### Problema: Ainda está em modo demo

**Solução:**
```bash
# 1. Verificar .env
cat .env | grep VITE_SUPABASE

# 2. Restart do servidor
npm run dev

# 3. Limpar cache do navegador
Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
```

### Problema: Erro de conexão com Supabase

**Verificar:**
- [ ] URLs corretas no `.env`
- [ ] Chaves API válidas
- [ ] Projeto Supabase ativo
- [ ] Firewall/proxy não bloqueando

### Problema: Tabelas não existem

**Solução:**
1. Re-executar `/database/setup.sql`
2. Verificar se não há erros no SQL Editor
3. Confirmar permissões do usuário

### Problema: RLS bloqueando operações

**Debug:**
1. Supabase → **Authentication** → **Policies**
2. Temporariamente desabilitar RLS para testar
3. Verificar se políticas estão corretas

## 🔐 Passo 6: Configurar Autenticação

### 6.1 Configurar Redirects

No Supabase Dashboard:

1. **Authentication** → **URL Configuration**
2. **Site URL**: `https://seusite.com`
3. **Redirect URLs**: 
   - `https://seusite.com/auth/callback`
   - `https://seusite.com/auth/confirm`
   - `http://localhost:5173` (para desenvolvimento)

### 6.2 Configurar Email Templates

1. **Authentication** → **Email Templates**
2. Personalize os templates de:
   - Confirmação de email
   - Reset de senha
   - Convite de usuário

## 📧 Passo 7: Configurar Emails (Opcional)

### 7.1 SMTP Customizado

Para emails profissionais:

1. **Settings** → **Auth** → **SMTP Settings**
2. Configure seu provedor (Gmail, SendGrid, etc.)
3. Teste envio de emails

### 7.2 Template Personalizado

Edite os templates para incluir:
- Logo da sua empresa
- Cores do brand
- Mensagens personalizadas

## 🚀 Passo 8: Deploy em Produção

### 8.1 Variáveis de Ambiente no Deploy

**Vercel:**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... outras variáveis
```

**Netlify:**
1. Site Settings → Environment Variables
2. Adicionar todas as variáveis do `.env`

### 8.2 Configurar Domínio

1. Configure seu domínio customizado
2. Atualize as URLs no Supabase
3. Teste HTTPS e redirects

## 📊 Passo 9: Monitoramento

### 9.1 Analytics Supabase

1. **Reports** → **API**
2. Monitore usage e performance
3. Configure alertas se necessário

### 9.2 Logs de Aplicação

Adicione logging customizado:

```typescript
// lib/logger.ts
export const logEvent = (event: string, data?: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Enviar para serviço de analytics
    console.log(`[${event}]`, data);
  }
};
```

## ✅ Checklist Final

Antes de considerar a migração completa:

- [ ] ✅ Projeto Supabase configurado
- [ ] ✅ Variáveis de ambiente definidas
- [ ] ✅ Banco de dados criado com setup.sql
- [ ] ✅ RLS configurado e testado
- [ ] ✅ Demo mode desabilitado
- [ ] ✅ Cadastro de usuário real funcionando
- [ ] ✅ Login/logout funcionando
- [ ] ✅ Busca e matches funcionando
- [ ] ✅ WhatsApp integration funcionando
- [ ] ✅ Emails de confirmação chegando
- [ ] ✅ Deploy em produção realizado
- [ ] ✅ Domínio configurado
- [ ] ✅ SSL/HTTPS ativo
- [ ] ✅ Monitoramento configurado

## 🆘 Suporte

Se encontrar problemas:

1. **Consulte os logs** no Supabase Dashboard
2. **Debug Panel** na aplicação tem informações úteis
3. **Verifique o SETUP_GUIDE.md** para mais detalhes
4. **Issues no GitHub** do projeto

## 🎉 Parabéns!

Sua aplicação Edublin agora está em **modo produção real** com:

- ✅ Dados persistentes no Supabase
- ✅ Usuários reais com autenticação
- ✅ Sistema de busca e matches funcionando
- ✅ WhatsApp integration ativo
- ✅ Emails funcionando
- ✅ Pronto para usuários reais

**Próximos passos:**
- Marketing e aquisição de usuários
- Feedback e iteração
- Monitoramento e otimização
- Escalar conforme necessário

---

💚 **Boa sorte com seu projeto Edublin!** 💚