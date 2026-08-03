# Plantão PRO — Backend

API REST para o sistema de sorteio de plantões de corretores imobiliários.

## 🚀 Tecnologias

- Node.js
- Fastify
- PostgreSQL (Neon Serverless)
- JWT (jsonwebtoken)
- bcrypt

## 📋 Funcionalidades

- Cadastro e listagem de corretores
- Sorteio aleatório com algoritmo Fisher-Yates
- Autenticação de administrador com JWT
- Dashboard com estatísticas, rankings e insights
- Histórico completo de sorteios preservado

## 🔗 Rotas da API

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /users | Lista todos os corretores |
| POST | /users | Cadastra um corretor |
| DELETE | /users/reset | Reseta a lista |

### Sorteio
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /draw | Realiza o sorteio |
| GET | /draw | Retorna o último sorteio |

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/login | Login do administrador |

### Admin (protegidas por JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /admin/stats | Estatísticas gerais |
| GET | /admin/ranking | Ranking de participações |
| GET | /admin/history | Histórico de sorteios |
| GET | /admin/attendance | Assiduidade por corretor |
| GET | /admin/search/corretor | Busca por corretor |
| GET | /admin/search/gerente | Busca por gerente |
| GET | /admin/search/data | Busca por data |
| GET | /admin/search/rodada | Busca por rodada |
| GET | /admin/charts/evolution | Dados para gráfico de evolução |
| GET | /admin/charts/managers | Dados para gráfico por gerente |
| GET | /admin/charts/positions | Dados para gráfico de posições |
| GET | /admin/charts/attendance | Dados para gráfico de assiduidade |
| GET | /admin/insights/avg-position | Média de posição por corretor |
| GET | /admin/insights/new-vs-returning | Novos vs recorrentes |
| GET | /admin/insights/streaks | Sequências consecutivas |
| GET | /admin/insights/ranking-period | Ranking por período |

## ⚙️ Como rodar localmente

```bash
# Instalar dependências
npm install

# Criar arquivo .env com as variáveis
DATABASE_URL=sua_connection_string_neon
JWT_SECRET=seu_jwt_secret

# Criar as tabelas
node src/setupDb.js

# Criar o admin
node src/createAdmin.js

# Rodar em desenvolvimento
npm run dev
```

## 🌐 Deploy

- Backend: [Render](https://plantao-pro-backend.onrender.com)
- Frontend: [plantao-pro-frontend.vercel.app](https://plantao-pro-frontend.vercel.app)

## 📁 Repositório Frontend

[github.com/matheusffsantana/plantao_pro_frontend](https://github.com/matheusffsantana/plantao_pro_frontend)