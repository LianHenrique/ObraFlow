using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ObraFlow.Api.Contracts;
using ObraFlow.Api.Data;
using ObraFlow.Api.Models;
using ObraFlow.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var key = builder.Configuration["Jwt:Key"] ?? "ObraFlow-Development-Key-Change-Before-Production-2026";
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=obraflow.db"));
builder.Services.AddSingleton<TokenService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ObraFlow", ValidateAudience = true, ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ObraFlow.Web", ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), ValidateLifetime = true });
builder.Services.AddAuthorization();
builder.Services.AddCors(o => o.AddPolicy("frontend", p => p.WithOrigins("http://localhost:5173", "http://localhost:8085").AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddEndpointsApiExplorer(); builder.Services.AddSwaggerGen();
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); db.Database.EnsureCreated();
    var c = (SqliteConnection)db.Database.GetDbConnection(); await c.OpenAsync();
    await using (var cmd = c.CreateCommand()) { cmd.CommandText = "CREATE TABLE IF NOT EXISTS Usuarios (Id TEXT PRIMARY KEY NOT NULL, Nome TEXT NOT NULL, Email TEXT NOT NULL COLLATE NOCASE, SenhaHash TEXT NOT NULL, CriadoEm TEXT NOT NULL); CREATE UNIQUE INDEX IF NOT EXISTS IX_Usuarios_Email ON Usuarios(Email);"; await cmd.ExecuteNonQueryAsync(); }
    foreach (var table in new[] { "Obras", "Despesas" }) {
        var found = false; await using (var check = c.CreateCommand()) { check.CommandText = $"PRAGMA table_info(\"{table}\")"; await using var rd = await check.ExecuteReaderAsync(); while (await rd.ReadAsync()) if (rd.GetString(1) == "UsuarioId") found = true; }
        if (!found) { await using var alter = c.CreateCommand(); alter.CommandText = $"ALTER TABLE \"{table}\" ADD COLUMN UsuarioId TEXT NULL"; await alter.ExecuteNonQueryAsync(); }
    } 
    await using (var receitaTable = c.CreateCommand()) {
        receitaTable.CommandText = "CREATE TABLE IF NOT EXISTS Receitas (Id INTEGER PRIMARY KEY AUTOINCREMENT, UsuarioId TEXT NOT NULL, Descricao TEXT NOT NULL, Categoria TEXT NOT NULL, Valor TEXT NOT NULL, Data TEXT NOT NULL, ObraId INTEGER NULL); CREATE INDEX IF NOT EXISTS IX_Receitas_UsuarioId_Data ON Receitas(UsuarioId, Data);";
        await receitaTable.ExecuteNonQueryAsync();
    }
    await c.CloseAsync();
}
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseCors("frontend"); app.UseAuthentication(); app.UseAuthorization();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", service = "ObraFlow.Api" }));
var auth = app.MapGroup("/api/auth");
auth.MapPost("/register", async (CadastroRequest req, AppDbContext db, TokenService tokens) => {
    var nome = req.Nome?.Trim(); var email = req.Email?.Trim().ToLowerInvariant();
    if (string.IsNullOrWhiteSpace(nome) || nome.Length > 100 || string.IsNullOrWhiteSpace(email) || email.Length > 180 || !email.Contains('@') || string.IsNullOrWhiteSpace(req.Senha) || req.Senha.Length < 8) return Results.BadRequest(new { message = "Informe nome, e-mail válido e senha com pelo menos 8 caracteres." });
    if (await db.Usuarios.AnyAsync(u => u.Email == email)) return Results.Conflict(new { message = "Este e-mail já possui uma conta." });
    var user = new Usuario { Nome = nome, Email = email, SenhaHash = PasswordService.Hash(req.Senha) }; db.Usuarios.Add(user); await db.SaveChangesAsync();
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE Obras SET UsuarioId = {user.Id} WHERE UsuarioId IS NULL");
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE Despesas SET UsuarioId = {user.Id} WHERE UsuarioId IS NULL");
    var (token, expires) = tokens.CriarToken(user); return Results.Ok(new { token, expiresAt = expires, user = new { user.Id, user.Nome, user.Email } });
});
auth.MapPost("/login", async (LoginRequest req, AppDbContext db, TokenService tokens) => {
    var email = req.Email?.Trim().ToLowerInvariant(); var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
    if (user is null || !PasswordService.Verify(req.Senha ?? "", user.SenhaHash)) return Results.Unauthorized();
    var (token, expires) = tokens.CriarToken(user); return Results.Ok(new { token, expiresAt = expires, user = new { user.Id, user.Nome, user.Email } });
});
var api = app.MapGroup("/api").RequireAuthorization();
api.MapGet("/auth/me", async (ClaimsPrincipal p, AppDbContext db) => { var id = p.FindFirstValue(ClaimTypes.NameIdentifier); var u = await db.Usuarios.FindAsync(id); return u is null ? Results.Unauthorized() : Results.Ok(new { u.Id, u.Nome, u.Email }); });
api.MapGet("/obras", async (ClaimsPrincipal p, AppDbContext db) => { var uid = p.FindFirstValue(ClaimTypes.NameIdentifier)!; return Results.Ok(await db.Obras.Where(x => x.UsuarioId == uid).Include(x => x.Despesas).OrderByDescending(x => x.CriadaEm).ToListAsync()); });
api.MapGet("/obras/{id:int}", async (int id, ClaimsPrincipal p, AppDbContext db) => { var uid = p.FindFirstValue(ClaimTypes.NameIdentifier)!; var x = await db.Obras.Include(o => o.Despesas).FirstOrDefaultAsync(o => o.Id == id && o.UsuarioId == uid); return x is null ? Results.NotFound() : Results.Ok(x); });
api.MapPost("/obras", async (Obra x, ClaimsPrincipal p, AppDbContext db) => { if (string.IsNullOrWhiteSpace(x.Nome) || string.IsNullOrWhiteSpace(x.Cliente) || x.Orcamento < 0) return Results.BadRequest(new { message = "Informe nome, cliente e orçamento válido." }); x.Id = 0; x.UsuarioId = p.FindFirstValue(ClaimTypes.NameIdentifier); x.Despesas = new(); x.CriadaEm = DateTime.UtcNow; db.Obras.Add(x); await db.SaveChangesAsync(); return Results.Created($"/api/obras/{x.Id}", x); });
api.MapPut("/obras/{id:int}", async (int id, Obra input, ClaimsPrincipal p, AppDbContext db) => { var uid = p.FindFirstValue(ClaimTypes.NameIdentifier)!; var x = await db.Obras.FirstOrDefaultAsync(o => o.Id == id && o.UsuarioId == uid); if (x is null) return Results.NotFound(); if (string.IsNullOrWhiteSpace(input.Nome) || string.IsNullOrWhiteSpace(input.Cliente) || input.Orcamento < 0) return Results.BadRequest(new { message = "Dados da obra inválidos." }); x.Nome=input.Nome; x.Cliente=input.Cliente; x.Endereco=input.Endereco; x.Orcamento=input.Orcamento; x.DataInicio=input.DataInicio; x.PrevisaoEntrega=input.PrevisaoEntrega; x.Status=input.Status; await db.SaveChangesAsync(); return Results.Ok(x); });
api.MapDelete("/obras/{id:int}", async (int id, ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; var x=await db.Obras.FirstOrDefaultAsync(o=>o.Id==id && o.UsuarioId==uid); if(x is null)return Results.NotFound(); db.Obras.Remove(x); await db.SaveChangesAsync(); return Results.NoContent(); });
api.MapGet("/despesas", async (ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; return Results.Ok(await db.Despesas.Where(d=>d.UsuarioId==uid).Include(d=>d.Obra).OrderByDescending(d=>d.Data).ToListAsync()); });
api.MapPost("/despesas", async (Despesa x, ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; if(string.IsNullOrWhiteSpace(x.Descricao)||x.Valor<=0)return Results.BadRequest(new {message="Informe descrição e valor maior que zero."}); if(!await db.Obras.AnyAsync(o=>o.Id==x.ObraId && o.UsuarioId==uid))return Results.BadRequest(new {message="A obra informada não existe."}); x.Id=0; x.UsuarioId=uid; x.Obra=null; db.Despesas.Add(x); await db.SaveChangesAsync(); return Results.Created($"/api/despesas/{x.Id}",x); });
api.MapPut("/despesas/{id:int}", async (int id, Despesa input, ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; var x=await db.Despesas.FirstOrDefaultAsync(d=>d.Id==id && d.UsuarioId==uid); if(x is null)return Results.NotFound(); if(string.IsNullOrWhiteSpace(input.Descricao)||input.Valor<=0)return Results.BadRequest(new {message="Informe descrição e valor maior que zero."}); if(!await db.Obras.AnyAsync(o=>o.Id==input.ObraId && o.UsuarioId==uid))return Results.BadRequest(new {message="A obra informada não existe."}); x.Descricao=input.Descricao.Trim(); x.Categoria=input.Categoria; x.Valor=input.Valor; x.Data=input.Data; x.ObraId=input.ObraId; await db.SaveChangesAsync(); return Results.Ok(x); });
api.MapDelete("/despesas/{id:int}", async (int id, ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; var x=await db.Despesas.FirstOrDefaultAsync(d=>d.Id==id && d.UsuarioId==uid); if(x is null)return Results.NotFound(); db.Despesas.Remove(x); await db.SaveChangesAsync(); return Results.NoContent(); });
api.MapGet("/receitas", async (ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; return Results.Ok(await db.Receitas.Where(r=>r.UsuarioId==uid).OrderByDescending(r=>r.Data).ToListAsync()); });
api.MapPost("/receitas", async (Receita x, ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; if(string.IsNullOrWhiteSpace(x.Descricao)||x.Valor<=0)return Results.BadRequest(new {message="Informe descrição e valor maior que zero."}); if(x.ObraId.HasValue && !await db.Obras.AnyAsync(o=>o.Id==x.ObraId && o.UsuarioId==uid))return Results.BadRequest(new {message="A obra informada não existe."}); x.Id=0; x.UsuarioId=uid; db.Receitas.Add(x); await db.SaveChangesAsync(); return Results.Created($"/api/receitas/{x.Id}",x); });
api.MapPut("/receitas/{id:int}", async (int id, Receita input, ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; var x=await db.Receitas.FirstOrDefaultAsync(r=>r.Id==id && r.UsuarioId==uid); if(x is null)return Results.NotFound(); if(string.IsNullOrWhiteSpace(input.Descricao)||input.Valor<=0)return Results.BadRequest(new {message="Informe descrição e valor maior que zero."}); if(input.ObraId.HasValue && !await db.Obras.AnyAsync(o=>o.Id==input.ObraId && o.UsuarioId==uid))return Results.BadRequest(new {message="A obra informada não existe."}); x.Descricao=input.Descricao.Trim(); x.Categoria=input.Categoria; x.Valor=input.Valor; x.Data=input.Data; x.ObraId=input.ObraId; await db.SaveChangesAsync(); return Results.Ok(x); });
api.MapDelete("/receitas/{id:int}", async (int id, ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; var x=await db.Receitas.FirstOrDefaultAsync(r=>r.Id==id && r.UsuarioId==uid); if(x is null)return Results.NotFound(); db.Receitas.Remove(x); await db.SaveChangesAsync(); return Results.NoContent(); });
api.MapGet("/dashboard/resumo", async (ClaimsPrincipal p, AppDbContext db) => { var uid=p.FindFirstValue(ClaimTypes.NameIdentifier)!; var works=await db.Obras.Where(o=>o.UsuarioId==uid).ToListAsync(); var costs=await db.Despesas.Where(d=>d.UsuarioId==uid).ToListAsync(); var income=await db.Receitas.Where(r=>r.UsuarioId==uid).ToListAsync(); return Results.Ok(new { totalObras=works.Count, obrasEmAndamento=works.Count(o=>o.Status=="Em andamento"), orcamentoTotal=works.Sum(o=>o.Orcamento), totalDespesas=costs.Sum(d=>d.Valor), totalReceitas=income.Sum(r=>r.Valor), resultadoFinanceiro=income.Sum(r=>r.Valor)-costs.Sum(d=>d.Valor), saldoDisponivel=works.Sum(o=>o.Orcamento)-costs.Sum(d=>d.Valor) }); });
app.Run();