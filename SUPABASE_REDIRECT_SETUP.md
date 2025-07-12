# 🔧 Configuração de URLs de Redirect no Supabase

## ⚠️ IMPORTANTE: URLs de Email Ainda Apontam para Localhost

Para corrigir os emails de confirmação que chegam com `http://localhost:3000/#access_token=`, você precisa configurar as URLs corretas no Dashboard do Supabase.

## 📍 Onde Configurar

### 1. **Acesse o Supabase Dashboard**
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **URL Configuration**

### 2. **Configure as URLs de Redirect**

#### **Site URL (URL Principal)**
```
https://[SEU-DOMINIO-FIGMA-MAKE]
```
*Exemplo: `https://figma-make-app.vercel.app`*

#### **Redirect URLs (URLs de Redirecionamento)**
Adicione todas essas URLs:

```
https://[SEU-DOMINIO-FIGMA-MAKE]/#type=email_confirmation&action=confirmed
https://[SEU-DOMINIO-FIGMA-MAKE]/#type=recovery&action=password_reset
https://[SEU-DOMINIO-FIGMA-MAKE]/
https://[SEU-DOMINIO-FIGMA-MAKE]
```

**Para Figma Make, provavelmente será algo como:**
```
https://figma-make-app.vercel.app/#type=email_confirmation&action=confirmed
https://figma-make-app.vercel.app/#type=recovery&action=password_reset
https://figma-make-app.vercel.app/
https://figma-make-app.vercel.app
```

## 🔍 Como Descobrir Seu Domínio

### **Método 1: Console do Browser**
1. Abra a aplicação no browser
2. Pressione F12 (DevTools)
3. No Console, digite: `window.location.origin`
4. Use o resultado mostrado

### **Método 2: Verificar Logs da Aplicação**
A aplicação agora mostra logs detalhados no console:
```
Environment Info: {
  "baseUrl": "https://seu-dominio-aqui",
  "isProduction": true,
  "confirmationUrl": "https://seu-dominio-aqui/#type=email_confirmation&action=confirmed"
}
```

### **Método 3: Verificar URL Atual**
A URL que você está vendo no browser é o domínio que deve ser usado.

## 📧 Configuração de Email Templates (Opcional)

### **Email de Confirmação**
No Supabase Dashboard, vá em **Authentication** > **Email Templates** > **Confirm signup**

Substitua o link padrão por:
```html
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

### **Reset de Senha**
Em **Authentication** > **Email Templates** > **Reset Password**

Substitua o link padrão por:
```html
<a href="{{ .ConfirmationURL }}">Redefinir Senha</a>
```

## 🧪 Como Testar

### **1. Teste de Cadastro**
1. Cadastre um novo usuário na aplicação
2. Verifique o email recebido
3. O link deve apontar para seu domínio, não localhost

### **2. Verificar Logs**
Abra o Console do browser e procure por:
```
Detected base URL (client): https://seu-dominio
Email confirmation redirect URL: https://seu-dominio/#type=email_confirmation&action=confirmed
```

### **3. Teste de Confirmação**
1. Clique no link do email
2. Deve redirecionar para a aplicação
3. Deve mostrar a tela de confirmação de email
4. Após confirmação, deve logar automaticamente

## 🚨 Problemas Comuns

### **URLs Ainda Apontam para Localhost**
- ✅ Verifique se salvou as configurações no Supabase
- ✅ Aguarde alguns minutos para propagar
- ✅ Teste com um novo cadastro

### **Erro "Invalid Redirect URL"**
- ✅ Certifique-se que a URL está exata na lista de Redirect URLs
- ✅ Inclua as URLs com e sem barra final (`/`)
- ✅ Inclua as URLs com hash fragments

### **Email Não Chega**
- ✅ Verifique spam/lixo eletrônico
- ✅ Teste com diferentes provedores de email
- ✅ Verifique logs no Supabase Dashboard

## 🔄 Fluxo Completo Corrigido

1. **Usuário se cadastra** → Email enviado com URL correta
2. **Usuário clica no link** → Redireciona para aplicação
3. **Aplicação detecta hash** → Mostra tela de confirmação
4. **Supabase confirma email** → Marca usuário como verificado
5. **Usuário é logado** → Redirecionado para home

## 📋 Checklist de Configuração

- [ ] Site URL configurada no Supabase
- [ ] Redirect URLs adicionadas (todas as variações)
- [ ] Logs da aplicação mostram URLs corretas
- [ ] Teste de cadastro realizado
- [ ] Email recebido com URL correta
- [ ] Confirmação funcionando
- [ ] Login automático após confirmação

## 🆘 Se Ainda Não Funcionar

1. **Limpe o cache** do browser
2. **Teste em aba anônima**
3. **Verifique se todas as URLs estão salvas** no Supabase
4. **Aguarde 5-10 minutos** para propagação
5. **Teste com email diferente**

---

**✅ Após configurar corretamente, os emails devem apontar para seu domínio de produção!**