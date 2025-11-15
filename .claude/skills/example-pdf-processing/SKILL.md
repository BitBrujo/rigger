---
description: Extract text and data from PDF documents
---

# PDF Processing Skill

This skill helps extract text content, metadata, and structured data from PDF files.

## When to Use

Invoke this skill when the user asks to:
- Extract text from PDF documents
- Parse PDF forms or tables
- Analyze PDF metadata
- Convert PDFs to other formats

## Capabilities

- **Text Extraction**: Extract all text content from PDF files
- **Table Detection**: Identify and extract tabular data
- **Metadata Reading**: Get PDF properties (author, creation date, page count)
- **Page-by-Page Processing**: Handle large PDFs efficiently

## Tools Used

This skill primarily uses:
- `Bash` for running PDF processing tools (pdftotext, pdfinfo)
- `Read` for accessing PDF files
- `Write` for saving extracted content

## Workflow

1. **Check Dependencies**: Verify PDF tools are available (pdftotext, pdfinfo, pdftk)
2. **Validate Input**: Ensure the PDF file exists and is readable
3. **Extract Text**: Use pdftotext to extract text content
4. **Get Metadata**: Use pdfinfo to retrieve document properties
5. **Process Tables** (if needed): Use specialized tools for tabular data
6. **Format Output**: Save extracted content in requested format (text, JSON, CSV)

## Example Usage

```
User: "Extract all text from invoice.pdf"
Assistant: *Invokes PDF Processing skill*
- Checks if invoice.pdf exists
- Runs pdftotext invoice.pdf invoice.txt
- Returns extracted text
```

```
User: "Get the page count and metadata from report.pdf"
Assistant: *Invokes PDF Processing skill*
- Runs pdfinfo report.pdf
- Parses and formats metadata
- Returns document properties
```

## Installation Requirements

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install poppler-utils pdftk
```

**macOS**:
```bash
brew install poppler pdftk-java
```

**Docker** (already included in most base images):
```dockerfile
RUN apt-get update && apt-get install -y poppler-utils pdftk
```

## Error Handling

- If PDF tools are not installed, provide installation instructions
- Handle password-protected PDFs gracefully
- Report corrupted or invalid PDF files clearly
- Suggest alternatives if direct extraction fails

## Output Formats

- **Plain Text**: Raw text extraction (.txt)
- **Markdown**: Formatted text with headings preserved
- **JSON**: Structured data including metadata
- **CSV**: For tabular data extraction

## Best Practices

1. Always check if PDF tools are available before processing
2. For large PDFs, offer to process page ranges
3. Preserve document structure when possible
4. Clean up temporary files after processing
5. Validate extracted content for completeness
