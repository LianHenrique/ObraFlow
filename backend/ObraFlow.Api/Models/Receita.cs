namespace ObraFlow.Api.Models;

public class Receita
{
    public int Id { get; set; }
    public string UsuarioId { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Outros";
    public decimal Valor { get; set; }
    public DateTime Data { get; set; } = DateTime.UtcNow;
    public int? ObraId { get; set; }
}
