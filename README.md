# ÚNICA ERP - Módulo de Autenticação

Módulo de autenticação e gerenciamento de usuários para o sistema ÚNICA ERP de aluguel de carros.

## Descrição

Este repositório contém a implementação da camada de autenticação do ÚNICA ERP, incluindo:

- Autenticação de usuários (login/logout)
- Gerenciamento de sessões
- Validação de credenciais
- Controle de acesso baseado em papéis (RBAC)
- Recuperação de senha
- Autenticação de dois fatores (2FA)

## Tecnologias

- Node.js com Express
- JWT (JSON Web Tokens)
- Bcrypt para hash de senhas
- Supabase para banco de dados
- PostgreSQL

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DATABASE_URL=your_supabase_url
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Uso

```bash
npm start
```

## API Endpoints

### Autenticação

- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login de usuário
- `POST /auth/logout` - Logout de usuário
- `POST /auth/refresh-token` - Renovar token JWT
- `POST /auth/forgot-password` - Recuperar senha
- `POST /auth/reset-password` - Resetar senha

## Estrutura do Projeto

```
unica-erp-auth/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── index.js
├── tests/
├── .env.example
├── package.json
└── README.md
```

## Licença

MIT
