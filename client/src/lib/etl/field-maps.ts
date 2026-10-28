/**
 * Field Mappings - Maps source file column names to standardized HMDA field names
 *
 * INPUT SOURCES:
 * 1. Encompass Export - Main HMDA data (LEI, ULI, demographics, loan details, etc.)
 * 2. Encompass Additional (Supplemental) - Borrower names, Lender, Processor, PostCloser, Branch
 * 3. LaserPro Export - Alternative HMDA data source (pipe-delimited)
 */

/**
 * OUTPUT SCHEMA - Exactly 128 columns
 * This is the single source of truth for output column order and names
 * Updated to include RateType (col 124) and Var_Term (col 125) per Jonathan's feedback
 */
export const HMDA_COLUMN_ORDER: string[] = [
  'Branch_Name', // Col 1 - From Additional Fields or VLOOKUP
  'Branch', // Col 2 - From Additional Fields
  'LEI', // Col 3 - From Encompass
  'ULI', // Col 4 - From Encompass
  'LastName', // Col 5 - From Additional Fields
  'FirstName', // Col 6 - From Additional Fields
  'Coa_LastName', // Col 7 - From Additional Fields
  'Coa_FirstName', // Col 8 - From Additional Fields
  'Lender', // Col 9 - From Additional Fields (Loan Officer)
  'AA_Processor', // Col 10 - From Additional Fields
  'LDP_PostCloser', // Col 11 - From Additional Fields
  'ErrorMadeBy', // Col 12 - Blank (manual entry)
  'ApplDate', // Col 13 - From Encompass
  'LoanType', // Col 14 - From Encompass
  'Purpose', // Col 15 - From Encompass
  'ConstructionMethod', // Col 16 - From Encompass
  'OccupancyType', // Col 17 - From Encompass
  'LoanAmountInDollars', // Col 18 - From Encompass
  'Preapproval', // Col 19 - From Encompass
  'Action', // Col 20 - From Encompass
  'ActionDate', // Col 21 - From Encompass
  'Address', // Col 22 - From Encompass or Additional Fields
  'City', // Col 23 - From Encompass or Additional Fields
  'State_abrv', // Col 24 - From Encompass or Additional Fields
  'Zip', // Col 25 - From Encompass
  'County_5', // Col 26 - From Encompass
  'Tract_11', // Col 27 - From Encompass
  'Ethnicity_1', // Col 28 - From Encompass
  'Ethnicity_2', // Col 29 - From Encompass
  'Ethnicity_3', // Col 30 - From Encompass
  'Ethnicity_4', // Col 31 - From Encompass
  'Ethnicity_5', // Col 32 - From Encompass
  'EthnicityOther', // Col 33 - From Encompass
  'Coa_Ethnicity_1', // Col 34 - From Encompass
  'Coa_Ethnicity_2', // Col 35 - From Encompass
  'Coa_Ethnicity_3', // Col 36 - From Encompass
  'Coa_Ethnicity_4', // Col 37 - From Encompass
  'Coa_Ethnicity_5', // Col 38 - From Encompass
  'Coa_EthnicityOther', // Col 39 - From Encompass
  'Ethnicity_Determinant', // Col 40 - From Encompass
  'Coa_Ethnicity_Determinant', // Col 41 - From Encompass
  'Race_1', // Col 42 - From Encompass
  'Race_2', // Col 43 - From Encompass
  'Race_3', // Col 44 - From Encompass
  'Race_4', // Col 45 - From Encompass
  'Race_5', // Col 46 - From Encompass
  'Race1_Other', // Col 47 - From Encompass
  'Race27_Other', // Col 48 - From Encompass
  'Race44_Other', // Col 49 - From Encompass
  'CoaRace_1', // Col 50 - From Encompass
  'CoaRace_2', // Col 51 - From Encompass
  'CoaRace_3', // Col 52 - From Encompass
  'CoaRace_4', // Col 53 - From Encompass
  'CoaRace_5', // Col 54 - From Encompass
  'CoaRace1_Other', // Col 55 - From Encompass
  'CoaRace27_Other', // Col 56 - From Encompass
  'CoaRace44_Other', // Col 57 - From Encompass
  'Race_Determinant', // Col 58 - From Encompass
  'CoaRace_Determinant', // Col 59 - From Encompass
  'Sex', // Col 60 - From Encompass
  'CoaSex', // Col 61 - From Encompass
  'Sex_Determinant', // Col 62 - From Encompass
  'CoaSex_Determinant', // Col 63 - From Encompass
  'Age', // Col 64 - From Encompass
  'Coa_Age', // Col 65 - From Encompass (9999 if no co-applicant)
  'Income', // Col 66 - From Encompass
  'Purchaser', // Col 67 - From Encompass
  'Rate_Spread', // Col 68 - From Encompass
  'HOEPA_Status', // Col 69 - From Encompass
  'Lien_Status', // Col 70 - From Encompass
  'CreditScore', // Col 71 - From Encompass
  'Coa_CreditScore', // Col 72 - From Encompass (9999 if no co-applicant)
  'CreditModel', // Col 73 - From Encompass
  'CreditModelOther', // Col 74 - From Encompass
  'Coa_CreditModel', // Col 75 - From Encompass
  'Coa_CreditModelOther', // Col 76 - From Encompass
  'Denial1', // Col 77 - From Encompass
  'Denial2', // Col 78 - From Encompass
  'Denial3', // Col 79 - From Encompass
  'Denial4', // Col 80 - From Encompass
  'DenialOther', // Col 81 - From Encompass
  'TotalLoanCosts', // Col 82 - From Encompass
  'TotalPtsAndFees', // Col 83 - From Encompass
  'OrigFees', // Col 84 - From Encompass
  'DiscountPts', // Col 85 - From Encompass
  'LenderCredts', // Col 86 - From Encompass
  'InterestRate', // Col 87 - From Encompass
  'APR', // Col 88 - From Additional Fields or Encompass
  'Rate_Lock_Date', // Col 89 - From Additional Fields or Encompass
  'PPPTerm', // Col 90 - From Encompass
  'DTIRatio', // Col 91 - From Encompass
  'DSC', // Col 92 - Blank (manual entry)
  'CLTV', // Col 93 - From Encompass
  'Loan_Term', // Col 94 - From Encompass (Years)
  'Loan_Term_Months', // Col 95 - From Encompass (Months)
  'IntroRatePeriod', // Col 96 - From Encompass
  'BalloonPMT', // Col 97 - From Encompass
  'IOPMT', // Col 98 - From Encompass
  'NegAM', // Col 99 - From Encompass
  'NonAmortz', // Col 100 - From Encompass
  'PropertyValue', // Col 101 - From Encompass
  'MHSecPropType', // Col 102 - From Encompass
  'MHLandPropInt', // Col 103 - From Encompass
  'TotalUnits', // Col 104 - From Encompass
  'MFAHU', // Col 105 - From Encompass
  'APPMethod', // Col 106 - From Encompass
  'PayableInst', // Col 107 - From Encompass
  'NMLSRID', // Col 108 - From Encompass
  'AUSystem1', // Col 109 - From Encompass
  'AUSystem2', // Col 110 - From Encompass
  'AUSystem3', // Col 111 - From Encompass
  'AUSystem4', // Col 112 - From Encompass
  'AUSystem5', // Col 113 - From Encompass
  'AUSystemOther', // Col 114 - From Encompass
  'AUSResult1', // Col 115 - From Encompass
  'AUSResult2', // Col 116 - From Encompass
  'AUSResult3', // Col 117 - From Encompass
  'AUSResult4', // Col 118 - From Encompass
  'AUSResult5', // Col 119 - From Encompass
  'AUSResultOther', // Col 120 - From Encompass
  'REVMTG', // Col 121 - From Encompass
  'OpenLOC', // Col 122 - From Encompass
  'BUSCML', // Col 123 - From Encompass
  'RateType', // Col 124 - Derived from IntroRatePeriod (1=Fixed, 2=Variable)
  'Var_Term', // Col 125 - Derived from IntroRatePeriod (months to years with half-year rounding; <=6 mo -> 1)
  'EditStatus', // Col 126 - Blank (manual entry)
  'EditCkComments', // Col 127 - Blank (manual entry)
  'Comments', // Col 128 - Blank (manual entry)
];

// Alias for backwards compatibility
export const CRA_WIZ_128_COLUMNS = HMDA_COLUMN_ORDER;

/**
 * COMPREHENSIVE Encompass field name mapping
 * Maps Encompass/source file column names to OUTPUT column names (126 columns)
 */
export const ENCOMPASS_FIELD_MAP: Record<string, string> = {
  // Core Identifiers
  'Legal Entity Identifier (LEI)': 'LEI',
  'Legal Entity Identifier': 'LEI',
  'Universal Loan Identifier (ULI)': 'ULI',
  'Universal Loan Identifier': 'ULI',
  'Loan ID': 'ApplNumb',
  'Loan Number': 'ApplNumb',
  'Application Number': 'ApplNumb',

  // Dates
  'Application Date': 'ApplDate',
  'Action Taken Date': 'ActionDate',
  'Action Date': 'ActionDate',
  'Rate Lock Date': 'Rate_Lock_Date',
  'Lock Date': 'Rate_Lock_Date',

  // Loan Details
  'Loan Type': 'LoanType',
  'Loan Purpose': 'Purpose',
  'Loan Amount': 'LoanAmountInDollars',
  'Loan Amount in Dollars': 'LoanAmountInDollars',
  'Construction Method': 'ConstructionMethod',
  'Occupancy Type': 'OccupancyType',
  Occupancy: 'OccupancyType',
  Preapproval: 'Preapproval',
  'Pre-approval': 'Preapproval',
  'Action Taken': 'Action',
  Action: 'Action',

  // Property Info
  'Street Address': 'Address',
  'Property Street': 'Address',
  'Property Address': 'Address',
  'Property City': 'City',
  'Property State': 'State_abrv',
  State: 'State_abrv',
  'Property ZIP Code': 'Zip',
  'ZIP Code': 'Zip',
  'Zip Code': 'Zip',
  County: 'County_5',
  'County Code': 'County_5',
  'Census Tract': 'Tract_11',
  Tract: 'Tract_11',
  CensusTract: 'Tract_11',
  Census_Tract: 'Tract_11',
  'FFIEC Census Tract': 'Tract_11',
  'Tract Number': 'Tract_11',
  'Census Tract Number': 'Tract_11',
  TRACT: 'Tract_11',

  // Borrower Demographics - Primary Applicant Ethnicity
  'Applicant Ethnicity 1': 'Ethnicity_1',
  'Applicant Ethnicity-1': 'Ethnicity_1',
  'Ethnicity of Applicant or Borrower: 1': 'Ethnicity_1',
  'Applicant Ethnicity 2': 'Ethnicity_2',
  'Ethnicity of Applicant or Borrower: 2': 'Ethnicity_2',
  'Applicant Ethnicity 3': 'Ethnicity_3',
  'Ethnicity of Applicant or Borrower: 3': 'Ethnicity_3',
  'Applicant Ethnicity 4': 'Ethnicity_4',
  'Ethnicity of Applicant or Borrower: 4': 'Ethnicity_4',
  'Applicant Ethnicity 5': 'Ethnicity_5',
  'Ethnicity of Applicant or Borrower: 5': 'Ethnicity_5',
  'Applicant Ethnicity: Free Form Text Field': 'EthnicityOther',
  'Ethnicity of Applicant or Borrower: Conditional Free Form Text Field for Code 14':
    'EthnicityOther',
  'Ethnicity of Applicant or Borrower Collected on the Basis of Visual Observation or Surname':
    'Ethnicity_Determinant',
  'Applicant Ethnicity Basis': 'Ethnicity_Determinant',

  // Borrower Demographics - Co-Applicant Ethnicity
  'Co-Applicant Ethnicity 1': 'Coa_Ethnicity_1',
  'Co-Applicant Ethnicity-1': 'Coa_Ethnicity_1',
  'Ethnicity of Co-Applicant or Co-Borrower: 1': 'Coa_Ethnicity_1',
  'Ethnicity of Co-Applicant or CoBorrower: 1': 'Coa_Ethnicity_1',
  'Co-Applicant Ethnicity 2': 'Coa_Ethnicity_2',
  'Ethnicity of Co-Applicant or Co-Borrower: 2': 'Coa_Ethnicity_2',
  'Ethnicity of Co-Applicant or CoBorrower: 2': 'Coa_Ethnicity_2',
  'Co-Applicant Ethnicity 3': 'Coa_Ethnicity_3',
  'Ethnicity of Co-Applicant or Co-Borrower: 3': 'Coa_Ethnicity_3',
  'Ethnicity of Co-Applicant or CoBorrower: 3': 'Coa_Ethnicity_3',
  'Co-Applicant Ethnicity 4': 'Coa_Ethnicity_4',
  'Ethnicity of Co-Applicant or Co-Borrower: 4': 'Coa_Ethnicity_4',
  'Ethnicity of Co-Applicant or CoBorrower: 4': 'Coa_Ethnicity_4',
  'Co-Applicant Ethnicity 5': 'Coa_Ethnicity_5',
  'Ethnicity of Co-Applicant or Co-Borrower: 5': 'Coa_Ethnicity_5',
  'Ethnicity of Co-Applicant or CoBorrower: 5': 'Coa_Ethnicity_5',
  'Co-Applicant Ethnicity: Free Form Text Field': 'Coa_EthnicityOther',
  'Ethnicity of Co-Applicant or CoBorrower: Conditional Free Form Text Field for Code 14':
    'Coa_EthnicityOther',
  'Ethnicity of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname':
    'Coa_Ethnicity_Determinant',
  'Ethnicity of Co-Applicant or CoBorrower Collected on the Basis of Visual Observation or Surname':
    'Coa_Ethnicity_Determinant',
  'Co-Applicant Ethnicity Basis': 'Coa_Ethnicity_Determinant',

  // Borrower Demographics - Race Primary
  'Applicant Race 1': 'Race_1',
  'Applicant Race-1': 'Race_1',
  'Race of Applicant or Borrower: 1': 'Race_1',
  'Applicant Race 2': 'Race_2',
  'Race of Applicant or Borrower: 2': 'Race_2',
  'Applicant Race 3': 'Race_3',
  'Race of Applicant or Borrower: 3': 'Race_3',
  'Applicant Race 4': 'Race_4',
  'Race of Applicant or Borrower: 4': 'Race_4',
  'Applicant Race 5': 'Race_5',
  'Race of Applicant or Borrower: 5': 'Race_5',
  'Applicant Race: Free Form Text Field for American Indian or Alaska Native Enrolled or Principal Tribe':
    'Race1_Other',
  'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 1': 'Race1_Other',
  'Applicant Race: Free Form Text Field for Other Asian': 'Race27_Other',
  'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 27': 'Race27_Other',
  'Applicant Race: Free Form Text Field for Other Pacific Islander': 'Race44_Other',
  'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 44': 'Race44_Other',
  'Race of Applicant or Borrower Collected on the Basis of Visual Observation or Surname':
    'Race_Determinant',
  'Applicant Race Basis': 'Race_Determinant',

  // Borrower Demographics - Race Co-Applicant
  'Co-Applicant Race 1': 'CoaRace_1',
  'Co-Applicant Race-1': 'CoaRace_1',
  'Race of Co-Applicant or Co-Borrower: 1': 'CoaRace_1',
  'Race of CoApplicant or Co-Borrower: 1': 'CoaRace_1',
  'Co-Applicant Race 2': 'CoaRace_2',
  'Race of Co-Applicant or Co-Borrower: 2': 'CoaRace_2',
  'Race of CoApplicant or Co-Borrower: 2': 'CoaRace_2',
  'Co-Applicant Race 3': 'CoaRace_3',
  'Race of Co-Applicant or Co-Borrower: 3': 'CoaRace_3',
  'Race of CoApplicant or Co-Borrower: 3': 'CoaRace_3',
  'Co-Applicant Race 4': 'CoaRace_4',
  'Race of Co-Applicant or Co-Borrower: 4': 'CoaRace_4',
  'Race of CoApplicant or Co-Borrower: 4': 'CoaRace_4',
  'Co-Applicant Race 5': 'CoaRace_5',
  'Race of Co-Applicant or Co-Borrower: 5': 'CoaRace_5',
  'Race of CoApplicant or Co-Borrower: 5': 'CoaRace_5',
  'Co-Applicant Race: Free Form Text Field for American Indian or Alaska Native': 'CoaRace1_Other',
  'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 1':
    'CoaRace1_Other',
  'Co-Applicant Race: Free Form Text Field for Other Asian': 'CoaRace27_Other',
  'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 27':
    'CoaRace27_Other',
  'Co-Applicant Race: Free Form Text Field for Other Pacific Islander': 'CoaRace44_Other',
  'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 44':
    'CoaRace44_Other',
  'Race of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname':
    'CoaRace_Determinant',
  'Race of CoApplicant or Co-Borrower Collected on the Basis of Visual Observation or Surname':
    'CoaRace_Determinant',
  'Co-Applicant Race Basis': 'CoaRace_Determinant',

  // Sex/Gender
  'Sex of Applicant or Borrower': 'Sex',
  'Applicant Sex': 'Sex',
  'Sex of Co-Applicant or Co-Borrower': 'CoaSex',
  'Sex of CoApplicant or Co-Borrower': 'CoaSex',
  'Co-Applicant Sex': 'CoaSex',
  'Sex of Applicant or Borrower Collected on the Basis of Visual Observation or Surname':
    'Sex_Determinant',
  'Applicant Sex Basis': 'Sex_Determinant',
  'Sex of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname':
    'CoaSex_Determinant',
  'Sex of CoApplicant or Co-Borrower Collected on the Basis of Visual Observation or Surname':
    'CoaSex_Determinant',
  'Co-Applicant Sex Basis': 'CoaSex_Determinant',

  // Age
  'Age of Applicant or Borrower': 'Age',
  'Applicant Age': 'Age',
  'Age of Co-Applicant or Co-Borrower': 'Coa_Age',
  'Age of CoApplicant or Co-Borrower': 'Coa_Age',
  'Co-Applicant Age': 'Coa_Age',

  // Income and Financial
  Income: 'Income',
  'Gross Annual Income': 'Income',
  'Applicant Income': 'Income',
  'Debt-toIncome Ratio': 'DTIRatio',
  'Debt-to-Income Ratio': 'DTIRatio',
  'Debt to Income Ratio': 'DTIRatio',
  'DTI Ratio': 'DTIRatio',
  DTI: 'DTIRatio',
  'Combined Loan-to-Value Ratio': 'CLTV',
  CLTV: 'CLTV',
  'Property Value': 'PropertyValue',

  // Purchaser
  'Type of Purchaser': 'Purchaser',
  'Purchaser Type': 'Purchaser',

  // Rate Info
  'Rate Spread': 'Rate_Spread',
  'Rate Spread for Reporting Purposes': 'Rate_Spread',
  'Interest Rate': 'InterestRate',
  'Note Rate': 'InterestRate',
  'Annual Percentage Rate': 'APR',
  APR: 'APR',
  'HOEPA Status': 'HOEPA_Status',
  'Lien Status': 'Lien_Status',

  // Credit Score
  'Credit Score of Applicant or Borrower': 'CreditScore',
  'Applicant Credit Score': 'CreditScore',
  'Credit Score': 'CreditScore',
  'Credit Score of Co-Applicant or Co-Borrower': 'Coa_CreditScore',
  'Credit Score of Co-Applicant or CoBorrower': 'Coa_CreditScore',
  'Co-Applicant Credit Score': 'Coa_CreditScore',

  // Credit Model
  'Name and Version of Credit Scoring Model': 'CreditModel',
  'Credit Scoring Model': 'CreditModel',
  'Credit Score Type Used': 'CreditModel',
  'Credit Model': 'CreditModel',
  'Applicant or Borrower, Name and Version of Credit Scoring Model': 'CreditModel',
  'Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8':
    'CreditModelOther',
  'Applicant or Borrower, Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8':
    'CreditModelOther',

  // Co-Applicant Credit Model
  'Co-Applicant Credit Scoring Model': 'Coa_CreditModel',
  'Credit Score Type of Co-Applicant or Co-Borrower': 'Coa_CreditModel',
  'Credit Score Type Used for Co-Applicant': 'Coa_CreditModel',
  'Name and Version of Credit Scoring Model of Co-Applicant or Co-Borrower': 'Coa_CreditModel',
  'Co-Applicant or CoBorrower, Name and Version of Credit Scoring Model': 'Coa_CreditModel',
  'Co-Applicant Name and Version of Credit Scoring Model: Conditional Free Form Text Field':
    'Coa_CreditModelOther',
  'Co-Applicant or CoBorrower, Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8':
    'Coa_CreditModelOther',

  // Denial Reasons
  'Denial Reason 1': 'Denial1',
  'Reason for Denial: 1': 'Denial1',
  'Denial Reason 2': 'Denial2',
  'Reason for Denial: 2': 'Denial2',
  'Denial Reason 3': 'Denial3',
  'Reason for Denial: 3': 'Denial3',
  'Denial Reason 4': 'Denial4',
  'Reason for Denial: 4': 'Denial4',
  'Denial Reason: Free Form Text Field': 'DenialOther',
  'Reason for Denial: Conditional Free Form Text Field for Code 9': 'DenialOther',

  // Loan Costs
  'Total Loan Costs': 'TotalLoanCosts',
  'Total Points and Fees': 'TotalPtsAndFees',
  'Origination Charges': 'OrigFees',
  'Origination Fees': 'OrigFees',
  'Discount Points': 'DiscountPts',
  'Lender Credits': 'LenderCredts',

  // Loan Terms
  'Loan Term': 'Loan_Term',
  'Loan Term (Months)': 'Loan_Term_Months',
  'Prepayment Penalty Term': 'PPPTerm',
  'Introductory Rate Period': 'IntroRatePeriod',
  'Intro Rate Period': 'IntroRatePeriod',
  IntroRatePeriod: 'IntroRatePeriod',
  'Initial Rate Period': 'IntroRatePeriod',
  'ARM Initial Rate Period': 'IntroRatePeriod',
  'Balloon Payment': 'BalloonPMT',
  'Interest-Only Payments': 'IOPMT',
  'Negative Amortization': 'NegAM',
  'Non-Amortizing Features': 'NonAmortz',
  'Other Nonamortizing Features': 'NonAmortz',

  // Property Features
  'Manufactured Home Secured Property Type': 'MHSecPropType',
  'Manufactured Home Land Property Interest': 'MHLandPropInt',
  'Total Units': 'TotalUnits',
  'Multifamily Affordable Units': 'MFAHU',

  // Application Details
  'Application Channel': 'APPMethod',
  'Submission of Application': 'APPMethod',
  'Initially Payable to Your Institution': 'PayableInst',
  'Payable to Institution': 'PayableInst',

  // NMLSRID
  'NMLS ID': 'NMLSRID',
  'Mortgage Loan Originator NMLSR Identifier': 'NMLSRID',
  'NMLSR Identifier': 'NMLSRID',
  'Mortgage Loan Originator NMLS ID': 'NMLSRID',
  'MLO NMLS ID': 'NMLSRID',
  'Originator NMLS': 'NMLSRID',
  'MLO NMLSR ID': 'NMLSRID',
  'Originator NMLSR ID': 'NMLSRID',
  'Loan Originator NMLSR ID': 'NMLSRID',

  // AUS
  'Automated Underwriting System 1': 'AUSystem1',
  'Automated Underwriting System: 1': 'AUSystem1',
  'AUS 1': 'AUSystem1',
  'AUS: 1': 'AUSystem1',
  'AUS System 1': 'AUSystem1',
  AUSystem1: 'AUSystem1',
  'AUS Name': 'AUSystem1',
  'AUS Type': 'AUSystem1',
  AUS: 'AUSystem1',
  'Automated Underwriting System 2': 'AUSystem2',
  'Automated Underwriting System: 2': 'AUSystem2',
  'Automated Underwriting System 3': 'AUSystem3',
  'Automated Underwriting System: 3': 'AUSystem3',
  'Automated Underwriting System 4': 'AUSystem4',
  'Automated Underwriting System: 4': 'AUSystem4',
  'Automated Underwriting System 5': 'AUSystem5',
  'Automated Underwriting System: 5': 'AUSystem5',
  'Automated Underwriting System: Free Form Text Field': 'AUSystemOther',
  'Automated Underwriting System: Conditional Free Form Text Field for Code 5': 'AUSystemOther',

  // AUS Results
  'AUS Result 1': 'AUSResult1',
  AUSResult1: 'AUSResult1',
  'Automated Underwriting System Result: 1': 'AUSResult1',
  'AUS Recommendation': 'AUSResult1',
  'AUS Result': 'AUSResult1',
  'AUS Decision': 'AUSResult1',
  'AUS Result 2': 'AUSResult2',
  'Automated Underwriting System Result: 2': 'AUSResult2',
  'AUS Result 3': 'AUSResult3',
  'Automated Underwriting System Result: 3': 'AUSResult3',
  'AUS Result 4': 'AUSResult4',
  'Automated Underwriting System Result: 4': 'AUSResult4',
  'AUS Result 5': 'AUSResult5',
  'Automated Underwriting System Result: 5': 'AUSResult5',
  'AUS Result: Free Form Text Field': 'AUSResultOther',
  'Automated Underwriting System Result: Conditional Free Form Text Field for Code 16':
    'AUSResultOther',

  // Special Loan Types
  'Reverse Mortgage': 'REVMTG',
  'Open-End Line of Credit': 'OpenLOC',
  'Business or Commercial Purpose': 'BUSCML',

  // ============ FROM ADDITIONAL FIELDS FILE ============
  'Borrower First Name': 'FirstName',
  'Borrower Last Name': 'LastName',
  'Co-Borrower First Name': 'Coa_FirstName',
  'CoBorrower First Name': 'Coa_FirstName',
  'Co-Applicant First Name': 'Coa_FirstName',
  'Co-Borrower Last Name': 'Coa_LastName',
  'CoBorrower Last Name': 'Coa_LastName',
  'Co-Applicant Last Name': 'Coa_LastName',
  'Loan Officer': 'Lender',
  'Loan Processor': 'AA_Processor',
  'Post Closer': 'LDP_PostCloser',
  'Subject Property Address': 'Address',
  'Subject Property City': 'City',
  'Subject Property State': 'State_abrv',
  'Loan Team Member Name - Post Closer': 'LDP_PostCloser',
  'Borrower Name': 'BorrowerFullName',

  // Branch Info - comprehensive mappings from Additional Fields
  'Branch Name': 'Branch_Name',
  BranchName: 'Branch_Name',
  'Originating Branch': 'Branch_Name',
  OriginatingBranch: 'Branch_Name',
  'Originating Branch Name': 'Branch_Name',
  'Branch Description': 'Branch_Name',
  BranchDescription: 'Branch_Name',
  'Location Name': 'Branch_Name',
  LocationName: 'Branch_Name',
  'Office Name': 'Branch_Name',
  OfficeName: 'Branch_Name',
  'Loan Team Member Branch Name': 'Branch_Name',
  'Loan Team Member Name - Branch': 'Branch_Name',

  'Branch Number': 'Branch',
  BranchNumber: 'Branch',
  'Branch #': 'Branch',
  'Branch Num': 'Branch',
  BranchNum: 'Branch',
  'Branch Code': 'Branch',
  'Originating Branch Number': 'Branch',
  OriginatingBranchNumber: 'Branch',
  'Originating Branch #': 'Branch',
  'Branch ID': 'Branch',
  BranchID: 'Branch',
  'Location Code': 'Branch',
  LocationCode: 'Branch',
  'Office Number': 'Branch',
  OfficeNumber: 'Branch',
  'Office #': 'Branch',
  'Loan Team Member Branch Number': 'Branch',
  'Loan Team Member Branch #': 'Branch',
  FileStarterCostCenterID: 'Branch',
  'Cost Center ID': 'Branch',
  CostCenterID: 'Branch',
  'Cost Center': 'Branch',
  CostCenter: 'Branch',
};

/**
 * HMDA LAR (Compliance Reporter) field positions
 * Based on actual Compliance Reporter Export structure
 * Maps position index to output column names (126-column format)
 */
export const COMPLIANCE_REPORTER_FIELD_MAP: Record<number, string> = {
  // Record identifier
  0: 'RecordType', // 1=header, 2=data
  1: 'LEI', // Legal Entity Identifier
  2: 'ULI', // Universal Loan Identifier
  3: 'ApplDate', // Application Date (YYYYMMDD)
  4: 'LoanType', // Loan Type
  5: 'Purpose', // Loan Purpose
  6: 'Preapproval', // Preapproval
  7: 'ConstructionMethod', // Construction Method
  8: 'OccupancyType', // Occupancy Type
  9: 'LoanAmountInDollars', // Loan Amount
  10: 'Action', // Action Taken
  11: 'ActionDate', // Action Taken Date (YYYYMMDD)
  12: 'Address', // Street Address
  13: 'City', // City
  14: 'State_abrv', // State
  15: 'Zip', // ZIP Code
  16: 'County_5', // County Code
  17: 'Tract_11', // Census Tract
  // Applicant Ethnicity (positions 18-23)
  18: 'Ethnicity_1',
  19: 'Ethnicity_2',
  20: 'Ethnicity_3',
  21: 'Ethnicity_4',
  22: 'Ethnicity_5',
  23: 'EthnicityOther',
  // Co-Applicant Ethnicity (positions 24-29)
  24: 'Coa_Ethnicity_1',
  25: 'Coa_Ethnicity_2',
  26: 'Coa_Ethnicity_3',
  27: 'Coa_Ethnicity_4',
  28: 'Coa_Ethnicity_5',
  29: 'Coa_EthnicityOther',
  // Ethnicity Determinants (positions 30-31)
  30: 'Ethnicity_Determinant',
  31: 'Coa_Ethnicity_Determinant',
  // Applicant Race (positions 32-39)
  32: 'Race_1',
  33: 'Race_2',
  34: 'Race_3',
  35: 'Race_4',
  36: 'Race_5',
  37: 'Race1_Other',
  38: 'Race27_Other',
  39: 'Race44_Other',
  // Co-Applicant Race (positions 40-47)
  40: 'CoaRace_1',
  41: 'CoaRace_2',
  42: 'CoaRace_3',
  43: 'CoaRace_4',
  44: 'CoaRace_5',
  45: 'CoaRace1_Other',
  46: 'CoaRace27_Other',
  47: 'CoaRace44_Other',
  // Race Determinants (positions 48-49)
  48: 'Race_Determinant',
  49: 'CoaRace_Determinant',
  // Sex (positions 50-53)
  50: 'Sex',
  51: 'CoaSex',
  52: 'Sex_Determinant',
  53: 'CoaSex_Determinant',
  // Age (positions 54-55)
  54: 'Age',
  55: 'Coa_Age',
  // Financial (positions 56-60)
  56: 'Income',
  57: 'Purchaser',
  58: 'Rate_Spread',
  59: 'HOEPA_Status',
  60: 'Lien_Status',
  // Credit Score (positions 61-66)
  61: 'CreditScore',
  62: 'Coa_CreditScore',
  63: 'CreditModel',
  64: 'CreditModelOther',
  65: 'Coa_CreditModel',
  66: 'Coa_CreditModelOther',
  // Denial Reasons (positions 67-71)
  67: 'Denial1',
  68: 'Denial2',
  69: 'Denial3',
  70: 'Denial4',
  71: 'DenialOther',
  // Loan Costs (positions 72-76)
  72: 'TotalLoanCosts',
  73: 'TotalPtsAndFees',
  74: 'OrigFees',
  75: 'DiscountPts',
  76: 'LenderCredts',
  // Rate Info (positions 77-79)
  77: 'InterestRate',
  78: 'PPPTerm',
  79: 'DTIRatio',
  // Loan Terms (positions 80-86)
  80: 'CLTV',
  81: 'Loan_Term',
  82: 'IntroRatePeriod',
  83: 'BalloonPMT',
  84: 'IOPMT',
  85: 'NegAM',
  86: 'NonAmortz',
  // Property (positions 87-91)
  87: 'PropertyValue',
  88: 'MHSecPropType',
  89: 'MHLandPropInt',
  90: 'TotalUnits',
  91: 'MFAHU',
  // Application (positions 92-94)
  92: 'APPMethod',
  93: 'PayableInst',
  94: 'NMLSRID',
  // AUS (positions 95-106)
  95: 'AUSystem1',
  96: 'AUSystem2',
  97: 'AUSystem3',
  98: 'AUSystem4',
  99: 'AUSystem5',
  100: 'AUSystemOther',
  101: 'AUSResult1',
  102: 'AUSResult2',
  103: 'AUSResult3',
  104: 'AUSResult4',
  105: 'AUSResult5',
  106: 'AUSResultOther',
  // Special Loan Types (positions 107-109)
  107: 'REVMTG',
  108: 'OpenLOC',
  109: 'BUSCML',

  // ============ LASERPRO EXTENDED FIELDS (positions 147+) ============
  // These fields are present in the LaserPro/Compliance Reporter export
  // but are not part of the standard HMDA LAR format.
  // Per Jonathan's feedback: These data points are embedded in the LaserPro export.
  // CORRECTED POSITIONS based on actual file analysis (0-indexed):
  147: '_LaserPro_Source', // Source identifier ("Laser Pro")
  148: '_LaserPro_ID1', // Internal ID (e.g., "41292")
  149: 'ApplNumb', // Loan/Application number (e.g., "21404695207")
  150: '_LaserPro_AccountNum', // Partial account number
  // 151-154: typically blank
  155: '_LaserPro_Timestamp', // Processing timestamp (e.g., "12/5/2025 9:19:29 PM")
  156: 'BorrowerFullName', // Full borrower name (e.g., "Kay Graham")
  157: 'FirstName', // Borrower first name (e.g., "Kay")
  158: 'LastName', // Borrower last name (e.g., "Graham")
  159: '_LaserPro_ID2', // Internal ID (e.g., "1832")
  160: 'Branch', // Branch number (e.g., "209")
  161: 'Branch_Name', // Branch name (e.g., "Elm Court")
  162: '_LaserPro_Code1', // Internal code (e.g., "140")
  163: '_LaserPro_Code2', // Internal code (e.g., "40")
  164: '_LaserPro_Description', // Loan description (e.g., "Georgia-Real Estate...")
  165: 'Lender', // Loan officer/processor (e.g., a loan officer user ID)
  166: '_LaserPro_Code3', // Internal code
  167: '_LaserPro_PaymentFreq', // Payment frequency (e.g., "Monthly")
  168: '_LaserPro_Flag1', // Y/N flag
  169: '_LaserPro_BillType', // Bill type description
  // 170-171: typically blank
  172: '_LaserPro_Code4', // Internal code (e.g., "98")
  // 173: typically blank
  174: '_LaserPro_Date', // Date field (e.g., "2025-10-03")
  // 175: typically blank
  175: 'APR', // Annual Percentage Rate (e.g., "10.299") - Per Jonathan: APR is in the export
  176: '_LaserPro_RateType', // Rate type text ("Fixed" or "Variable") - used to derive RateType
};

/**
 * Convert Encompass field names to standard names
 */
export const normalizeFieldName = (fieldName: string): string => {
  // First check if there's a direct mapping
  if (ENCOMPASS_FIELD_MAP[fieldName]) {
    return ENCOMPASS_FIELD_MAP[fieldName];
  }

  // Try case-insensitive match
  const fieldLower = fieldName.toLowerCase().trim();
  for (const [encompassName, standardName] of Object.entries(ENCOMPASS_FIELD_MAP)) {
    if (encompassName.toLowerCase() === fieldLower) {
      return standardName;
    }
  }

  // Return the original field name if no mapping found
  return fieldName;
};

/**
 * Comprehensive variations map for field name lookups
 * Maps OUTPUT column names to all possible INPUT field name variations from:
 * - Encompass Export (main HMDA data)
 * - Encompass Additional/Supplemental (borrower names, staff info, branch)
 * - LaserPro Export (alternative HMDA source)
 */
export const FIELD_VARIATIONS: Record<string, string[]> = {
  // ============ FROM ADDITIONAL FIELDS FILE ============
  // Branch Info - comprehensive variations for Encompass/Additional Fields
  Branch_Name: [
    'Branch_Name',
    'BranchName',
    'Branch Name',
    'BRANCHNAME',
    'Originating Branch',
    'OriginatingBranch',
    'Originating Branch Name',
    'Branch Description',
    'BranchDescription',
    'Location Name',
    'LocationName',
    'Office Name',
    'OfficeName',
    'Branch Office',
    'BranchOffice',
    'Loan Team Member Branch Name',
    'Loan Team Member Name - Branch',
  ],
  Branch: [
    'Branch',
    'BranchNumber',
    'Branch Number',
    'BranchNumb',
    'BRANCHNUMB',
    'Branch #',
    'Branch#',
    'BranchNum',
    'Branch Num',
    'Branch Code',
    'Originating Branch Number',
    'OriginatingBranchNumber',
    'Originating Branch #',
    'Branch ID',
    'BranchID',
    'Branch Id',
    'Location Code',
    'LocationCode',
    'Office Number',
    'OfficeNumber',
    'Office #',
    'Loan Team Member Branch Number',
    'Loan Team Member Branch #',
    'FileStarterCostCenterID',
    'Cost Center ID',
    'CostCenterID',
    'Cost Center',
    'CostCenter',
  ],

  // Borrower Names (from Additional Fields)
  LastName: ['LastName', 'Last Name', 'Borrower Last Name', 'Applicant Last Name', 'LASTNAME'],
  FirstName: [
    'FirstName',
    'First Name',
    'Borrower First Name',
    'Applicant First Name',
    'FIRSTNAME',
  ],
  Coa_LastName: [
    'Coa_LastName',
    'Co-Borrower Last Name',
    'Co-Applicant Last Name',
    'CoBorrower Last Name',
    'CoLastName',
    'CLASTNAME',
  ],
  Coa_FirstName: [
    'Coa_FirstName',
    'Co-Borrower First Name',
    'Co-Applicant First Name',
    'CoBorrower First Name',
    'CoFirstName',
    'CFIRSTNAME',
  ],

  // Staff Info (from Additional Fields)
  Lender: ['Lender', 'Loan Officer', 'Originator', 'LoanOfficer', 'LENDER'],
  AA_Processor: ['AA_Processor', 'Processor', 'Loan Processor', 'AA_LOANPROCESSOR'],
  LDP_PostCloser: [
    'LDP_PostCloser',
    'Post Closer',
    'PostCloser',
    'Loan Team Member Name - Post Closer',
    'LDP_POSTCLOSER',
  ],

  // ============ FROM ENCOMPASS EXPORT ============
  // Core Identifiers
  LEI: ['LEI', 'Legal Entity Identifier (LEI)', 'Legal Entity Identifier'],
  ULI: ['ULI', 'Universal Loan Identifier (ULI)', 'Universal Loan Identifier'],

  // Dates
  ApplDate: ['ApplDate', 'Application Date', 'ApplicationDate', 'APPLDATE'],
  ActionDate: ['ActionDate', 'Action Taken Date', 'Action Date', 'ACTIONDATE'],
  Rate_Lock_Date: ['Rate_Lock_Date', 'Rate Lock Date', 'Lock Date', 'RATE_LOCK_DATE'],

  // Loan Details
  LoanType: ['LoanType', 'Loan Type', 'LOANTYPE'],
  Purpose: ['Purpose', 'Loan Purpose', 'PURPOSE'],
  ConstructionMethod: ['ConstructionMethod', 'Construction Method', 'CONSTRUCTIONMETHOD'],
  OccupancyType: ['OccupancyType', 'Occupancy Type', 'Occupancy', 'OCCUPANCYTYPE'],
  LoanAmountInDollars: [
    'LoanAmountInDollars',
    'LoanAmount',
    'Loan Amount',
    'Loan Amount in Dollars',
    'LOANAMOUNTINDOLLARS',
  ],
  Preapproval: ['Preapproval', 'Pre-approval', 'PREAPPROVAL'],
  Action: ['Action', 'Action Taken', 'ACTION'],

  // Property Info
  Address: [
    'Address',
    'Street Address',
    'Property Address',
    'Property Street',
    'Subject Property Address',
    'ADDRESS',
  ],
  City: ['City', 'Property City', 'Subject Property City', 'CITY'],
  State_abrv: ['State_abrv', 'State', 'Property State', 'STATE_ABRV'],
  Zip: ['Zip', 'ZIP Code', 'Property ZIP Code', 'ZipCode', 'ZIP'],
  County_5: ['County_5', 'County', 'County Code', 'COUNTY_5'],
  Tract_11: [
    'Tract_11',
    'Census Tract',
    'Tract',
    'CensusTract',
    'Census_Tract',
    'FFIEC Census Tract',
    'Tract Number',
    'Census Tract Number',
    'TRACT',
    'TRACT_11',
  ],

  // Ethnicity - Primary Applicant
  Ethnicity_1: [
    'Ethnicity_1',
    'Applicant Ethnicity 1',
    'Applicant Ethnicity-1',
    'Ethnicity of Applicant or Borrower: 1',
    'ETHNICITY_1',
  ],
  Ethnicity_2: [
    'Ethnicity_2',
    'Applicant Ethnicity 2',
    'Ethnicity of Applicant or Borrower: 2',
    'ETHNICITY_2',
  ],
  Ethnicity_3: [
    'Ethnicity_3',
    'Applicant Ethnicity 3',
    'Ethnicity of Applicant or Borrower: 3',
    'ETHNICITY_3',
  ],
  Ethnicity_4: [
    'Ethnicity_4',
    'Applicant Ethnicity 4',
    'Ethnicity of Applicant or Borrower: 4',
    'ETHNICITY_4',
  ],
  Ethnicity_5: [
    'Ethnicity_5',
    'Applicant Ethnicity 5',
    'Ethnicity of Applicant or Borrower: 5',
    'ETHNICITY_5',
  ],
  EthnicityOther: [
    'EthnicityOther',
    'Applicant Ethnicity: Free Form Text Field',
    'Ethnicity of Applicant or Borrower: Conditional Free Form Text Field for Code 14',
    'ETHNICITYOTHER',
  ],
  Ethnicity_Determinant: [
    'Ethnicity_Determinant',
    'Applicant Ethnicity Basis',
    'Ethnicity of Applicant or Borrower Collected on the Basis of Visual Observation or Surname',
    'ETHNICITY_DETERMINANT',
  ],

  // Ethnicity - Co-Applicant
  Coa_Ethnicity_1: [
    'Coa_Ethnicity_1',
    'Co-Applicant Ethnicity 1',
    'Co-Applicant Ethnicity-1',
    'Ethnicity of Co-Applicant or Co-Borrower: 1',
    'Ethnicity of Co-Applicant or CoBorrower: 1',
    'COA_ETHNICITY_1',
  ],
  Coa_Ethnicity_2: [
    'Coa_Ethnicity_2',
    'Co-Applicant Ethnicity 2',
    'Ethnicity of Co-Applicant or Co-Borrower: 2',
    'Ethnicity of Co-Applicant or CoBorrower: 2',
    'COA_ETHNICITY_2',
  ],
  Coa_Ethnicity_3: [
    'Coa_Ethnicity_3',
    'Co-Applicant Ethnicity 3',
    'Ethnicity of Co-Applicant or Co-Borrower: 3',
    'Ethnicity of Co-Applicant or CoBorrower: 3',
    'COA_ETHNICITY_3',
  ],
  Coa_Ethnicity_4: [
    'Coa_Ethnicity_4',
    'Co-Applicant Ethnicity 4',
    'Ethnicity of Co-Applicant or Co-Borrower: 4',
    'Ethnicity of Co-Applicant or CoBorrower: 4',
    'COA_ETHNICITY_4',
  ],
  Coa_Ethnicity_5: [
    'Coa_Ethnicity_5',
    'Co-Applicant Ethnicity 5',
    'Ethnicity of Co-Applicant or Co-Borrower: 5',
    'Ethnicity of Co-Applicant or CoBorrower: 5',
    'COA_ETHNICITY_5',
  ],
  Coa_EthnicityOther: [
    'Coa_EthnicityOther',
    'Co-Applicant Ethnicity: Free Form Text Field',
    'Ethnicity of Co-Applicant or CoBorrower: Conditional Free Form Text Field for Code 14',
    'COA_ETHNICITYOTHER',
  ],
  Coa_Ethnicity_Determinant: [
    'Coa_Ethnicity_Determinant',
    'Co-Applicant Ethnicity Basis',
    'Ethnicity of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname',
    'Ethnicity of Co-Applicant or CoBorrower Collected on the Basis of Visual Observation or Surname',
    'COA_ETHNICITY_DETERMINANT',
  ],

  // Race - Primary Applicant
  Race_1: [
    'Race_1',
    'Applicant Race 1',
    'Applicant Race-1',
    'Race of Applicant or Borrower: 1',
    'RACE_1',
  ],
  Race_2: ['Race_2', 'Applicant Race 2', 'Race of Applicant or Borrower: 2', 'RACE_2'],
  Race_3: ['Race_3', 'Applicant Race 3', 'Race of Applicant or Borrower: 3', 'RACE_3'],
  Race_4: ['Race_4', 'Applicant Race 4', 'Race of Applicant or Borrower: 4', 'RACE_4'],
  Race_5: ['Race_5', 'Applicant Race 5', 'Race of Applicant or Borrower: 5', 'RACE_5'],
  Race1_Other: [
    'Race1_Other',
    'Applicant Race: Free Form Text Field for American Indian or Alaska Native Enrolled or Principal Tribe',
    'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 1',
    'RACE1_OTHER',
  ],
  Race27_Other: [
    'Race27_Other',
    'Applicant Race: Free Form Text Field for Other Asian',
    'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 27',
    'RACE27_OTHER',
  ],
  Race44_Other: [
    'Race44_Other',
    'Applicant Race: Free Form Text Field for Other Pacific Islander',
    'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 44',
    'RACE44_OTHER',
  ],
  Race_Determinant: [
    'Race_Determinant',
    'Applicant Race Basis',
    'Race of Applicant or Borrower Collected on the Basis of Visual Observation or Surname',
    'RACE_DETERMINANT',
  ],

  // Race - Co-Applicant
  CoaRace_1: [
    'CoaRace_1',
    'Co-Applicant Race 1',
    'Co-Applicant Race-1',
    'Race of Co-Applicant or Co-Borrower: 1',
    'Race of CoApplicant or Co-Borrower: 1',
    'COARACE_1',
  ],
  CoaRace_2: [
    'CoaRace_2',
    'Co-Applicant Race 2',
    'Race of Co-Applicant or Co-Borrower: 2',
    'Race of CoApplicant or Co-Borrower: 2',
    'COARACE_2',
  ],
  CoaRace_3: [
    'CoaRace_3',
    'Co-Applicant Race 3',
    'Race of Co-Applicant or Co-Borrower: 3',
    'Race of CoApplicant or Co-Borrower: 3',
    'COARACE_3',
  ],
  CoaRace_4: [
    'CoaRace_4',
    'Co-Applicant Race 4',
    'Race of Co-Applicant or Co-Borrower: 4',
    'Race of CoApplicant or Co-Borrower: 4',
    'COARACE_4',
  ],
  CoaRace_5: [
    'CoaRace_5',
    'Co-Applicant Race 5',
    'Race of Co-Applicant or Co-Borrower: 5',
    'Race of CoApplicant or Co-Borrower: 5',
    'COARACE_5',
  ],
  CoaRace1_Other: [
    'CoaRace1_Other',
    'Co-Applicant Race: Free Form Text Field for American Indian or Alaska Native',
    'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 1',
    'COARACE1_OTHER',
  ],
  CoaRace27_Other: [
    'CoaRace27_Other',
    'Co-Applicant Race: Free Form Text Field for Other Asian',
    'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 27',
    'COARACE27_OTHER',
  ],
  CoaRace44_Other: [
    'CoaRace44_Other',
    'Co-Applicant Race: Free Form Text Field for Other Pacific Islander',
    'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 44',
    'COARACE44_OTHER',
  ],
  CoaRace_Determinant: [
    'CoaRace_Determinant',
    'Co-Applicant Race Basis',
    'Race of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname',
    'Race of CoApplicant or Co-Borrower Collected on the Basis of Visual Observation or Surname',
    'COARACE_DETERMINANT',
  ],

  // Sex/Gender
  Sex: ['Sex', 'Applicant Sex', 'Sex of Applicant or Borrower', 'SEX'],
  CoaSex: [
    'CoaSex',
    'Co-Applicant Sex',
    'Sex of Co-Applicant or Co-Borrower',
    'Sex of CoApplicant or Co-Borrower',
    'COASEX',
  ],
  Sex_Determinant: [
    'Sex_Determinant',
    'Applicant Sex Basis',
    'Sex of Applicant or Borrower Collected on the Basis of Visual Observation or Surname',
    'SEX_DETERMINANT',
  ],
  CoaSex_Determinant: [
    'CoaSex_Determinant',
    'Co-Applicant Sex Basis',
    'Sex of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname',
    'Sex of CoApplicant or Co-Borrower Collected on the Basis of Visual Observation or Surname',
    'COASEX_DETERMINANT',
  ],

  // Age
  Age: ['Age', 'Applicant Age', 'Age of Applicant or Borrower', 'AGE'],
  Coa_Age: [
    'Coa_Age',
    'Co-Applicant Age',
    'Age of Co-Applicant or Co-Borrower',
    'Age of CoApplicant or Co-Borrower',
    'COA_AGE',
  ],

  // Income and Financial
  Income: ['Income', 'Gross Annual Income', 'Applicant Income', 'INCOME'],
  Purchaser: ['Purchaser', 'Type of Purchaser', 'Purchaser Type', 'PURCHASER'],
  Rate_Spread: ['Rate_Spread', 'Rate Spread', 'Rate Spread for Reporting Purposes', 'RATE_SPREAD'],
  HOEPA_Status: ['HOEPA_Status', 'HOEPA Status', 'HOEPA_STATUS'],
  Lien_Status: ['Lien_Status', 'Lien Status', 'LIEN_STATUS'],

  // Credit Score
  CreditScore: [
    'CreditScore',
    'Credit Score',
    'Applicant Credit Score',
    'Credit Score of Applicant or Borrower',
    'CREDITSCORE',
  ],
  Coa_CreditScore: [
    'Coa_CreditScore',
    'Co-Applicant Credit Score',
    'Credit Score of Co-Applicant or Co-Borrower',
    'Credit Score of Co-Applicant or CoBorrower',
    'COA_CREDITSCORE',
  ],
  CreditModel: [
    'CreditModel',
    'Credit Scoring Model',
    'Name and Version of Credit Scoring Model',
    'Credit Score Type Used',
    'Credit Model',
    'Applicant or Borrower, Name and Version of Credit Scoring Model',
    'CREDITMODEL',
  ],
  CreditModelOther: [
    'CreditModelOther',
    'Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8',
    'Applicant or Borrower, Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8',
    'CREDITMODELOTHER',
  ],
  Coa_CreditModel: [
    'Coa_CreditModel',
    'Co-Applicant Credit Scoring Model',
    'Co-Applicant or CoBorrower, Name and Version of Credit Scoring Model',
    'Credit Score Type Used for Co-Applicant',
    'Name and Version of Credit Scoring Model of Co-Applicant or Co-Borrower',
    'COA_CREDITMODEL',
  ],
  Coa_CreditModelOther: [
    'Coa_CreditModelOther',
    'Co-Applicant Name and Version of Credit Scoring Model: Conditional Free Form Text Field',
    'Co-Applicant or CoBorrower, Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8',
    'COA_CREDITMODELOTHER',
  ],

  // Denial Reasons
  Denial1: ['Denial1', 'Denial Reason 1', 'Reason for Denial: 1', 'DENIAL1'],
  Denial2: ['Denial2', 'Denial Reason 2', 'Reason for Denial: 2', 'DENIAL2'],
  Denial3: ['Denial3', 'Denial Reason 3', 'Reason for Denial: 3', 'DENIAL3'],
  Denial4: ['Denial4', 'Denial Reason 4', 'Reason for Denial: 4', 'DENIAL4'],
  DenialOther: [
    'DenialOther',
    'Denial Reason: Free Form Text Field',
    'Reason for Denial: Conditional Free Form Text Field for Code 9',
    'DENIALOTHER',
  ],

  // Loan Costs
  TotalLoanCosts: ['TotalLoanCosts', 'Total Loan Costs', 'TOTALLOANCOSTS'],
  TotalPtsAndFees: ['TotalPtsAndFees', 'Total Points and Fees', 'TOTALPTSANDFEES'],
  OrigFees: ['OrigFees', 'Origination Charges', 'Origination Fees', 'ORIGFEES'],
  DiscountPts: ['DiscountPts', 'Discount Points', 'DISCOUNTPTS'],
  LenderCredts: ['LenderCredts', 'Lender Credits', 'LENDERCREDTS'],
  InterestRate: ['InterestRate', 'Interest Rate', 'Note Rate', 'INTERESTRATE'],
  APR: ['APR', 'Annual Percentage Rate'],
  PPPTerm: ['PPPTerm', 'Prepayment Penalty Term', 'PPPTERM'],
  DTIRatio: [
    'DTIRatio',
    'Debt-toIncome Ratio',
    'Debt-to-Income Ratio',
    'Debt to Income Ratio',
    'DTI Ratio',
    'DTI',
    'DTIRATIO',
  ],
  DSC: ['DSC'],
  CLTV: ['CLTV', 'Combined Loan-to-Value Ratio'],

  // Loan Terms
  Loan_Term: ['Loan_Term', 'Loan Term', 'LoanTerm', 'Term', 'LOAN_TERM'],
  Loan_Term_Months: [
    'Loan_Term_Months',
    'Loan Term (Months)',
    'LoanTermMonths',
    'Term in Months',
    'LOAN_TERM_MONTHS',
  ],
  IntroRatePeriod: [
    'IntroRatePeriod',
    'Introductory Rate Period',
    'Intro Rate Period',
    'Initial Rate Period',
    'ARM Initial Rate Period',
    'INTRORATEPERIOD',
  ],
  BalloonPMT: ['BalloonPMT', 'Balloon Payment', 'BALLOONPMT'],
  IOPMT: ['IOPMT', 'Interest-Only Payments'],
  NegAM: ['NegAM', 'Negative Amortization', 'NEGAM'],
  NonAmortz: ['NonAmortz', 'Non-Amortizing Features', 'Other Nonamortizing Features', 'NONAMORTZ'],

  // Property
  PropertyValue: ['PropertyValue', 'Property Value', 'PROPERTYVALUE'],
  MHSecPropType: ['MHSecPropType', 'Manufactured Home Secured Property Type', 'MHSECPROPTYPE'],
  MHLandPropInt: ['MHLandPropInt', 'Manufactured Home Land Property Interest', 'MHLANDPROPINT'],
  TotalUnits: ['TotalUnits', 'Total Units', 'TOTALUNITS'],
  MFAHU: ['MFAHU', 'Multifamily Affordable Units'],

  // Application
  APPMethod: ['APPMethod', 'Application Channel', 'Submission of Application', 'APPMETHOD'],
  PayableInst: [
    'PayableInst',
    'Initially Payable to Your Institution',
    'Payable to Institution',
    'PAYABLEINST',
  ],
  NMLSRID: [
    'NMLSRID',
    'NMLS ID',
    'Originator NMLSR ID',
    'Loan Originator NMLSR ID',
    'Mortgage Loan Originator NMLSR Identifier',
    'NMLSR Identifier',
    'MLO NMLS ID',
    'Mortgage Loan Originator NMLS ID',
    'MLO NMLSR ID',
  ],

  // AUS System
  AUSystem1: [
    'AUSystem1',
    'AUS',
    'AUS 1',
    'Automated Underwriting System 1',
    'Automated Underwriting System: 1',
    'AUS System 1',
    'AUS Name',
    'AUS Type',
    'AUSYSTEM1',
  ],
  AUSystem2: [
    'AUSystem2',
    'Automated Underwriting System 2',
    'Automated Underwriting System: 2',
    'AUSYSTEM2',
  ],
  AUSystem3: [
    'AUSystem3',
    'Automated Underwriting System 3',
    'Automated Underwriting System: 3',
    'AUSYSTEM3',
  ],
  AUSystem4: [
    'AUSystem4',
    'Automated Underwriting System 4',
    'Automated Underwriting System: 4',
    'AUSYSTEM4',
  ],
  AUSystem5: [
    'AUSystem5',
    'Automated Underwriting System 5',
    'Automated Underwriting System: 5',
    'AUSYSTEM5',
  ],
  AUSystemOther: [
    'AUSystemOther',
    'Automated Underwriting System: Free Form Text Field',
    'Automated Underwriting System: Conditional Free Form Text Field for Code 5',
    'AUSYSTEMOTHER',
  ],

  // AUS Results
  AUSResult1: [
    'AUSResult1',
    'AUS Result',
    'AUS Result 1',
    'Automated Underwriting System Result: 1',
    'AUS Recommendation',
    'AUS Decision',
    'AUSRESULT1',
  ],
  AUSResult2: [
    'AUSResult2',
    'AUS Result 2',
    'Automated Underwriting System Result: 2',
    'AUSRESULT2',
  ],
  AUSResult3: [
    'AUSResult3',
    'AUS Result 3',
    'Automated Underwriting System Result: 3',
    'AUSRESULT3',
  ],
  AUSResult4: [
    'AUSResult4',
    'AUS Result 4',
    'Automated Underwriting System Result: 4',
    'AUSRESULT4',
  ],
  AUSResult5: [
    'AUSResult5',
    'AUS Result 5',
    'Automated Underwriting System Result: 5',
    'AUSRESULT5',
  ],
  AUSResultOther: [
    'AUSResultOther',
    'AUS Result: Free Form Text Field',
    'Automated Underwriting System Result: Conditional Free Form Text Field for Code 16',
    'AUSRESULTOTHER',
  ],

  // Special Loan Types
  REVMTG: ['REVMTG', 'Reverse Mortgage'],
  OpenLOC: ['OpenLOC', 'Open-End Line of Credit', 'OPENLOC'],
  BUSCML: ['BUSCML', 'Business or Commercial Purpose'],

  // Rate Type and Variable Term (derived from IntroRatePeriod)
  RateType: [
    'RateType',
    'Rate Type',
    'RATETYPE',
    'Rate_Type',
    '_LaserPro_RateType', // LaserPro extended field (text: Fixed/Variable)
  ],
  Var_Term: ['Var_Term', 'VarTerm', 'VAR_TERM', 'Variable Term', 'VariableTerm'],

  // LaserPro extended fields (positions 110+)
  _LaserPro_RateType: ['_LaserPro_RateType'],
  BorrowerFullName: ['BorrowerFullName', 'Borrower Name', 'Borrower Full Name', 'FullName'],

  // Blank columns for manual entry
  ErrorMadeBy: ['ErrorMadeBy'],
  EditStatus: ['EditStatus'],
  EditCkComments: ['EditCkComments'],
  Comments: ['Comments'],
};
