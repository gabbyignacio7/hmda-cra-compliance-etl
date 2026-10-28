# Architecture Overview

This document describes the architecture of the HMDA/CRA Compliance Tool.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                      (React + TypeScript)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ File Upload  │  │  Dashboard   │  │  Export/Download     │  │
│  │  Component   │  │   Display    │  │     Component        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
├─────────┴─────────────────┴──────────────────────┴──────────────┤
│                       ETL Engine Layer                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │  Parsers  │ │ Transform │ │   Merge   │ │   Utilities   │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    Field Maps & Types                           │
│  ┌────────────────────┐  ┌────────────────────────────────┐    │
│  │  ENCOMPASS_FIELD   │  │  COMPLIANCE_REPORTER_FIELD     │    │
│  │       _MAP         │  │           _MAP                 │    │
│  └────────────────────┘  └────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
client/src/
├── components/           # React UI components
│   ├── ui/              # Reusable UI primitives (shadcn/ui)
│   ├── file-upload.tsx  # Single file upload
│   ├── multi-file-upload.tsx  # Multi-file upload
├── hooks/               # Custom React hooks
├── lib/                 # Core business logic
│   ├── etl/            # ETL module (modular)
│   │   ├── index.ts    # Re-exports
│   │   ├── types.ts    # TypeScript interfaces
│   │   ├── field-maps.ts  # Column mappings
│   │   ├── parsers.ts  # File parsers
│   │   ├── transform.ts  # Data transformation
│   │   ├── merge.ts    # Data merging
│   │   └── utils.ts    # Utility functions
│   ├── etl-engine.ts   # Legacy compatibility layer
│   └── cra-wiz-transform.ts  # CRA Wiz specific logic
├── pages/              # Page components
└── __tests__/          # Unit tests
```

## ETL Pipeline

### 1. File Parsing

**Supported Formats:**
- Encompass HMDA Export (`.xlsx`)
- LaserPro/Compliance Reporter (`.txt`, `.csv`)
- Supplemental/Additional Fields (`.xlsx`)

**Delimiter Auto-Detection:**
The system automatically detects delimiters in text files:
- Pipe (`|`)
- Tilde (`~`)
- Tab (`\t`)
- Semicolon (`;`)

### 2. Field Normalization

Input fields are mapped to a standard internal format:

```typescript
// Example: Encompass field name -> Standard name
'Ethnicity of Applicant or Borrower: 1' -> 'Ethnicity_1'
'Automated Underwriting System: 1' -> 'AUSystem1'
```

### 3. Data Merging

Files are merged using a priority system:
1. **ULI** (Universal Loan Identifier) - Primary key
2. **Loan Number** - Secondary key
3. **Address + City** - Fallback key

**Source Priority:** Encompass > LaserPro

### 4. Deduplication

Duplicate detection using:
- ULI matching (exact)
- Address + City matching (case-insensitive)

### 5. Transformation

Data is transformed to CRA Wiz 128-column format:

```typescript
const CRA_WIZ_128_COLUMNS = [
  'Branch_Name',    // Col 0
  'Branch',         // Col 1
  'LEI',            // Col 2
  'ULI',            // Col 3
  // ... 124 more columns
];
```

### 6. Validation & Auto-Correction

- Census tract formatting (11 digits, leading zeros)
- AUS system code mapping (1-6)
- AUS result code mapping (1-17)
- Rate type derivation (Fixed/Variable)
- Date format standardization

## Key Components

### SbslRow Interface

The core data structure for all row operations:

```typescript
interface SbslRow {
  [key: string]: any;
}
```

### Field Maps

Two main mapping systems:

1. **ENCOMPASS_FIELD_MAP** - Maps verbose Encompass column names to standard names
2. **COMPLIANCE_REPORTER_FIELD_MAP** - Maps positional HMDA LAR fields to standard names

### Utility Functions

| Function | Purpose |
|----------|---------|
| `findFieldValue` | Find value using multiple field name variations |
| `mapAUSystem` | Map AUS text to HMDA codes (1-6) |
| `mapAUSResult` | Map AUS result text to HMDA codes (1-17) |
| `formatCensusTract` | Format tract with leading zeros |
| `deriveRateType` | Determine Fixed (1) vs Variable (2) |
| `deriveVarTerm` | Calculate variable rate term in years |

## Data Flow

```
Input Files
    │
    ▼
┌───────────────┐
│    Parse      │  ← Detect format, extract rows
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Normalize   │  ← Map field names to standard
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Merge      │  ← Combine multiple sources
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  Deduplicate  │  ← Remove duplicates
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Transform   │  ← Convert to 128-column format
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Validate    │  ← Check & auto-correct
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Export     │  ← Generate Excel file
└───────────────┘
```

## Testing Strategy

### Unit Tests

Located in `client/src/__tests__/`:

- ETL utility functions
- Field mapping accuracy
- Data transformation logic
- Parser behavior

### Integration Tests

Test complete data flows:

- Full file processing
- Multi-source merging
- Export generation

## Performance Considerations

- **Streaming**: Large files are processed in chunks
- **Memory**: Maps are cleared after processing
- **Caching**: Field lookups use pre-computed maps

## Security

- No PII stored persistently
- File processing entirely in browser
- No data sent to external servers
