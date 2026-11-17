using Microsoft.EntityFrameworkCore;
using ObraFlow.Api.Data;
using ObraFlow.Api.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=obraflow.db"));
builder.Services.AddCors(options => options.AddPolicy("frontend", policy =>
    policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("frontend");

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", service = "ObraFlow.Api" }));

app.MapGet("/api/obras", async (AppDbContext db) =>
    Results.Ok(await db.Obras.Include(o => o.Despesas).OrderByDescending(o => o.CriadaEm).ToListAsync()));

app.MapGet("/api/obras/{id:int}", async (int id, AppDbContext db) =>
{
    var obra = await db.Obras.Include(o => o.Despesas).FirstOrDefaultAsync(o => o.Id == id);
    return obra is null ? Results.NotFound() : Results.Ok(obra);
});

app.MapPost("/api/obras", async (Obra obra, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(obra.Nome) || string.IsNullOrWhiteSpace(obra.Cliente) || obra.Orcamento < 0)
        return Results.BadRequest(new { message = "Informe nome, cliente e um orçamento válido." });
    obra.Id = 0;
    obra.Despesas = new();
    obra.CriadaEm = DateTime.UtcNow;
    db.Obras.Add(obra);
    await db.SaveChangesAsync();
    return Results.Created($"/api/obras/{obra.Id}", obra);
});

app.MapPut("/api/obras/{id:int}", async (int id, Obra input, AppDbContext db) =>
{
    var obra = await db.Obras.FindAsync(id);
    if (obra is null) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(input.Nome) || string.IsNullOrWhiteSpace(input.Cliente) || input.Orcamento < 0)
        return Results.BadRequest(new { message = "Dados da obra inválidos." });
    obra.Nome = input.Nome; obra.Cliente = input.Cliente; obra.Endereco = input.Endereco;
    obra.Orcamento = input.Orcamento; obra.DataInicio = input.DataInicio;
    obra.PrevisaoEntrega = input.PrevisaoEntrega; obra.Status = input.Status;
    await db.SaveChangesAsync();
    return Results.Ok(obra);
});

app.MapDelete("/api/obras/{id:int}", async (int id, AppDbContext db) =>
{
    var obra = await db.Obras.FindAsync(id);
    if (obra is null) return Results.NotFound();
    db.Obras.Remove(obra);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/api/despesas", async (AppDbContext db) =>
    Results.Ok(await db.Despesas.Include(d => d.Obra).OrderByDescending(d => d.Data).ToListAsync()));

app.MapPost("/api/despesas", async (Despesa despesa, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(despesa.Descricao) || despesa.Valor <= 0)
        return Results.BadRequest(new { message = "Informe uma descrição e um valor maior que zero." });
    if (!await db.Obras.AnyAsync(o => o.Id == despesa.ObraId))
        return Results.BadRequest(new { message = "A obra informada não existe." });
    despesa.Id = 0; despesa.Obra = null;
    db.Despesas.Add(despesa);
    await db.SaveChangesAsync();
    return Results.Created($"/api/despesas/{despesa.Id}", despesa);
});

app.MapDelete("/api/despesas/{id:int}", async (int id, AppDbContext db) =>
{
    var despesa = await db.Despesas.FindAsync(id);
    if (despesa is null) return Results.NotFound();
    db.Despesas.Remove(despesa);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/api/dashboard/resumo", async (AppDbContext db) =>
{
    var obras = await db.Obras.ToListAsync();
    var despesas = await db.Despesas.ToListAsync();
    return Results.Ok(new
    {
        totalObras = obras.Count,
        obrasEmAndamento = obras.Count(o => o.Status == "Em andamento"),
        orcamentoTotal = obras.Sum(o => o.Orcamento),
        totalDespesas = despesas.Sum(d => d.Valor),
        saldoDisponivel = obras.Sum(o => o.Orcamento) - despesas.Sum(d => d.Valor)
    });
});

app.Run();
