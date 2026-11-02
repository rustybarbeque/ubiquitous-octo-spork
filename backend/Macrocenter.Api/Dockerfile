# Build context is the `backend/` folder (see docker-compose.yml), so that the
# Api project can reference the Domain / Infrastructure projects next to it.

# ---- restore + publish -------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy only the project files first so `dotnet restore` stays cached when
# source files change.
COPY Macrocenter.Api/Macrocenter.Api.csproj Macrocenter.Api/
COPY Macrocenter.Domain/Macrocenter.Domain.csproj Macrocenter.Domain/
COPY Macrocenter.Infrastructure/Macrocenter.Infrastructure.csproj Macrocenter.Infrastructure/
RUN dotnet restore Macrocenter.Api/Macrocenter.Api.csproj

COPY . .
RUN dotnet publish Macrocenter.Api/Macrocenter.Api.csproj \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    /p:UseAppHost=false

# ---- dev: hot reload via `dotnet watch` --------------------------------------
# Used by docker-compose.override.yml, which bind-mounts backend/ over /src.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dev
WORKDIR /src
ENV ASPNETCORE_ENVIRONMENT=Development \
    ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_USE_POLLING_FILE_WATCHER=1 \
    DOTNET_WATCH_RESTART_ON_RUDE_EDIT=1
EXPOSE 8080
CMD ["dotnet", "watch", "run", "--project", "Macrocenter.Api/Macrocenter.Api.csproj", "--non-interactive", "--urls", "http://0.0.0.0:8080"]

# ---- runtime -----------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# curl is not in the runtime image and the Compose healthcheck needs it.
RUN apt-get update \
    && apt-get install --no-install-recommends --yes curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "Macrocenter.Api.dll"]
