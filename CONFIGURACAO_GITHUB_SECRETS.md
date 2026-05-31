# 🔐 Configuração de GitHub Secrets - ClassVault

## ✅ Status Atual

Você já criou o segredo `VITE_SUPABASE_ANON_KEY` no GitHub. Ótimo!

## 📋 Checklist de Secrets Necessários

Para o deploy funcionar corretamente, você precisa ter **2 secrets** configurados no GitHub:

### 1. VITE_SUPABASE_URL
- ✅ Valor: `https://mwsahlpckriohtapdlqq.supabase.co`
- Status: Verificar se está criado

### 2. VITE_SUPABASE_ANON_KEY
- ✅ Status: **JÁ CRIADO** por você
- Formato: Deve começar com `eyJ` (token JWT)

## 🔧 Como Verificar/Adicionar Secrets no GitHub

1. Acesse: https://github.com/ProgAlexAq20/ClassVault/settings/secrets/actions
2. Verifique se existem os 2 secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Se faltar algum, clique em **"New repository secret"**
4. Adicione o nome e valor do secret
5. Clique em **"Add secret"**

## 🏠 Configuração Local (.env)

Para desenvolvimento local, você também precisa atualizar o arquivo `.env`:

```bash
# .env (arquivo local - NÃO commitar)
VITE_SUPABASE_URL=https://mwsahlpckriohtapdlqq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (sua chave correta aqui)
VITE_APP_URL=https://progalexaq20.github.io/ClassVault
```

**IMPORTANTE:** 
- ❌ NÃO commite o arquivo `.env` com a chave real
- ✅ O `.env` já está no `.gitignore`
- ✅ Use os GitHub Secrets para deploy
- ✅ Use o `.env` local apenas para desenvolvimento

## 🚀 Como Obter a Chave Correta

1. Acesse: https://app.supabase.com
2. Selecione o projeto: `mwsahlpckriohtapdlqq`
3. Vá em: **Settings** → **API**
4. Copie a chave **"anon public"** (começa com `eyJ`)
5. Cole no arquivo `.env` local
6. Verifique se o mesmo valor está no GitHub Secret

## 🧪 Testando Localmente

Após atualizar o `.env`:

```bash
# 1. Instalar dependências (se necessário)
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Abrir no navegador
# http://localhost:5173
```

## 🌐 Testando Deploy no GitHub Pages

Após configurar os secrets:

```bash
# 1. Fazer commit das correções
git add .
git commit -m "fix: corrigir persistência de dados no Supabase"

# 2. Fazer push para main
git push origin main

# 3. Aguardar deploy (2-3 minutos)
# Acompanhar em: https://github.com/ProgAlexAq20/ClassVault/actions

# 4. Acessar aplicação
# https://progalexaq20.github.io/ClassVault
```

## ✅ Verificação Final

Após configurar tudo:

1. ✅ GitHub Secrets configurados (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
2. ✅ Arquivo `.env` local atualizado com chave correta
3. ✅ Código corrigido (canSync() permite beta users)
4. ✅ Logs adicionados para debug
5. ✅ Deploy automático funcionando

## 🎯 Próximos Passos

1. **Verificar se `VITE_SUPABASE_URL` está nos GitHub Secrets**
2. **Atualizar arquivo `.env` local com a chave correta**
3. **Testar localmente com `npm run dev`**
4. **Fazer push para main e aguardar deploy**
5. **Testar criação de dados no site publicado**
6. **Verificar logs no console do navegador**
7. **Confirmar dados no Supabase Dashboard**

## 📞 Suporte

Se encontrar erros:
- Verifique os logs no console do navegador (F12)
- Verifique os logs do GitHub Actions
- Verifique se os dados aparecem no Supabase Dashboard
- Consulte o arquivo `RELATORIO_CORRECOES_SUPABASE.md`
