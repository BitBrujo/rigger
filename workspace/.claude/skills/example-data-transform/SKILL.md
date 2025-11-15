---
description: Transform and convert data between different formats (JSON, CSV, XML, YAML)
---

# Data Transform Skill

This skill handles data conversion, transformation, and restructuring between various formats.

## When to Use

Invoke this skill when the user asks to:
- Convert between data formats (JSON ↔ CSV ↔ XML ↔ YAML)
- Reshape or restructure data
- Filter, sort, or aggregate data
- Merge multiple data sources
- Validate data schemas
- Clean and normalize data

## Capabilities

- **Format Conversion**: Convert between JSON, CSV, XML, YAML, TOML
- **Data Reshaping**: Flatten nested structures or create hierarchies
- **Filtering**: Extract specific fields or records
- **Aggregation**: Group, sum, average, count operations
- **Merging**: Combine data from multiple sources
- **Validation**: Check data against schemas
- **Cleaning**: Remove duplicates, handle missing values

## Tools Used

This skill primarily uses:
- `Read` for loading data files
- `Write` for saving transformed data
- `Bash` for running data processing tools (jq, csvkit, yq)
- `Grep` for pattern-based filtering

## Supported Formats

### Input Formats
- JSON (`.json`)
- CSV/TSV (`.csv`, `.tsv`)
- XML (`.xml`)
- YAML (`.yaml`, `.yml`)
- TOML (`.toml`)
- Excel (`.xlsx`) - via conversion tools

### Output Formats
- JSON (pretty or minified)
- CSV (with custom delimiters)
- XML (with custom formatting)
- YAML (indented)
- Markdown tables
- SQL INSERT statements

## Workflow

1. **Detect Format**: Identify input data format
2. **Validate Input**: Check if data is well-formed
3. **Load Data**: Read data into memory
4. **Transform**: Apply requested operations
5. **Validate Output**: Ensure transformation succeeded
6. **Format Output**: Convert to requested format
7. **Save Result**: Write to file or return inline

## Example Usage

```
User: "Convert users.json to CSV"
Assistant: *Invokes Data Transform skill*
- Reads users.json
- Flattens nested objects if needed
- Generates CSV with headers
- Saves to users.csv
```

```
User: "Extract all email addresses from contacts.xml and save as JSON"
Assistant: *Invokes Data Transform skill*
- Parses contacts.xml
- Extracts email fields
- Creates JSON array
- Saves to emails.json
```

```
User: "Merge data from sales-q1.csv and sales-q2.csv"
Assistant: *Invokes Data Transform skill*
- Reads both CSV files
- Validates headers match
- Combines rows
- Removes duplicates if needed
- Saves to sales-combined.csv
```

## Common Transformations

### JSON to CSV
```bash
jq -r '(.[0] | keys_unsorted) as $keys | $keys, map([.[ $keys[] ]])[] | @csv' input.json > output.csv
```

### CSV to JSON
```bash
csvjson input.csv > output.json
```

### JSON to YAML
```bash
yq -P input.json > output.yaml
```

### XML to JSON
```bash
xq . input.xml > output.json
```

### Flatten Nested JSON
```bash
jq 'flatten' input.json > output.json
```

### Filter JSON by Field
```bash
jq '[.[] | select(.status == "active")]' input.json > output.json
```

## Data Cleaning Operations

### Remove Duplicates
```bash
jq 'unique_by(.id)' input.json
```

### Handle Missing Values
```bash
jq 'map(. + {field: (.field // "default")})' input.json
```

### Normalize Strings
```bash
jq 'map(.name |= (. | ascii_downcase | gsub("\\s+"; " ") | ltrimstr(" ") | rtrimstr(" ")))' input.json
```

### Type Conversion
```bash
jq 'map(.price |= tonumber)' input.json
```

## Aggregation Examples

### Group and Count
```bash
jq 'group_by(.category) | map({category: .[0].category, count: length})' input.json
```

### Sum by Group
```bash
jq 'group_by(.category) | map({category: .[0].category, total: map(.amount) | add})' input.json
```

### Average Calculation
```bash
jq '[.[] | .value] | add / length' input.json
```

## Schema Validation

```bash
# Using jsonschema
jsonschema -i data.json schema.json

# Using yq for YAML
yq eval 'has("required_field")' data.yaml
```

## Installation Requirements

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install jq csvkit yq xmlstarlet
```

**macOS**:
```bash
brew install jq csvkit yq xmlstarlet
```

**Docker**:
```dockerfile
RUN apt-get update && apt-get install -y jq python3-csvkit yq xmlstarlet
```

## Output Formatting Options

- **Pretty Print**: Indented, readable format
- **Minified**: Single line, no whitespace
- **Sorted Keys**: Alphabetically ordered fields
- **Custom Delimiters**: Tab, pipe, semicolon for CSV
- **Indentation**: 2-space, 4-space, tabs for YAML/JSON

## Error Handling

- Validate input format before processing
- Handle malformed data gracefully
- Provide clear error messages for invalid schemas
- Suggest fixes for common issues
- Offer fallback options if direct conversion fails

## Best Practices

1. Always validate data before transformation
2. Preserve data types when possible (numbers, booleans, dates)
3. Handle missing or null values explicitly
4. Test with sample data first
5. Create backups of original files
6. Use streaming for large files (>100MB)
7. Document transformation steps
