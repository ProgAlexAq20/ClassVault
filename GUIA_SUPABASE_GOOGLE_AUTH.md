# Guia de Configuração: Google Auth + Supabase

## 1. CONFIGURAÇÃO NO GOOGLE CLOUD

### 1.1 Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique no seletor de projetos (topo esquerdo)
3. Clique em "Novo Projeto"
4. Nome: `ClassVault` (ou seu projeto)
5. Clique em "Criar"
6. Aguarde a criação (pode levar 1-2 minutos)

### 1.2 Ativar OAuth 2.0 Consent Screen

1. No Cloud Console, vá para **APIs e Serviços** > **Consentimento OAuth**
2. Escolha **Externo** (para permitir qualquer conta Google)
3. Preencha:
   - **Nome do aplicativo**: ClassVault
   - **Email de suporte**: seu@email.com
   - **Email de contato do desenvolvedor**: seu@email.com
4. Clique "Salvar e continuar"

### 1.3 Configurar Credenciais OAuth 2.0

1. Vá para **APIs e Serviços** > **Credenciais**
2. Clique em **Criar Credenciais** > **ID do cliente OAuth 2.0**
3. Escolha **Aplicativo Web**
4. Preencha:
   - **Nome**: ClassVault Web
   - **URIs autorizados de JavaScript**:
     ```
     https://seu-projeto.supabase.co
     http://localhost:5173
     https://seu-dominio.com
     ```
   - **URIs de redirecionamento autorizados** (IMPORTANTE):
     ```
     https://seu-projeto.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     https://seu-dominio.com/auth/callback
     ```
5. Clique "Criar"
6. **Copie e guarde**:
   - **Client ID** (você usará no Supabase)
   - **Client Secret** (você usará no Supabase)

---

## 2. CONFIGURAÇÃO NO SUPABASE

### 2.1 Acessar Painel de Autenticação

1. Acesse seu projeto Supabase em [app.supabase.com](https://app.supabase.com)
2. Vá para **Authentication** > **Providers**
3. Procure por **Google**
4. Clique para expandir

### 2.2 Ativar Google OAuth

1. Ative a opção **Enable Sign in with Google**
2. Cole:
   - **Client ID**: do Google Cloud (da etapa 1.3)
   - **Client Secret**: do Google Cloud (da etapa 1.3)
3. Clique **Save**

### 2.3 Configurar Redirect URLs

1. Vá para **Authentication** > **URL Configuration**
2. Em **Redirect URLs**, adicione:
   ```
   http://localhost:5173/auth/callback
   https://seu-dominio.com/auth/callback
   ```
3. Clique **Save**

---

## 3. CONFIGURAÇÃO NO APLICATIVO

### 3.1 Variáveis de Ambiente (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key-aqui
VITE_APP_URL=http://localhost:5173  # para desenvolvimento

# Em produção:
# VITE_APP_URL=https://seu-dominio.com
```

### 3.2 Verificar Configuração do Cliente

O arquivo `src/shared/services/supabase.client.ts` já está configurado.

Verifique se `getAppUrl()` retorna a URL correta:

```typescript
// src/shared/services/supabase.client.ts
export function getAppUrl(): string {
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const basePath = pathname.startsWith('/ClassVault/') ? '/ClassVault' : '';
    return `${origin}${basePath}`;
  }
  return "";
}
```

### 3.3 Verificar Função de Sign-in com Google

O arquivo `src/modules/auth/store/auth.store.ts` contém:

```typescript
async signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getAppUrl()}/auth/callback`,
      },
    });
    if (error) throw error;
  } catch (err) {
    // tratamento de erro
  }
}
```

Certifique-se que `getAppUrl()` está sendo chamado corretamente.

---

## 4. PÁGINA DE CALLBACK

### 4.1 Verificar AuthCallbackPage

O arquivo `src/modules/auth/pages/AuthCallbackPage.tsx` deve:

1. Capturar parâmetros da URL
2. Processar o código de autenticação
3. Redirecionar após sucesso

```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/shared/services/supabase.client';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase processa automaticamente
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (data.session) {
          navigate('/dashboard');
        } else {
          setError('Falha na autenticação');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return <div>Processando autenticação...</div>;
}
```

---

## 5. RECEPÇÃO DE DADOS (Webhooks)

### 5.1 Configurar Webhooks no Supabase

Para receber notificações de mudanças nos dados:

1. Vá para **Database** > **Webhooks**
2. Clique **Create Webhook**
3. Configure:
   - **Nome**: `classvault-changes`
   - **Tabelas**: Selecione as tabelas a monitorar
     - classrooms
     - notes
     - files
     - tasks
     - events
     - summaries
   - **Eventos**: SELECT, INSERT, UPDATE, DELETE
   - **URL HTTPS**: `https://seu-backend.com/webhooks/supabase`

### 5.2 Implementar Endpoint de Webhook

No seu backend (exemplo com Node.js/Express):

```typescript
// src/api/webhooks/supabaseWebhook.ts
import { Request, Response } from 'express';
import crypto from 'crypto';

const SUPABASE_WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET;

export async function handleSupabaseWebhook(req: Request, res: Response) {
  try {
    // Validar assinatura
    const signature = req.headers['x-supabase-signature'] as string;
    const body = JSON.stringify(req.body);
    
    const hash = crypto
      .createHmac('sha256', SUPABASE_WEBHOOK_SECRET!)
      .update(body)
      .digest('base64');

    if (hash !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { type, record, old_record, table } = req.body;

    // Processar eventos
    switch (type) {
      case 'INSERT':
        console.log(`Novo ${table}:`, record);
        // Processar inserção
        break;
      case 'UPDATE':
        console.log(`${table} atualizado:`, record);
        // Processar atualização
        break;
      case 'DELETE':
        console.log(`${table} deletado:`, old_record);
        // Processar deleção
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 5.3 Variáveis de Ambiente para Webhooks

```env
SUPABASE_WEBHOOK_SECRET=sua-chave-secreta-do-webhook
BACKEND_URL=https://seu-backend.com
```

---

## 6. REAL-TIME SUBSCRIPTIONS (Alternativa a Webhooks)

Para atualizações em tempo real no frontend:

```typescript
import { supabase } from '@/shared/services/supabase.client';

export function useRealtimeNotes(classroomId: string) {
  useEffect(() => {
    const subscription = supabase
      .channel(`notes:${classroomId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notes',
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          console.log('Mudança recebida:', payload);
          // Atualizar estado localmente
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [classroomId]);
}
```

---

## 7. CHECKLIST DE VERIFICAÇÃO

### Google OAuth:
- [ ] Projeto criado no Google Cloud
- [ ] OAuth Consent Screen configurado
- [ ] Credenciais OAuth 2.0 criadas
- [ ] Client ID e Client Secret copiados
- [ ] Redirect URIs adicionadas no Google Cloud

### Supabase:
- [ ] Google OAuth ativado no Supabase
- [ ] Client ID e Secret inseridos
- [ ] Redirect URLs configuradas
- [ ] Projeto publicado (não em preview)

### Aplicação:
- [ ] `.env` configurado corretamente
- [ ] `getAppUrl()` retorna URL correta
- [ ] Página de callback existe e funciona
- [ ] Usuários conseguem fazer login com Google
- [ ] Dados do usuário aparecem em `profiles`

### Webhooks (se necessário):
- [ ] Endpoint criado no backend
- [ ] URL HTTPS válida e acessível
- [ ] Webhook secret salvo em `.env`
- [ ] Signature validada no backend
- [ ] Eventos sendo recebidos corretamente

---

## 8. TROUBLESHOOTING

| Problema | Solução |
|----------|---------|
| "Invalid redirect URI" | Verifique se a URL de callback está exatamente igual no Google Cloud e Supabase |
| "CORS Error" | Adicione seu domínio em **Authentication** > **URL Configuration** |
| "User creation failed" | Verifique se o trigger `on_auth_user_created` está ativado no Supabase |
| Webhook não recebendo | Verifique se URL HTTPS é válida, se segredo está correto, e logs do backend |
| "Invalid session" | Limpe cookies e localStorage, verifique `.env` |

---

## 9. PRÓXIMOS PASSOS

1. **Testar localmente** com `npm run dev`
2. **Fazer deploy** em produção
3. **Atualizar URLs** de callback para domínio real
4. **Configurar emails** de verificação no Supabase (opcional)
5. **Implementar 2FA** se necessário (Supabase oferece suporte)

