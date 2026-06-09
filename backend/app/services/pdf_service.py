import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

def export_document_to_pdf(title: str, content: str) -> io.BytesIO:
    buffer = io.BytesIO()
    
    # Create the document template
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    content_style = ParagraphStyle(
        'DocContent',
        parent=styles['BodyText'],
        fontSize=11,
        leading=16,
        alignment=TA_JUSTIFY,
        spaceAfter=12
    )
    
    story = []
    
    # Document title
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 10))
    
    # Process contents by paragraphs (split on newlines)
    paragraphs = content.split('\n')
    for p_text in paragraphs:
        p_text = p_text.strip()
        # ReportLab paragraph tag escaping
        escaped_text = p_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        if escaped_text:
            story.append(Paragraph(escaped_text, content_style))
        else:
            story.append(Spacer(1, 8))
            
    doc.build(story)
    
    buffer.seek(0)
    return buffer
