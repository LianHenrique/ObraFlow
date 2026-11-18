# ObraFlow — documentação técnica

## Visão geral

ObraFlow é uma aplicação Full Stack para gerenciamento de obras e acompanhamento financeiro. O sistema permite que cada usuário mantenha suas obras, despesas e receitas em uma área isolada por autenticação.

## Funcionalidades implementadas

### Contas e segurança
- Cadastro, login e logout com autenticação JWT Bearer.
- Senhas protegidas com PBKDF2 e salt aleatório.
- Rotas de dados protegidas por autenticação.
- Consultas e operações limitadas aos registros do usuário autenticado.

### Gestão de obras
- Cadastro, consulta, edição e exclusão de obras.
- Informações de cliente, endereço, orçamento, datas e status.
- Exclusão de uma obra remove suas despesas vinculadas.

### Financeiro
- Cadastro, consulta, edição e exclusão de despesas.
- Cadastro, consulta, edição e exclusão de receitas.
- Associação opcional de receitas a uma obra e associação de despesas a uma obra.
- Categorias para entradas e saídas.
- Busca por descrição, categoria e obra.
- Filtros de data inicial e final.
- Totais de receitas, despesas, resultado financeiro (receitas menos despesas) e total do filtro selecionado.
- Confirmação visual antes de excluir lançamentos.
- Campos monetários com máscara brasileira: a digitação é convertida para centavos e apresentada como 1.234,56; a API recebe valores numéricos decimais.

### Dashboard e relatórios
- Quantidade de obras e obras em andamento.
- Orçamento total, despesas acumuladas e receitas registradas.
- Resultado financeiro de receitas menos despesas.
- Saldo de orçamento (orçamento total menos despesas), indicador distinto do resultado de caixa.
- Relatório resumido da carteira de obras.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Backend | C#, ASP.NET Core 8 Minimal APIs |
| Persistência | Entity Framework Core 8, SQLite |
| Autenticação | JWT Bearer, PBKDF2 |
| Frontend | React, TypeScript, Vite |
| Interface | CSS responsivo, Lucide |
| Ambiente | Docker, Docker Compose, Nginx |
| Qualidade | GitHub Actions (build de backend e frontend) |

## Arquitetura

O frontend React comunica-se com a API ASP.NET Core por HTTP. As rotas privadas enviam o token JWT no cabeçalho `Authorization: Bearer`. O backend valida o token e usa o identificador do usuário para filtrar ou atribuir registros. Os dados são persistidos em SQLite.

## Endpoints

### Autenticação
| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Autenticar |
| GET | `/api/auth/me` | Consultar conta autenticada |

### Obras
| Método | Rota | Objetivo |
|---|---|---|
| GET | `/api/obras` | Listar obras do usuário |
| GET | `/api/obras/{id}` | Consultar obra |
| POST | `/api/obras` | Criar obra |
| PUT | `/api/obras/{id}` | Atualizar obra |
| DELETE | `/api/obras/{id}` | Excluir obra |

### Financeiro
| Método | Rota | Objetivo |
|---|---|---|
| GET | `/api/despesas` | Listar despesas |
| POST | `/api/despesas` | Criar despesa |
| PUT | `/api/despesas/{id}` | Atualizar despesa |
| DELETE | `/api/despesas/{id}` | Excluir despesa |
| GET | `/api/receitas` | Listar receitas |
| POST | `/api/receitas` | Criar receita |
| PUT | `/api/receitas/{id}` | Atualizar receita |
| DELETE | `/api/receitas/{id}` | Excluir receita |
| GET | `/api/dashboard/resumo` | Consultar indicadores consolidados |

## Regras financeiras

- Valores de lançamentos devem ser maiores que zero.
- Despesas precisam estar vinculadas a uma obra pertencente ao usuário.
- Receitas podem ser independentes ou vinculadas a uma obra do próprio usuário.
- A edição e exclusão validam a propriedade do lançamento.
- O resultado financeiro considera somente receitas e despesas efetivamente lançadas. O saldo de orçamento é calculado separadamente com base no orçamento das obras menos despesas.

## Formatação monetária

Os campos de valores aceitam digitação numérica com máscara em padrão brasileiro. Os dígitos são interpretados como centavos: por exemplo, digitar `123456` apresenta `1.234,56`. Na submissão, o frontend converte o texto para número decimal antes de enviar à API. Os valores apresentados na interface usam `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

## Executar com Docker

Na raiz do repositório:

```bash
docker compose up --build
```

A interface fica disponível em `http://localhost:8085`. O SQLite é persistido no volume Docker `obraflow-data`.

Para encerrar sem apagar o banco:

```bash
docker compose down
```

Não use `docker compose down -v` se quiser preservar os dados.

## Configurações de produção

- Defina `Jwt__Key` como segredo aleatório e forte, fora do código-fonte.
- Publique somente com HTTPS.
- Avalie migrar o token do localStorage para cookie HttpOnly, Secure e SameSite, com proteção CSRF adequada.
- Configure backup do volume SQLite e política de retenção.
- Adicione testes automatizados de integração e interface antes de uso operacional.

## Limitações e próximas evoluções

A filtragem por período é aplicada no frontend após o carregamento dos lançamentos. Próximas evoluções possíveis incluem filtros e paginação no servidor, exportação CSV/PDF, gráficos de fluxo de caixa, testes automatizados, auditoria de alterações e migrações versionadas.
