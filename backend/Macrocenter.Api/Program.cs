using Macrocenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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

// --- Services ----------------------------------------------------------------
builder.Services.AddDbContext<MacrocenterDbContext>(options =>
    options
        .UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure())
        // Gives Postgres-idiomatic table and column names (items.sale_price).
        .UseSnakeCaseNamingConvention());

builder.Services.AddControllers();
builder.Services.AddProblemDetails();

builder.Services.AddCors(options =>
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
    options.SwaggerDoc("v1", new() { Title = "Macrocenter API", Version = "v1" }));

var app = builder.Build();

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
app.UseAuthorization();
app.MapControllers();

app.Run();
