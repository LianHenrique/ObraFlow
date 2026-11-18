namespace ObraFlow.Api.Contracts;

public record CadastroRequest(string Nome, string Email, string Senha);
public record LoginRequest(string Email, string Senha);
