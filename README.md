# ObraFlow

Sistema Full Stack para gerenciamento de obras, acompanhamento de despesas e visualização de indicadores financeiros.

## Tecnologias

- **Backend:** C#, ASP.NET Core 8, Minimal APIs, Entity Framework Core e SQLite
- **Frontend:** React 18, TypeScript, Vite e Lucide
- **Documentação da API:** Swagger / OpenAPI

## Funcionalidades

- Cadastro, listagem, edição e exclusão de obras
- Registro e listagem de despesas vinculadas a uma obra
- Exclusão de despesas e remoção em cascata ao excluir uma obra
- Dashboard com quantidade de obras, projetos em andamento, orçamento, despesas e saldo
- Busca de obras por nome, cliente ou status
- Interface responsiva com formulário de cadastro

## Estrutura

```text
ObraFlow/
├── backend/
│   └── ObraFlow.Api/
│       ├── Data/
│       ├── Models/
│       ├── Properties/
│       ├── Program.cs
│       └── ObraFlow.Api.csproj
└── frontend/
    └── src/
        ├── App.tsx
        ├── main.tsx
        └── styles.css
```

## Pré-requisitos

- .NET 8 SDK
- Node.js 20 ou superior
- npm

## Executar localmente

### 1. Backend

No terminal, a partir da raiz do repositório:

```bash
cd backend/ObraFlow.Api
dotnet restore
dotnet run
```

A API ficará disponível em `http://localhost:5000`.

- Swagger: `http://localhost:5000/swagger`
- Verificação: `http://localhost:5000/api/health`

O banco SQLite `obraflow.db` é criado automaticamente na primeira execução.

### 2. Frontend

Em outro terminal, a partir da raiz do repositório:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

Por padrão, o frontend consome a API em `http://localhost:5000`. Para usar outro endereço, crie um arquivo `.env` na pasta `frontend` com:

```env
VITE_API_URL=http://localhost:5000
```

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Estado da API |
| GET | `/api/obras` | Lista obras |
| GET | `/api/obras/{id}` | Detalha uma obra |
| POST | `/api/obras` | Cadastra uma obra |
| PUT | `/api/obras/{id}` | Atualiza uma obra |
| DELETE | `/api/obras/{id}` | Exclui uma obra |
| GET | `/api/despesas` | Lista despesas |
| POST | `/api/despesas` | Registra uma despesa |
| DELETE | `/api/despesas/{id}` | Exclui uma despesa |
| GET | `/api/dashboard/resumo` | Retorna indicadores financeiros |

## Próximas melhorias

- Autenticação e autorização de usuários
- Edição e filtros avançados de despesas
- Testes automatizados para API e interface
- Migrações do Entity Framework Core
- Docker e pipeline CI/CD

---

Projeto de portfólio para demonstrar desenvolvimento Full Stack, construção de APIs REST, persistência de dados e integração de frontend com backend.


## Executar com Docker

Com Docker Desktop e Docker Compose instalados, execute na raiz do projeto:

```bash
docker compose up --build
```

A aplicação ficará disponível em `http://localhost:8085`. O banco SQLite é persistido em um volume Docker chamado `obraflow-data`. Para encerrar:

```bash
docker compose down
```

## Integração contínua

O GitHub Actions executa o build do backend (.NET 8) e do frontend (Node.js 22) em pushes e Pull Requests direcionados à branch `main`.

## Contribuição

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para preparar o ambiente e abrir Pull Requests.
