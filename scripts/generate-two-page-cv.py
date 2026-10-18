"""Generate the two-page CV PDFs from the text in the approved source PDFs."""

from __future__ import annotations

import argparse
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
PAGE_W, PAGE_H = A4
MARGIN = 44
WIDTH = PAGE_W - 2 * MARGIN

INK = colors.HexColor("#252923")
MUTED = colors.HexColor("#4c574f")
SUBTLE = colors.HexColor("#687269")
COPPER = colors.HexColor("#946436")
LINE = colors.HexColor("#d9d7ce")
PAPER = colors.HexColor("#f7f5f0")
CARD = colors.HexColor("#fffdf9")
TINT = colors.HexColor("#f3eee6")

FONT_SETS = [
    (Path("C:/Windows/Fonts/segoeui.ttf"), Path("C:/Windows/Fonts/segoeuib.ttf"), Path("C:/Windows/Fonts/segoeuii.ttf")),
    (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf")),
]
font_files = next((files for files in FONT_SETS if all(path.is_file() for path in files)), None)
if font_files is None:
    raise RuntimeError("Segoe UI or DejaVu Sans font files are required to generate the CV PDFs")
for name, path in zip(("Segoe", "SegoeBold", "SegoeItalic"), font_files):
    pdfmetrics.registerFont(TTFont(name, str(path)))


def clean(value: str) -> str:
    return (value.replace("\u2011", "-").replace("\u2013", "-")
            .replace("\u2014", " - ").replace("\u2019", "'"))


def para(text: str, size: float = 8.6, leading: float = 12.0,
         color=INK, bold: bool = False, italic: bool = False) -> Paragraph:
    face = "SegoeBold" if bold else "SegoeItalic" if italic else "Segoe"
    style = ParagraphStyle(
        name=f"{face}-{size}-{leading}", fontName=face, fontSize=size,
        leading=leading, textColor=color, alignment=TA_LEFT,
        splitLongWords=True, spaceAfter=0, spaceBefore=0,
    )
    return Paragraph(escape(clean(text)), style)


def text_block(c: canvas.Canvas, text: str, x: float, top: float,
               width: float, size: float = 8.6, leading: float = 12.0,
               color=INK, bold: bool = False, italic: bool = False) -> float:
    block = para(text, size, leading, color, bold, italic)
    _, height = block.wrap(width, PAGE_H)
    block.drawOn(c, x, top - height)
    return top - height


def line(c: canvas.Canvas, x1: float, y: float, x2: float, color=LINE) -> None:
    c.setStrokeColor(color)
    c.setLineWidth(0.7)
    c.line(x1, y, x2, y)


def section(c: canvas.Canvas, number: str, title: str, y: float) -> float:
    c.setFillColor(COPPER)
    c.setFont("SegoeBold", 7.3)
    c.drawString(MARGIN, y - 7, f"{number} / {title.upper()}")
    line(c, MARGIN, y - 14, PAGE_W - MARGIN)
    return y - 23


def bullet(c: canvas.Canvas, text: str, x: float, top: float,
           width: float, size: float = 8.4, leading: float = 11.4) -> float:
    c.setFillColor(COPPER)
    c.circle(x + 2.2, top - 5.5, 1.6, stroke=0, fill=1)
    return text_block(c, text, x + 11, top, width - 11, size, leading)


def header(c: canvas.Canvas, data: dict, second: bool = False) -> float:
    c.setFillColor(PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    if second:
        c.setFillColor(INK)
        c.setFont("SegoeBold", 15)
        c.drawString(MARGIN, PAGE_H - MARGIN - 9, "Cristian Gimenez")
        c.setFillColor(COPPER)
        c.setFont("SegoeBold", 8)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN - 7, data["role"].upper())
        line(c, MARGIN, PAGE_H - MARGIN - 20, PAGE_W - MARGIN)
        return PAGE_H - MARGIN - 38

    c.setFillColor(COPPER)
    c.roundRect(MARGIN, PAGE_H - MARGIN - 28, 29, 29, 7, stroke=0, fill=1)
    c.setFillColor(CARD)
    c.setFont("SegoeBold", 10)
    c.drawCentredString(MARGIN + 14.5, PAGE_H - MARGIN - 18.5, "CG")
    c.setFillColor(INK)
    c.setFont("SegoeBold", 25)
    c.drawString(MARGIN + 40, PAGE_H - MARGIN - 11, "Cristian Gimenez")
    c.setFillColor(COPPER)
    c.setFont("SegoeBold", 9.2)
    c.drawString(MARGIN + 41, PAGE_H - MARGIN - 29, data["role"].upper())
    line(c, MARGIN, PAGE_H - MARGIN - 40, PAGE_W - MARGIN)

    top = PAGE_H - MARGIN - 50
    left = f'{data["location"]}    |    +34 685 890 502    |    cristiangimenez86@gmail.com'
    text_block(c, left, MARGIN, top, WIDTH, 8.65, 11.5, MUTED)
    links = "linkedin.com/in/cristiangimenez86    |    github.com/cristiangimenez86    |    cv.cristiangimenez.com"
    text_block(c, links, MARGIN, top - 15, WIDTH, 8.4, 11.2, COPPER)
    c.linkURL("mailto:cristiangimenez86@gmail.com", (MARGIN + 255, top - 12, MARGIN + 440, top + 1), relative=0)
    c.linkURL("https://www.linkedin.com/in/cristiangimenez86", (MARGIN, top - 28, MARGIN + 160, top - 14), relative=0)
    c.linkURL("https://github.com/cristiangimenez86", (MARGIN + 166, top - 28, MARGIN + 340, top - 14), relative=0)
    c.linkURL("https://cv.cristiangimenez.com", (MARGIN + 344, top - 28, PAGE_W - MARGIN, top - 14), relative=0)
    return top - 36


def footer(c: canvas.Canvas, data: dict, page: int) -> None:
    line(c, MARGIN, 31, PAGE_W - MARGIN)
    c.setFillColor(SUBTLE)
    c.setFont("Segoe", 7)
    c.drawString(MARGIN, 19, f'Cristian Gimenez  /  {data["role"]}')
    c.setFillColor(COPPER)
    c.setFont("SegoeBold", 7)
    c.drawRightString(PAGE_W - MARGIN, 19, f"{page} / 2")


def achievements(c: canvas.Canvas, items: list[str], y: float) -> float:
    col_gap = 18
    col_w = (WIDTH - col_gap) / 2
    row_top = y
    for row in range(2):
        bottoms = []
        for col in range(2):
            index = row * 2 + col
            bottoms.append(bullet(c, items[index], MARGIN + col * (col_w + col_gap), row_top, col_w, 8.6, 11.7))
        row_top = min(bottoms) - 7
    return row_top - 2


def skills(c: canvas.Canvas, data: dict, y: float) -> float:
    entries = data["skills"]
    gap = 11
    pad = 12
    col_w = (WIDTH - gap) / 2
    columns = [entries[:4], entries[4:]]
    measured = []
    for column in columns:
        height = pad
        for label, body in column:
            block = para(body, 8.3, 10.9, MUTED)
            _, h = block.wrap(col_w - 2 * pad, PAGE_H)
            height += 10 + h + 8
        measured.append(height + pad - 7)
    box_h = max(measured)
    for col, column in enumerate(columns):
        x = MARGIN + col * (col_w + gap)
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, y - box_h, col_w, box_h, 9, stroke=1, fill=1)
        top = y - pad
        for label, body in column:
            c.setFillColor(COPPER)
            c.setFont("SegoeBold", 7.25)
            c.drawString(x + pad, top - 7, label.upper())
            top -= 11
            top = text_block(c, body, x + pad, top, col_w - 2 * pad, 8.3, 10.9, MUTED) - 8
    return y - box_h - 11


def tag_row(c: canvas.Canvas, tags: list[str], y: float, x: float = MARGIN,
            width: float = WIDTH) -> float:
    cursor = x
    bottom = y
    for tag in tags:
        tag = clean(tag)
        tag_w = pdfmetrics.stringWidth(tag, "Segoe", 7.7) + 13
        if cursor + tag_w > x + width:
            cursor = x
            bottom -= 15
        c.setFillColor(TINT)
        c.roundRect(cursor, bottom - 12, tag_w, 13, 3, stroke=0, fill=1)
        c.setFillColor(COPPER)
        c.setFont("Segoe", 7.7)
        c.drawString(cursor + 6.5, bottom - 8.7, tag)
        cursor += tag_w + 5
    return bottom - 18


def job(c: canvas.Canvas, item: dict, y: float, compact: bool = False) -> float:
    c.setFillColor(INK)
    c.setFont("SegoeBold", 10.0 if not compact else 9.5)
    c.drawString(MARGIN, y - 9, item["title"])
    c.setFillColor(SUBTLE)
    c.setFont("SegoeBold", 7.5)
    c.drawRightString(PAGE_W - MARGIN, y - 8, clean(item["date"]))
    y -= 15
    c.setFillColor(COPPER)
    c.setFont("SegoeBold", 8.1)
    c.drawString(MARGIN, y - 7, item["company"])
    y -= 13
    if item.get("context"):
        y = text_block(c, item["context"], MARGIN, y, WIDTH, 8.0, 11.0, MUTED, italic=True) - 3
    for point in item["bullets"]:
        y = bullet(c, point, MARGIN, y, WIDTH, 8.7, 11.8) - 4
    if item.get("tags"):
        y = tag_row(c, item["tags"], y - 1)
    return y - (4 if compact else 10)


def ust_job(c: canvas.Canvas, item: dict, y: float) -> float:
    c.setFillColor(INK)
    c.setFont("SegoeBold", 9.5)
    c.drawString(MARGIN, y - 9, item["title"])
    c.setFillColor(SUBTLE)
    c.setFont("SegoeBold", 7.5)
    c.drawRightString(PAGE_W - MARGIN, y - 8, clean(item["date"]))
    y -= 15
    c.setFillColor(COPPER)
    c.setFont("SegoeBold", 8.1)
    c.drawString(MARGIN, y - 7, item["company"])
    y -= 13
    for project in item["projects"]:
        c.setFillColor(INK)
        c.setFont("SegoeBold", 8.5)
        c.drawString(MARGIN, y - 7, project["name"])
        y -= 11
        y = text_block(c, project["context"], MARGIN, y, WIDTH, 8.0, 10.8, MUTED, italic=True) - 3
        for point in project["bullets"]:
            y = bullet(c, point, MARGIN, y, WIDTH, 8.6, 11.7) - 3
        if project.get("tags"):
            y = tag_row(c, project["tags"], y)
        else:
            y -= 4
    return y - 4


def earlier_roles(c: canvas.Canvas, items: list[dict], y: float) -> float:
    for item in items:
        c.setFillColor(COPPER)
        c.circle(MARGIN + 2, y - 5.5, 1.6, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("SegoeBold", 8.5)
        c.drawString(MARGIN + 11, y - 8, item["company"])
        c.setFillColor(SUBTLE)
        c.setFont("Segoe", 7.7)
        date_x = MARGIN + 16 + pdfmetrics.stringWidth(item["company"], "SegoeBold", 8.5)
        c.drawString(date_x, y - 8, clean(item["meta"]))
        y -= 13
        y = text_block(c, item["description"], MARGIN + 11, y, WIDTH - 11, 8.5, 11.3, MUTED) - 2
    return y


def education(c: canvas.Canvas, data: dict, y: float) -> float:
    gap = 22
    col_w = (WIDTH - gap) / 2
    x2 = MARGIN + col_w + gap
    c.setFillColor(INK)
    c.setFont("SegoeBold", 8.8)
    c.drawString(MARGIN, y - 8, data["degree"])
    left = text_block(c, data["institution"], MARGIN, y - 13, col_w, 8.0, 10.5, MUTED) - 3
    for course in data["courses"]:
        left = bullet(c, course, MARGIN, left, col_w, 8.0, 10.4) - 2

    right = y
    for title, detail in data["certifications"]:
        c.setFillColor(INK)
        c.setFont("SegoeBold", 8.8)
        c.drawString(x2, right - 8, title)
        right = text_block(c, detail, x2, right - 13, col_w, 8.0, 10.5, MUTED) - 7
    return min(left, right) - 7


def languages(c: canvas.Canvas, values: list[tuple[str, str]], y: float) -> float:
    for index, (label, value) in enumerate(values):
        x = MARGIN + index * 210
        c.setFillColor(INK)
        c.setFont("SegoeBold", 8.6)
        c.drawString(x, y - 9, f"{label}:")
        value_x = x + pdfmetrics.stringWidth(f"{label}:", "SegoeBold", 8.6) + 6
        c.setFillColor(MUTED)
        c.setFont("Segoe", 8.6)
        c.drawString(value_x, y - 9, value)
    return y - 16


CV = {
    "en": {
        "role": "Senior Software Engineer",
        "location": "Barcelona, Spain",
        "labels": ["Profile", "Key Achievements", "Skills", "Experience", "Experience / Continued", "Earlier Roles", "Education & Certifications", "Languages"],
        "profile": "Senior Software Engineer with 14+ years of experience in .NET, Azure, and React. At PayRetailers, I delivered a payment integration end to end as the sole developer, using documented requirements and staged review to guide AI-assisted development through an internal OpenSpec-based AI SDLC. At UST, I improved a Dell application's performance by ~30% and brought test coverage to ~80%.",
        "achievements": [
            "Migrated multiple services from Azure Functions to Service Bus worker architecture, enabling Kubernetes-native deployments.",
            "Led an end-to-end virtual credit card system (AMEX/Mastercard) from inception to deployment.",
            "Integrated 300 Burger King stores into an existing ecosystem via a .NET hosted service.",
            "Improved a critical enterprise app performance by ~30% and brought test coverage to ~80%.",
        ],
        "skills": [
            ("Backend", ".NET 10, Entity Framework, RESTful APIs, Worker Services, Minimal APIs, Polly, xUnit, Moq"),
            ("Frontend", "Angular, React, TypeScript, JavaScript, Node"),
            ("Data", "SQL Server, Oracle, DynamoDB, Cosmos DB, MongoDB, Redis"),
            ("Cloud & Messaging", "Azure Functions, Service Bus, Key Vault, App Insights, AWS Lambda, API Gateway, SQS, SNS"),
            ("DevOps & Observability", "Azure DevOps, Bitbucket Pipelines, GitHub Actions, Docker, Kubernetes, Terraform, OpenTelemetry, Grafana"),
            ("Practices", "AI SDLC / OpenSpec, spec-driven development, DDD, TDD, CQRS, Event-Driven, Agile / Scrum / Kanban"),
            ("AI Tooling", "Claude Code, Cursor"),
        ],
        "first_jobs": [
            {"title": "Senior Software Engineer", "date": "Jul 2025 - Present", "company": "PayRetailers · Barcelona, Spain", "context": "Payment processing platform with business-critical integrations.",
             "bullets": ["Migrated multiple services from Azure Functions to Service Bus-based worker architecture, enabling Kubernetes-native deployments.", "Implemented a payment integration as sole developer using PayRetailers' internal OpenSpec-based AI SDLC, reviewing AI-generated code against approved requirements."],
             "tags": [".NET 8", "Cosmos DB", "Docker", "Kubernetes", "Terraform"]},
            {"title": "Full Stack .NET Core Developer", "date": "Jan 2024 - Jul 2025", "company": "Travelport · Barcelona, Spain", "context": "Virtual payment solution for AMEX and Mastercard card generation.",
             "bullets": ["Architected the system from scratch integrating Azure Functions, Cosmos DB, and Key Vault with end-to-end traceability.", "Implemented Azure Key Vault and Auth0, strengthening authentication and secrets management."],
             "tags": [".NET 8", "Azure Functions", "EF Core", "React", "Cosmos DB", "Key Vault", "Docker", "Auth0"]},
        ],
        "ust": {"title": "Full Stack .NET Core Developer", "date": "Oct 2021 - May 2023", "company": "UST · Barcelona, Spain", "projects": [
            {"name": "RB Iberia (Burger King Portugal & Spain)", "context": "Integration of 300 Burger King Portugal stores into the existing Spain ecosystem.",
             "bullets": ["Led the integration by building a .NET 7 hosted service to ingest data, validate business rules, and call internal APIs with reliable data flow.", "Delivered the project under tight deadlines while maintaining high reliability and production readiness."],
             "tags": [".NET 7", "SQL Server", "Entity Framework", "Background Services"]},
            {"name": "Dell", "context": "Critical enterprise application with opportunities for technical improvement.",
             "bullets": ["Enhanced application performance by 30% through code optimization and refactoring.", "Achieved 80% test coverage by writing missing unit tests and implementing best practices."]},
        ]},
        "later_jobs": [
            {"title": "Freelance .NET Core Developer", "date": "Nov 2019 - Oct 2021", "company": "Rosario, Argentina", "context": "End-to-end improvements across multiple .NET applications, focusing on modernization and stability.",
             "bullets": ["Migrated 5+ legacy applications to modern architectures, reducing technical debt and simplifying ongoing maintenance.", "Built REST APIs and backend services in .NET Core for clients across different industries, delivering production-ready solutions."],
             "tags": [".NET Core", ".NET Framework", "SQL Server", "Entity Framework", "REST APIs"]},
            {"title": ".NET Core Developer", "date": "Oct 2018 - Apr 2019", "company": "Adrenalin Media · Sydney, Australia", "context": "Hungry Jack's (Burger King) - high-traffic consumer app with thousands of active users.",
             "bullets": ["Improved app stability, reducing connectivity-related issues by 40%.", "Increased positive feedback on app stores by 20%."],
             "tags": [".NET Core 2", "AWS (EC2, Lambda, DynamoDB, Redis, SQS, SNS, SES)", "Azure DevOps", "Octopus Deploy"]},
            {"title": "Full Stack Developer", "date": "Jun 2016 - Jun 2018", "company": "Stratos Technology Partners · Christchurch, New Zealand", "context": "",
             "bullets": ["WineWorks: Rebuilt a legacy application from scratch, migrating 200+ clients. Reduced production errors by 30%.", "Metrocard: Developed a secure payment portal for 200K+ active users, reducing transaction errors by 20%."],
             "tags": [".NET Web API", "AngularJS", "SQL Server", "Entity Framework"]},
        ],
        "earlier": [
            {"company": "Rosario Bus S.A.", "meta": "· Nov 2015 - Apr 2016 · Rosario, Argentina", "description": "Built an internal driver communication platform, reducing paper usage by 70%."},
            {"company": "Globant", "meta": "· Jul 2013 - Nov 2015 · Rosario, Argentina", "description": "Developed dispatch planning systems for Tenaris, streamlining business processes."},
            {"company": "Neoris", "meta": "· Nov 2011 - Jul 2013 · Rosario, Argentina", "description": "SharePoint 2010 solutions for the NeoEnergia group (8 companies)."},
        ],
        "degree": "BSc Computer Systems Analysis",
        "institution": "Instituto Superior San Pablo, Villa Constitución, Argentina",
        "courses": ["Angular: Zero to Expert (2023)", "React: Zero to Expert (2024)", "AI Eng. with Claude Code (2026)"],
        "certifications": [("Google Associate Cloud Engineer", "April 2023 · ID: aOL1JI"), ("Google Cloud Digital Leader", "December 2022 · ID: QSLPH9")],
        "languages": [("Spanish", "Native"), ("English", "Professional (B2)")],
    },
    "es": {
        "role": "Ingeniero de Software Senior",
        "location": "Barcelona, España",
        "labels": ["Perfil", "Logros Clave", "Habilidades", "Experiencia", "Experiencia / Continuación", "Roles Anteriores", "Educación & Certificaciones", "Idiomas"],
        "profile": "Ingeniero de Software Senior con más de 14 años de experiencia en .NET, Azure y React. En PayRetailers implementé una integración de pagos de punta a punta como único desarrollador, usando requisitos documentados y revisión por etapas para guiar el desarrollo con IA mediante un AI SDLC interno basado en OpenSpec. En UST mejoré ~30% el rendimiento de una aplicación de Dell y llevé la cobertura de pruebas a ~80%.",
        "achievements": [
            "Migré múltiples servicios de Azure Functions a arquitectura de workers con Service Bus, habilitando despliegues nativos en Kubernetes.",
            "Lideré un sistema de tarjetas virtuales (AMEX/Mastercard) de punta a punta con foco en seguridad.",
            "Integré 300 locales de Burger King al ecosistema existente con un hosted service en .NET.",
            "Mejoré el rendimiento de una app crítica en ~30% y llevé la cobertura de tests a ~80%.",
        ],
        "skills": [
            ("Backend", ".NET 10, Entity Framework, RESTful APIs, Worker Services, Minimal APIs, Polly, xUnit, Moq"),
            ("Frontend", "Angular, React, TypeScript, JavaScript, Node"),
            ("Datos", "SQL Server, Oracle, DynamoDB, Cosmos DB, MongoDB, Redis"),
            ("Cloud & Mensajería", "Azure Functions, Service Bus, Key Vault, App Insights, AWS Lambda, API Gateway, SQS, SNS"),
            ("DevOps & Observabilidad", "Azure DevOps, Bitbucket Pipelines, GitHub Actions, Docker, Kubernetes, Terraform, OpenTelemetry, Grafana"),
            ("Prácticas", "AI SDLC / OpenSpec, desarrollo guiado por especificaciones, DDD, TDD, CQRS, Event-Driven, Agile / Scrum / Kanban"),
            ("Herramientas IA", "Claude Code, Cursor"),
        ],
        "first_jobs": [
            {"title": "Ingeniero de Software Senior", "date": "Jul 2025 - Presente", "company": "PayRetailers · Barcelona, España", "context": "Plataforma de procesamiento de pagos con integraciones críticas.",
             "bullets": ["Migré múltiples servicios de Azure Functions a arquitectura de workers con Service Bus, habilitando despliegues en Kubernetes.", "Implementé una integración de pagos como único desarrollador con el AI SDLC interno basado en OpenSpec, revisando el código generado con IA contra requisitos aprobados."],
             "tags": [".NET 8", "Cosmos DB", "Docker", "Kubernetes", "Terraform"]},
            {"title": "Desarrollador Full Stack .NET Core", "date": "Ene 2024 - Jul 2025", "company": "Travelport · Barcelona, España", "context": "Solución de pagos virtuales para emisión de tarjetas AMEX y Mastercard.",
             "bullets": ["Diseñé la arquitectura desde cero integrando Azure Functions, Cosmos DB y Key Vault con trazabilidad end-to-end.", "Implementé Azure Key Vault y Auth0, fortaleciendo autenticación y gestión de secretos."],
             "tags": [".NET 8", "Azure Functions", "EF Core", "React", "Cosmos DB", "Key Vault", "Docker", "Auth0"]},
        ],
        "ust": {"title": "Desarrollador Full Stack .NET Core", "date": "Oct 2021 - May 2023", "company": "UST · Barcelona, España", "projects": [
            {"name": "RB Iberia (Burger King Portugal & Spain)", "context": "Integración de 300 locales de Burger King Portugal al ecosistema operativo de España.",
             "bullets": ["Lideré la integración construyendo un servicio hospedado en .NET 7 para ingerir datos, validar reglas de negocio y consumir APIs internas.", "Entregué el proyecto con plazos ajustados, manteniendo alta confiabilidad y preparación para producción."],
             "tags": [".NET 7", "SQL Server", "Entity Framework", "Background Services"]},
            {"name": "Dell", "context": "Aplicación empresarial crítica con oportunidades de mejora técnica.",
             "bullets": ["Mejoré el rendimiento de la aplicación en 30% mediante optimización de código y refactorización.", "Alcancé 80% de cobertura de tests escribiendo pruebas unitarias faltantes."]},
        ]},
        "later_jobs": [
            {"title": "Freelance .NET Core Developer", "date": "Nov 2019 - Oct 2021", "company": "Rosario, Argentina", "context": "Mejoras end-to-end en múltiples aplicaciones .NET, con foco en modernización y estabilidad.",
             "bullets": ["Migré más de 5 aplicaciones legacy a arquitecturas modernas, reduciendo deuda técnica y simplificando mantenimiento.", "Desarrollé APIs REST y servicios backend en .NET Core para clientes de distintos sectores."],
             "tags": [".NET Core", ".NET Framework", "SQL Server", "Entity Framework", "REST APIs"]},
            {"title": "Desarrollador .NET Core", "date": "Oct 2018 - Abr 2019", "company": "Adrenalin Media · Sydney, Australia", "context": "Hungry Jack's (Burger King) - app de alto tráfico con miles de usuarios activos.",
             "bullets": ["Mejoré la estabilidad de la app, reduciendo incidentes de conectividad en 40%.", "Aumenté el feedback positivo en tiendas de aplicaciones en 20%."],
             "tags": [".NET Core 2", "AWS (EC2, Lambda, DynamoDB, Redis, SQS, SNS, SES)", "Azure DevOps", "Octopus Deploy"]},
            {"title": "Desarrollador Full Stack", "date": "Jun 2016 - Jun 2018", "company": "Stratos Technology Partners · Christchurch, Nueva Zelanda", "context": "",
             "bullets": ["WineWorks: Reescribí app legacy desde cero, migrando 200+ clientes. Reduje errores en órdenes de producción en 30%.", "Metrocard: Portal de pagos seguro para 200K+ usuarios del transporte público, reduciendo errores de transacción en 20%."],
             "tags": [".NET Web API", "AngularJS", "SQL Server", "Entity Framework"]},
        ],
        "earlier": [
            {"company": "Rosario Bus S.A.", "meta": "· Nov 2015 - Abr 2016 · Rosario, Argentina", "description": "Plataforma de comunicación para choferes, reduciendo uso de papel en 70%."},
            {"company": "Globant", "meta": "· Jul 2013 - Nov 2015 · Rosario, Argentina", "description": "Sistemas de planificación de despacho para Tenaris, agilizando procesos de negocio."},
            {"company": "Neoris", "meta": "· Nov 2011 - Jul 2013 · Rosario, Argentina", "description": "Soluciones SharePoint 2010 para el grupo NeoEnergia (8 empresas)."},
        ],
        "degree": "Lic. en Análisis de Sistemas",
        "institution": "Instituto Superior San Pablo, Villa Constitución, Argentina",
        "courses": ["Angular: De cero a Experto (2023)", "React: De cero a Experto (2024)", "Ing. IA con Claude Code (2026)"],
        "certifications": [("Google Associate Cloud Engineer", "Abril 2023 · ID: aOL1JI"), ("Google Cloud Digital Leader", "Diciembre 2022 · ID: QSLPH9")],
        "languages": [("Español", "Nativo"), ("Inglés", "Profesional (B2)")],
    },
}


def generate(locale: str, target: Path) -> None:
    data = CV[locale]
    target.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(target), pagesize=A4, pageCompression=1)
    c.setTitle(f'Cristian Gimenez - CV - {locale.upper()}')
    c.setAuthor('Cristian Gimenez')
    c.setSubject('Senior software engineer curriculum vitae')

    y = header(c, data)
    y = section(c, '01', data['labels'][0], y)
    y = text_block(c, data['profile'], MARGIN, y, WIDTH, 9.3, 12.8, MUTED) - 14
    y = section(c, '02', data['labels'][1], y)
    y = achievements(c, data['achievements'], y) - 3
    y = section(c, '03', data['labels'][2], y)
    y = skills(c, data, y)
    y = section(c, '04', data['labels'][3], y)
    for item in data['first_jobs']:
        y = job(c, item, y, compact=True)
    if y < 42:
        raise ValueError(f'{locale} first page overflows: y={y:.1f}')
    print(f'{locale} page 1 bottom: {y:.1f} pt')
    footer(c, data, 1)
    c.showPage()

    y = header(c, data, second=True)
    y = section(c, '04', data['labels'][4], y)
    y = ust_job(c, data['ust'], y)
    for item in data['later_jobs']:
        y = job(c, item, y, compact=True)
    y = section(c, '05', data['labels'][5], y)
    y = earlier_roles(c, data['earlier'], y) - 2
    y = section(c, '06', data['labels'][6], y)
    y = education(c, data, y)
    y = section(c, '07', data['labels'][7], y)
    y = languages(c, data['languages'], y)
    if y < 42:
        raise ValueError(f'{locale} second page overflows: y={y:.1f}')
    print(f'{locale} page 2 bottom: {y:.1f} pt')
    footer(c, data, 2)
    c.showPage()
    c.save()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'output' / 'pdf')
    args = parser.parse_args()
    for language in ('en', 'es'):
        generate(language, args.output_dir / f'cv-cristian-gimenez-{language}.pdf')
