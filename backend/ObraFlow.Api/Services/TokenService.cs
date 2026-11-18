using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ObraFlow.Api.Models;

namespace ObraFlow.Api.Services;

public class TokenService(IConfiguration configuration)
{
    public (string Token, DateTime ExpiraEm) CriarToken(Usuario usuario)
    {
        var key = configuration["Jwt:Key"] ?? "ObraFlow-Development-Key-Change-Before-Production-2026";
        var issuer = configuration["Jwt:Issuer"] ?? "ObraFlow";
        var audience = configuration["Jwt:Audience"] ?? "ObraFlow.Web";
        var expires = DateTime.UtcNow.AddHours(8);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Email, usuario.Email)
        };
        var jwt = new JwtSecurityToken(issuer, audience, claims, DateTime.UtcNow, expires, credentials);
        return (new JwtSecurityTokenHandler().WriteToken(jwt), expires);
    }
}
