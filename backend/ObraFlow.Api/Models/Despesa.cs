namespace ObraFlow.Api.Models;

public class Despesa
{
    public int Id { get; set; }
    public string? UsuarioId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Outros";
    public decimal Valor { get; set; }
    public DateTime Data { get; set; } = DateTime.UtcNow;
    public int ObraId { get; set; }
    public Obra? Obra { get; set; }
}
