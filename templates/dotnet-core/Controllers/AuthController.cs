using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DotNetCore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        public static readonly string SecretKey = "SuperSecret_Key_For_DotNetCore_Auth_Token_2026!";

        public class LoginDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class RegisterDto
        {
            public string Name { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "user";
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            // Demo credentials verification
            if (dto.Email == "admin@example.com" && dto.Password == "admin123")
            {
                var token = GenerateJwtToken("1", "Admin User", dto.Email, "admin");
                return Ok(new { success = true, token, role = "admin" });
            }
            else if (!string.IsNullOrEmpty(dto.Email) && !string.IsNullOrEmpty(dto.Password))
            {
                var token = GenerateJwtToken("2", "Standard User", dto.Email, "user");
                return Ok(new { success = true, token, role = "user" });
            }

            return Unauthorized(new { success = false, error = "Invalid credentials" });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            var token = GenerateJwtToken("3", dto.Name, dto.Email, dto.Role);
            return Ok(new { success = true, token, user = dto });
        }

        private string GenerateJwtToken(string id, string name, string email, string role)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(SecretKey);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, id),
                    new Claim(ClaimTypes.Name, name),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.Role, role)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
