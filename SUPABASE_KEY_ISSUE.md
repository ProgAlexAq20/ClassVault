# ⚠️ PROBLEMA CRÍTICO: Anon Key Inválida

## Problema Identificado

A `VITE_SUPABASE_ANON_KEY` no arquivo `.env` está com formato **INCORRETO**:

```
❌ INCORRETO: sb_publishable_kcFyOx3xBY2e0b-hlxWpXQ_vHNLtpGC
```

## Formato Correto

As chaves anônimas (anon key) do Supabase sempre começam com `eyJ` e são tokens JWT longos:

```
✅ CORRETO: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13c2FobHBja3Jpb2h0YXBkbHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc5NjQwMDAsImV4cCI6MjAwMzU0MDAwMH0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Como Obter a Chave Correta

1. Acesse o dashboard do Supabase: https://app.supabase.com
2. Selecione seu projeto: `mwsahlpckriohtapdlqq`
3. Vá em **Settings** → **API**
4. Copie a chave **anon/public** (não a service_role)
5. Cole no arquivo `.env`

## Impacto

Sem a chave correta:
- ❌ Nenhuma operação no Supabase funciona
- ❌ Autenticação falha
- ❌ Queries retornam erro 401/403
- ❌ Dados não são salvos

## Ação Necess