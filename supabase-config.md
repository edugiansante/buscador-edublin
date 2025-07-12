# Configuração do Supabase

Este arquivo explica como configurar o Supabase para produção.

## Para Desenvolvimento Local

1. Crie um arquivo `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

2. Modifique o arquivo `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

## Para Figma Make (Browser)

Como o Figma Make roda no browser, use import.meta.env em vez de process.env:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-aqui'
```

## Configuração do Projeto Supabase

1. Vá para [supabase.com](https://supabase.com) e crie um novo projeto
2. Execute o SQL do arquivo `database/setup.sql` no SQL Editor
3. Configure a autenticação em Authentication > Settings
4. Configure as URLs de redirecionamento

## Políticas RLS

As políticas de Row Level Security estão incluídas no setup.sql e garantem que:

- Usuários só podem ver seus próprios dados
- Perfis públicos são visíveis apenas para usuários autenticados
- Apenas usuários verificados aparecem nos resultados de busca
- Dados sensíveis são protegidos

## Status Atual

🔄 **Demo Mode**: Atualmente usando dados mock para demonstração
🚀 **Production Ready**: Pronto para conectar ao Supabase real com configuração mínima