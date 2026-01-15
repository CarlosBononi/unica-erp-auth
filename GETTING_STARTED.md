# Guia de Início Rápido - ÚNICA ERP Authentication

## 🚀 Como Aplicar Este Projeto

Este guia mostra como configurar e começar a usar o módulo de autenticação da ÚNICA ERP em sua máquina local.

## ✅ Pré-requisitos

- Node.js v16+ instalado (https://nodejs.org/)
- NPM ou Yarn instalado
- Git instalado
- Uma conta Supabase criada (https://supabase.com/)
- VS Code ou editor de código preferido

## 📋 Passo 1: Clonar o Repositório

```bash
# Clone o repositório
git clone https://github.com/CarlosBononi/unica-erp-auth.git

# Entre no diretório do projeto
cd unica-erp-auth
```

## 📦 Passo 2: Instalar Dependências

```bash
# Com npm
npm install

# Ou com yarn
yarn install
```

Isso instalará todas as dependências listadas no `package.json`:
- Express (servidor web)
- JWT (autenticação)
- Bcrypt (criptografia de senhas)
- Supabase (banco de dados)
- CORS (cross-origin)
- Helmet (segurança)

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo .env

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

### 3.2 Preencher as Variáveis

Abra o arquivo `.env` e preencha com suas credenciais:

```env
# Obtenha do Supabase Dashboard
DATABASE_URL=sua_url_supabase
DATABASE_KEY=sua_chave_supabase
SUPABASE_API_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima

# Gere uma chave secreta forte
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
JWT_EXPIRES_IN=24h

# Configurações da aplicação
NODE_ENV=development
PORT=3000
HOST=localhost

# CORS (URLs permitidas)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Segurança
BCRYPT_ROUNDS=10
LOG_LEVEL=info
```

## 🔑 Passo 4: Configurar Supabase

### 4.1 Criar Projeto no Supabase

1. Acesse https://app.supabase.com
2. Clique em "New Project"
3. Preencha os dados:
   - Nome do Projeto: `unica-erp`
   - Senha do banco: (escolha uma forte)
   - Região: Sa Paulo ou mais próxima
4. Aguarde a criação (~2 minutos)

### 4.2 Obter Credenciais

1. No Supabase Dashboard, vá para "Settings" > "API"
2. Copie:
   - `Project URL` → `DATABASE_URL` e `SUPABASE_API_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `DATABASE_KEY`
3. Cole no seu `.env`

### 4.3 Criar Tabela de Usuários (SQL)

Acesse "SQL Editor" no Supabase e execute:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

## 🏃 Passo 5: Executar o Servidor

```bash
# Modo desenvolvimento (com hot-reload)
npm run dev

# Ou modo produção
npm start
```

Você deverá ver:
```
Servidor rodando em http://localhost:3000
```

## 🧪 Passo 6: Testar os Endpoints

Use Postman, Insomnia, ou curl para testar:

### 6.1 Registrar Usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@email.com", "password": "senha123", "name": "João"}'
```

### 6.2 Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@email.com", "password": "senha123"}'
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {"id": "...", "email": "teste@email.com"}
}
```

### 6.3 Acessar Rota Protegida

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📚 Próximos Passos

1. **Criar estrutura de pastas**: Siga a estrutura em `README.md`
2. **Implementar Controllers**: Crie handlers de autenticação
3. **Adicionar Middlewares**: Validação e autenticação
4. **Integrar Frontend**: Conecte com seu frontend React/Vue
5. **Testar Tudo**: Execute testes com `npm test`

## ⚠️ Problemas Comuns

### Erro: "Cannot find module 'express'"
**Solução**: Execute `npm install`

### Erro: "CORS error"
**Solução**: Verifique `CORS_ORIGIN` no `.env` com sua URL frontend

### Erro: "Invalid database connection"
**Solução**: Verifique as credenciais do Supabase no `.env`

## 📖 Referências

- [Express.js](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [JWT.io](https://jwt.io/)
- [Bcrypt](https://www.npmjs.com/package/bcryptjs)

## 💡 Dicas

- Use o arquivo `.env.example` como referência
- Nunca faça commit do arquivo `.env` (já está no `.gitignore`)
- Teste os endpoints antes de integrar com o frontend
- Use variáveis de ambiente diferentes para dev, test e production

---

**Dúvidas?** Abra uma issue no repositório ou consulte a documentação do README.md
