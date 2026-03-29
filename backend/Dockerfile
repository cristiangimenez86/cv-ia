# Multi-stage Dockerfile for the ASP.NET Core backend API.
#
# Build:  docker build -f backend/Dockerfile -t cristiangimenez86/cv-api:latest .
# Run:    docker run -p 8080:8080 cristiangimenez86/cv-api:latest

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/src/CvIa.Api/CvIa.Api.csproj backend/src/CvIa.Api/
COPY backend/src/CvIa.Application/CvIa.Application.csproj backend/src/CvIa.Application/
COPY backend/src/CvIa.Domain/CvIa.Domain.csproj backend/src/CvIa.Domain/
COPY backend/src/CvIa.Infrastructure/CvIa.Infrastructure.csproj backend/src/CvIa.Infrastructure/

RUN dotnet restore backend/src/CvIa.Api/CvIa.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/src/CvIa.Api/CvIa.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_EnableDiagnostics=0

# wget: healthchecks; libgssapi-krb5-2: Npgsql may probe Kerberos libs on connect (avoids noisy load errors in minimal images)
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish ./

# CV markdown for chat (CvApi:MarkdownContentRoot defaults to ../../../content → /content in container)
COPY content/ /content/

EXPOSE 8080

ENTRYPOINT ["dotnet", "CvIa.Api.dll"]

