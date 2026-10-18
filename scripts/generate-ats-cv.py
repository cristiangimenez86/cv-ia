"""Generate a single-column, two-page CV for resume parsers and recruiters.

The visual CV and this version share the same authored experience data. Keep the
reading order linear: no tables, sidebars, text boxes, or multi-column sections.
"""

from __future__ import annotations

import argparse
from html import escape
from pathlib import Path
import runpy

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate


ROOT = Path(__file__).resolve().parents[1]
shared = runpy.run_path(str(ROOT / "scripts" / "generate-two-page-cv.py"), run_name="cv_data")
CV = shared["CV"]
clean = shared["clean"]

INK = colors.HexColor("#252923")
MUTED = colors.HexColor("#4c574f")
COPPER = colors.HexColor("#946436")
LINE = colors.HexColor("#d9d7ce")

registerFontFamily("Segoe", normal="Segoe", bold="SegoeBold", italic="SegoeItalic")


def style(name: str, size: float, leading: float, *, color=INK, bold: bool = False,
          space_before: float = 0, space_after: float = 0) -> ParagraphStyle:
    return ParagraphStyle(
        name=name,
        fontName="SegoeBold" if bold else "Segoe",
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
        spaceBefore=space_before,
        spaceAfter=space_after,
        allowWidows=0,
        allowOrphans=0,
    )


STYLES = {
    "name": style("name", 21, 25, bold=True, space_after=1),
    "role": style("role", 10.2, 13, color=COPPER, bold=True, space_after=7),
    "contact": style("contact", 9.3, 12.8, color=MUTED, space_after=2),
    "section": style("section", 9.5, 13, color=COPPER, bold=True, space_before=11, space_after=5),
    "body": style("body", 9.55, 13.7, space_after=3),
    "skill": style("skill", 9.45, 13.5, space_after=2),
    "job": style("job", 10.2, 14, bold=True, space_before=8, space_after=1),
    "meta": style("meta", 9.2, 12.6, color=MUTED, space_after=3),
    "bullet": style("bullet", 9.45, 13.4, space_after=2),
    "small": style("small", 9.2, 12.5, space_after=2),
}


def paragraph(value: str, kind: str = "body") -> Paragraph:
    return Paragraph(escape(clean(value)), STYLES[kind])


def section(value: str) -> Paragraph:
    return paragraph(value.upper(), "section")


def bullets(items: list[str]) -> list[Paragraph]:
    return [paragraph("- " + item, "bullet") for item in items]


def job(item: dict, *, include_tags: bool = True) -> list:
    title = f'{item["title"]} - {item["company"]}'
    lines: list = [paragraph(title, "job"), paragraph(item["date"], "meta")]
    if item.get("context"):
        lines.append(paragraph(item["context"], "small"))
    lines.extend(bullets(item["bullets"]))
    if include_tags and item.get("tags"):
        lines.append(paragraph(", ".join(item["tags"]), "small"))
    return lines


def footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, 37, A4[0] - doc.rightMargin, 37)
    canvas.setFillColor(MUTED)
    canvas.setFont("Segoe", 8)
    canvas.drawString(doc.leftMargin, 24, "Cristian Gimenez")
    canvas.drawRightString(A4[0] - doc.rightMargin, 24, str(doc.page))
    canvas.restoreState()


def content(locale: str) -> list:
    data = CV[locale]
    es = locale == "es"
    contact = [
        "Barcelona, España | +34 685 890 502 | cristiangimenez86@gmail.com" if es else
        "Barcelona, Spain | +34 685 890 502 | cristiangimenez86@gmail.com",
        "linkedin.com/in/cristiangimenez86 | github.com/cristiangimenez86 | cv.cristiangimenez.com",
    ]
    story: list = [
        paragraph("Cristian Gimenez", "name"),
        paragraph(data["role"].upper(), "role"),
        *(paragraph(item, "contact") for item in contact),
        section("Perfil profesional" if es else "Professional Profile"),
        paragraph(data["profile"]),
        section("Habilidades" if es else "Skills"),
    ]
    for label, value in data["skills"]:
        story.append(paragraph(f"{label}: {value}", "skill"))

    story.append(section("Experiencia profesional" if es else "Professional Experience"))
    for item in data["first_jobs"]:
        story.append(KeepTogether(job(item)))

    ust = data["ust"]
    ust_lines = [paragraph(f'{ust["title"]} - {ust["company"]}', "job"),
                 paragraph(ust["date"], "meta")]
    for project in ust["projects"]:
        ust_lines.append(paragraph(project["name"], "small"))
        ust_lines.extend(bullets(project["bullets"]))
    story.append(KeepTogether(ust_lines))

    story.extend([PageBreak(), section("Experiencia profesional (continuación)" if es else
                                     "Professional Experience (continued)")])

    for item in data["later_jobs"]:
        story.append(KeepTogether(job(item, include_tags=False)))

    story.append(section("Experiencia anterior" if es else "Earlier Experience"))
    for item in data["earlier"]:
        story.append(paragraph(f'{item["company"]}{item["meta"]}: {item["description"]}', "small"))

    story.append(section("Educación" if es else "Education"))
    story.append(paragraph(f'{data["degree"]} - {data["institution"]}', "small"))
    story.append(paragraph("; ".join(data["courses"]), "small"))
    story.append(section("Certificaciones" if es else "Certifications"))
    for title, detail in data["certifications"]:
        story.append(paragraph(f"{title} - {detail}", "small"))
    story.append(section("Idiomas" if es else "Languages"))
    story.append(paragraph(" | ".join(f"{label}: {value}" for label, value in data["languages"]), "small"))
    return story


def generate(locale: str, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"cv-cristian-gimenez-{locale}-ats.pdf"
    doc = SimpleDocTemplate(
        str(target), pagesize=A4, leftMargin=48, rightMargin=48,
        topMargin=43, bottomMargin=49,
        title=f"Cristian Gimenez - CV ATS - {locale.upper()}",
        author="Cristian Gimenez",
        subject="Senior software engineer curriculum vitae",
    )
    doc.build(content(locale), onFirstPage=footer, onLaterPages=footer)
    return target


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=ROOT / "output" / "pdf")
    args = parser.parse_args()
    for language in ("en", "es"):
        print(generate(language, args.output_dir))
