using System.Text;
using System.Text.Json.Serialization;
using Macrocenter.Api.Auth;
using Macrocenter.Api.Services;
using Macrocenter.Domain.Pricing;
using Macrocenter.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// --- Configuration -----------------------------------------------------------
// Supplied by Compose as ConnectionStrings__DefaultConnection, pointing at the
// `db` service by its Compose network name.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection is not configured. Copy .env.example to .env "
        + "and run through Docker Compose, or set the connection string for local runs.");

// Comma-separated list of browser origins allowed to call the API.
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// Supplied by Compose as Jwt__Key; appsettings.json carries a development
// default so that a plain `dotnet run` works too.
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is not configured. Compose supplies it as Jwt__Key.");

// --- Services ----------------------------------------------------------------
builder.Services.AddDbContext<MacrocenterDbContext>(options =>
    options
        .UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure())
        // Gives Postgres-idiomatic table and column names (items.sale_price).
        .UseSnakeCaseNamingConvention());

// Enums travel as their names rather than their numbers, so a response reads
// "Pending" instead of 0 and matches how they are stored in the database.
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor();

// Pricing rules. These two are pure calculators with no state of their own, so
// a single shared instance each is all that is needed.
builder.Services.AddSingleton<CartCalculator>();
builder.Services.AddSingleton(new SalesTaxCalculator(
    builder.Configuration.GetValue("Pricing:SalesTaxRatePercent",
        SalesTaxCalculator.DefaultRatePercent)));

// Application services. Registered as concrete classes rather than behind
// interfaces: there is one implementation of each, and the logic worth testing
// lives in the calculators above, which need no container at all.
builder.Services.AddScoped<CurrentUser>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ItemService>();
builder.Services.AddScoped<PricingService>();
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<DiscountCodeService>();

// Bearer tokens. No issuer or audience to check, because Compose supplies only
// a signing key — see docs/architecture.md for why that is enough here.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Macrocenter API", Version = "v1" });

    // Lets the Authorize button in Swagger UI send a bearer token.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the token from POST /auth/login. No \"Bearer \" prefix needed.",
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = [],
    });

    // Surfaces the XML doc comments on controllers and DTOs in Swagger UI.
    var xmlPath = Path.Combine(AppContext.BaseDirectory, "Macrocenter.Api.xml");

    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// --- Startup -----------------------------------------------------------------
// Applying migrations on startup is a development convenience, deliberately
// limited to Development so a real deployment stays in control of its schema.
if (app.Environment.IsDevelopment())
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<MacrocenterDbContext>();

    await db.Database.MigrateAsync();
    await DatabaseSeeder.SeedAsync(db, CancellationToken.None);
}

// --- Pipeline ----------------------------------------------------------------
// The container serves plain HTTP; TLS is terminated upstream, so there is no
// HTTPS redirection here.
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Macrocenter API v1");
        options.DocumentTitle = "Macrocenter API";
    });
}

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
