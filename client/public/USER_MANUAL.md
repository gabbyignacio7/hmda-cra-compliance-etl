# HMDA/CRA Compliance ETL Tool - User Manual

## Quick Start Guide

### Step 1: Access the Tool
1. Open the live demo: https://gabbyignacio7.github.io/hmda-cra-compliance-etl/
2. Or run it locally with `npm run dev`

### Step 2: Upload Your File
1. Click "Choose File" or drag-and-drop
2. Upload your SBSL CRA Export file (.xlsx, .xls, or .csv)
3. Supported file: "SBSL CRA - (Convert Sheet 1 into CRA Tab for Current Month).xlsx"

### Step 3: Select Processing Options
✅ **Filter by current month** (recommended)
- Keeps only records from the current month based on Note Date column

✅ **Remove duplicates** (recommended)
- Removes duplicate ApplNumb values, keeping first occurrence

✅ **Run data validation** (recommended)
- Checks for missing required fields and invalid data types

### Step 4: Process Your Data
1. Click the **"Process Files"** button
2. Wait ~2 seconds for processing
3. Review the results summary

### Step 5: Review Results
The tool shows you:
- Total records processed
- Records filtered for current month
- Duplicates found and removed
- Validation errors identified
- Summary statistics (loan amounts, date ranges, etc.)

### Step 6: Download Your Files

**Three files are generated:**

1. **Consolidated CSV** - Clean data for Excel review
2. **Tab-Delimited Text** - Ready for CRAWiz import
3. **Validation Report** - List of all errors found

---

## Troubleshooting

**Common Issues:**
- **"Missing Columns" Error:** Ensure your upload file matches the standard SBSL template.
- **"No Records Found":** Check that your Note Dates match the current month.
