# HMDA/CRA Tool Test Files
## Sample Data Package

Generated: November 26, 2024
Purpose: Testing and demonstration of the HMDA/CRA ETL Tool

---

## INPUT FILES (Upload these to test the tool)

| File | Type | Description |
|------|------|-------------|
| `01_LaserPro_Export.xlsx` | Excel | Core loan origination data (15 sample loans) |
| `02_Encompass_Export.xlsx` | Excel | Mortgage software export with borrower details |
| `03_Supplemental_Export.xlsx` | Excel | Demographics and additional applicant data |

---

## EXPECTED OUTPUT FILES (Use these to verify tool accuracy)

| File | Type | Description |
|------|------|-------------|
| `04_Expected_HMDA_Output.xlsx` | Excel | What the merged/validated output should look like |
| `05_Expected_Validation_Errors.xlsx` | Excel | Expected validation errors to be flagged |
| `06_Expected_LAR_Submission.csv` | CSV (pipe) | Final LAR format ready for regulatory submission |
| `07_Processing_Summary.xlsx` | Excel | Processing statistics and metrics |

---

## FIELD MAPPINGS

### LaserPro Export Fields
- `Loan_Number` - Unique loan identifier (joins to other files)
- `Application_Date` - Date loan application received
- `Loan_Amount` - Principal loan amount
- `Interest_Rate` - Annual percentage rate
- `Loan_Term_Months` - Loan term in months
- `Loan_Purpose_Code` - 1=Purchase, 2=Refinance, 3=Home Improvement, 4=Cash-Out
- `Property_Type_Code` - 1=Single Family, 2=Manufactured, 3=Multifamily, 4=Condo
- `Loan_Type_Code` - 1=Conventional, 2=FHA, 3=VA, 4=USDA
- `Action_Taken_Code` - 1=Originated, 2=Approved, 3=Denied, 4=Withdrawn
- `County_Code` - 3-digit FIPS county code
- `Census_Tract` - Census tract number

### Encompass Export Fields
- `Loan_Number` - JOIN KEY
- `Borrower_Last_Name`, `Borrower_First_Name` - Applicant name
- `Property_Street`, `Property_City`, `Property_State`, `Property_Zip` - Property address
- `Income_Thousands` - Annual income in thousands
- `Credit_Score` - FICO score
- `Closing_Date` - Loan closing date

### Supplemental Export Fields
- `Loan_Number` - JOIN KEY
- `Applicant_Ethnicity` - 1=Hispanic, 2=Not Hispanic, 3=Not Provided, 4=NA
- `Applicant_Race_1` - 1=Am Indian, 2=Asian, 3=Black, 4=Native HI, 5=White
- `Applicant_Sex` - 1=Male, 2=Female, 3=Not Provided, 4=NA

---

## VALIDATION RULES

1. **Required Fields**: All HMDA fields must be present
2. **Census Tract Format**: Must be ##.## or ####.##
3. **Rate Format**: Maximum 3 decimal places
4. **Income Range**: 1-9999 (in thousands)
5. **Code Values**: Must match valid HMDA code lists

---

## HOW TO USE

1. Upload the three input files (01, 02, 03) to the tool
2. Run the ETL automation
3. Compare output against expected files (04, 05, 06, 07)
4. Verify validation errors match expected errors
5. Confirm LAR format is correct for regulatory submission

---

## NOTES

- Sample data is FICTIONAL - do not submit to regulators
- 15 sample loans included with randomized data
- Approximately 3-4 loans should pass all validations
- Intentional errors included for testing validation logic
