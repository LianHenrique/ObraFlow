namespace ObraFlow.Api.Models;

public class Obra
{
    public int Id { get; set; }
    public string? UsuarioId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public string Endereco { get; set; } = string.Empty;
    public decimal Orcamento { get; set; }
    public DateTime DataInicio { get; set; } = DateTime.UtcNow;
    public DateTime? PrevisaoEntrega { get; set; }
    public string Status { get; set; } = "Planejamento";
    public DateTime CriadaEm { get; set; } = DateTime.UtcNow;
    public List<Despesa> Despesas { get; set; } = new();
}
