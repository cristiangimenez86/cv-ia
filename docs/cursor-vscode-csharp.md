# Cursor / VS Code: navegación C# (Go to Definition / Implementation)

## Qué usa este repo

- **`backend/CvIa.sln`** — solución **clásica** (`.sln`) con todos los proyectos. Tiene mejor soporte en OmniSharp / extensiones C# que el formato **`.slnx`**.
- **`backend/CvIa.slnx`** — se puede seguir usando con `dotnet` CLI; para el IDE conviene la `.sln`.
- **`.vscode/settings.json`** — `dotnet.defaultSolution`: `backend/CvIa.sln` para que, al abrir la raíz del monorepo, el language server cargue la solución correcta.
- **`cv-ia.code-workspace`** — opcional: **File → Open Workspace from File…** y elegir este archivo (misma configuración explícita).

## Extensiones

Instalá **C#** (`ms-dotnettools.csharp`) y, si podés, **C# Dev Kit** (`ms-dotnettools.csdevkit`).

## Si F12 / Ctrl+F12 siguen sin ir

1. **Developer: Reload Window**
2. Paleta **`.NET: Restart Language Server`** (C# Dev Kit) u **OmniSharp: Restart OmniSharp** (stack clásico)
3. Verificá `dotnet --version` (SDK reciente)
4. **Abrir solo `backend/`** como carpeta: **File → Open Folder → `cv-ia/backend`** — la solución `CvIa.sln` queda en la raíz del workspace y el IDE la encuentra sin rutas relativas raras.

## Atajos

- **F12** — Ir a definición
- **Ctrl+F12** — Ir a implementación (desde el miembro de interfaz o desde la interfaz hacia implementaciones)

Sobre `CompleteAsync`: en el controlador puede ir primero a `IChatCompletionService`; desde ahí **Ctrl+F12** lista `OpenAiChatCompletionService` y `StubChatCompletionService`.
