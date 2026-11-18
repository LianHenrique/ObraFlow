# Segurança

O ObraFlow é um projeto de portfólio e demonstração técnica.

## Estado atual

- A API utiliza autenticação JWT Bearer; as rotas de dados exigem token.
- As senhas são armazenadas com PBKDF2 e salt aleatório.
- As obras e despesas são filtradas pelo identificador do usuário autenticado.
- Configure `Jwt__Key` com um segredo aleatório de pelo menos 32 caracteres em ambientes publicados; a chave padrão do projeto serve somente para desenvolvimento.
- Os endpoints de cadastro, alteração e exclusão não devem ser expostos publicamente em produção.
- Não utilize dados pessoais, financeiros ou informações reais de clientes neste ambiente de demonstração.
- O banco SQLite local deve permanecer fora do controle de versão.

## Reportar vulnerabilidades

Não publique credenciais, tokens, dados pessoais ou detalhes exploráveis em Issues públicas. Para este projeto pessoal, entre em contato com o mantenedor por um canal privado antes de divulgar uma vulnerabilidade.
