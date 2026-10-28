import { useState, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import { FileUpload } from '@/components/file-upload';
import { MultiFileUpload } from '@/components/multi-file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  Database,
  LayoutDashboard,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  ChevronRight,
  FlaskConical,
  ShieldCheck,
  Activity,
  FileDiff,
  BookOpen,
  FileScan,
  Printer,
  Share2,
  Copy,
  Check,
  Bug,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  processFile,
  MOCK_SBSL_DATA,
  filterByCurrentMonth,
  validateData,
  generateSummaryStats,
  transformEncompassData,
  cleanAndFormatData,
  mergeSupplementalData,
  exportCRAWizFormat,
  transformToCRAWizFormat,
  CRA_WIZ_128_COLUMNS,
  parseBorrowerName,
  compareOutputs,
  exportComparisonReport,
  type SbslRow,
  type ValidationResult,
  type ComparisonResult,
} from '@/lib/etl-engine';
import {
  ErrorTracker,
  getErrorLogs,
  getETLTraces,
  clearAllLogs,
  type ErrorLog,
  type ETLTraceLog,
} from '@/lib/error-tracker';
import { compareDataframes, type DiffResult } from '@/lib/diff-engine';
import {
  parseCRAWizFile,
  transformCRAWizExport,
  exportWorkItemFile,
  exportTransformSummary,
  BRANCH_LIST,
  type CRAWizRow,
  type TransformResult,
} from '@/lib/cra-wiz-transform';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // State
  const [files, setFiles] = useState<{
    laserPro: File | null;
    encompass: File | null;
    supp: File | null;
    expected: File | null;
    stress: File[];
  }>({
    laserPro: null,
    encompass: null,
    supp: null,
    expected: null,
    stress: [],
  });

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const [rawData, setRawData] = useState<SbslRow[]>([]);
  const [laserProData, setLaserProData] = useState<SbslRow[]>([]); // LaserPro data (commercial/ag loans)
  const [encompassData, setEncompassData] = useState<SbslRow[]>([]); // Encompass data (consumer loans)
  const [suppData, setSuppData] = useState<SbslRow[]>([]); // Supplemental data for merge
  const [processedData, setProcessedData] = useState<SbslRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [currentScenario, setCurrentScenario] = useState<string>('');

  // Diff State
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  // Output Comparison State
  const [desiredOutputData, setDesiredOutputData] = useState<SbslRow[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  // Stress Test State
  const [stressResults, setStressResults] = useState<any[]>([]);
  const [stressStats, setStressStats] = useState({
    filesProcessed: 0,
    successRate: '0/0',
    avgTime: 0,
    totalRows: 0,
  });

  // Phase 3: CRA Wiz Post-Processing State
  const [craWizFile, setCraWizFile] = useState<File | null>(null);
  const [craWizData, setCraWizData] = useState<CRAWizRow[]>([]);
  const [phase3Result, setPhase3Result] = useState<TransformResult | null>(null);
  const [isPhase3Processing, setIsPhase3Processing] = useState(false);

  // Progress Tracking State
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [copied, setCopied] = useState(false);

  // Debug Panel State
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [etlTraces, setETLTraces] = useState<ETLTraceLog[]>([]);

  const MAX_LOGS = 200; // Prevent memory leak from unbounded logs
  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      // Keep only the most recent logs to prevent memory leak
      return newLogs.slice(-MAX_LOGS);
    });
  };

  const refreshDebugLogs = () => {
    setErrorLogs(getErrorLogs());
    setETLTraces(getETLTraces());
  };

  const handleClearLogs = () => {
    clearAllLogs();
    setErrorLogs([]);
    setETLTraces([]);
    toast({ title: 'Logs Cleared', description: 'All debug logs have been cleared' });
  };

  const handleDownloadLogs = () => {
    ErrorTracker.download();
    toast({ title: 'Logs Downloaded', description: 'Debug logs saved to file' });
  };

  // Load debug logs on mount and when switching to debug tab
  useEffect(() => {
    if (activeTab === 'debug') {
      refreshDebugLogs();
    }
  }, [activeTab]);

  const handleFileUpload = async (
    type: 'laserPro' | 'encompass' | 'supp' | 'expected',
    file: File
  ) => {
    setFiles(prev => ({ ...prev, [type]: file }));

    try {
      const data = await processFile(file);

      if (type === 'laserPro') {
        // LaserPro data source (commercial/ag loans)
        setLaserProData(data as SbslRow[]);
        addLog(`Loaded LASERPRO file: ${file.name} (${data.length} commercial/ag records)`);
        toast({
          title: 'LaserPro File Loaded',
          description: `Successfully loaded ${data.length} commercial/ag records from ${file.name}`,
        });
        setCurrentScenario('Custom Upload');
      } else if (type === 'encompass') {
        // Encompass data source (consumer loans)
        setEncompassData(data as SbslRow[]);
        addLog(`Loaded ENCOMPASS file: ${file.name} (${data.length} consumer records)`);
        toast({
          title: 'Encompass File Loaded',
          description: `Successfully loaded ${data.length} consumer records from ${file.name}`,
        });
        setCurrentScenario('Custom Upload');
      } else if (type === 'supp') {
        // Supplemental data for merge
        setSuppData(data as SbslRow[]);
        addLog(`Loaded SUPPLEMENTAL file: ${file.name} (${data.length} rows)`);
        toast({
          title: 'Supplemental File Loaded',
          description: `${data.length} records ready for merge`,
        });
      } else if (type === 'expected') {
        // Desired/expected output for comparison
        setDesiredOutputData(data as SbslRow[]);
        addLog(`Loaded DESIRED OUTPUT file: ${file.name} (${data.length} rows)`);
        toast({
          title: 'Desired Output Loaded',
          description: `${data.length} records ready for comparison`,
        });
      }
    } catch (e) {
      addLog(`Error parsing file ${file.name}: ${e}`);
      toast({
        title: 'Error',
        description: `Failed to parse ${file.name}`,
        variant: 'destructive',
      });
    }
  };

  const handleDocumentFilesUpload = (newFiles: File[]) => {
    setDocumentFiles(prev => [...prev, ...newFiles]);
    toast({
      title: 'Documents Uploaded',
      description: `Added ${newFiles.length} document${newFiles.length !== 1 ? 's' : ''} for processing.`,
    });
  };

  const handleRemoveDocumentFile = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runEtlProcess = async () => {
    setIsProcessing(true);
    setActiveTab('process');
    setLogs([]);
    addLog('Starting Comprehensive ETL Process...');

    // ISSUE 1 FIX: Combine LaserPro and Encompass data as separate records
    // LaserPro records are commercial/ag loans, Encompass records are consumer loans
    // Both should be APPENDED to create the complete HMDA output
    const combinedData: SbslRow[] = [];

    // Add Encompass records first (consumer loans)
    if (encompassData.length > 0) {
      addLog(`📊 Loading ${encompassData.length} consumer records from Encompass...`);
      // Mark each record with its source for tracking
      encompassData.forEach(row => {
        combinedData.push({ ...row, _source: 'encompass' });
      });
    }

    // APPEND LaserPro records (commercial/ag loans) - these are SEPARATE loans
    if (laserProData.length > 0) {
      addLog(`📊 Appending ${laserProData.length} commercial/ag records from LaserPro...`);
      // Mark each record with its source for tracking (preserve LaserPro casing for transform.ts)
      laserProData.forEach(row => {
        combinedData.push({ ...row, _source: 'LaserPro' });
      });
    }

    // Check if we have uploaded data
    if (combinedData.length === 0 && !files.encompass && !files.laserPro) {
      addLog('No files uploaded. Using sample data for demonstration...');
      toast({
        title: 'Using Sample Data',
        description: 'Upload files to process your own data',
        variant: 'default',
      });
    } else {
      addLog(
        `📊 Total combined records: ${combinedData.length} (${encompassData.length} Encompass + ${laserProData.length} LaserPro)`
      );
    }

    // Update rawData with combined data for downstream processing
    setRawData(combinedData);

    // Validate primary data has key HMDA fields
    if (combinedData.length > 0) {
      const firstRow = combinedData[0];
      const hasULI = !!(
        firstRow?.ULI ||
        firstRow?.['Universal Loan Identifier'] ||
        firstRow?.['Universal Loan Identifier (ULI)']
      );
      const hasLoanAmount = !!(firstRow?.LoanAmount || firstRow?.['Loan Amount']);
      const hasAddress = !!(firstRow?.Address || firstRow?.['Street Address']);

      if (!hasULI && !hasLoanAmount) {
        addLog('⚠️ WARNING: Primary data appears to be missing ULI and Loan Amount fields.');
        addLog('   This may indicate files were uploaded in the wrong slots.');
        addLog('   Input B should be: Encompass HMDA Export (with ULI, Loan Amount, Census data)');
        addLog('   Input C should be: Additional Fields (with Names, Loan Officer, APR)');
        toast({
          title: '⚠️ Check File Slots',
          description:
            'Primary data missing ULI/Loan Amount. Make sure files are in correct slots.',
          variant: 'destructive',
          duration: 10000,
        });
      }
    }

    await new Promise(r => setTimeout(r, 500));

    // Step 1: Filter
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    addLog(`Phase 1: Filtering by current month (${currentMonth})...`);
    const currentData = combinedData.length > 0 ? combinedData : MOCK_SBSL_DATA;
    const { filtered, count } = filterByCurrentMonth(currentData);
    addLog(`Filtered: Kept ${count} records out of ${currentData.length} total.`);

    await new Promise(r => setTimeout(r, 500));

    // Step 2: Transformation
    addLog('Phase 2: Transforming Encompass Data...');
    addLog('   - Calculating Branch Codes');
    addLog('   - Deriving Application Numbers');
    addLog('   - Converting Loan Terms (Months -> Years)');
    let transformed = transformEncompassData(filtered);

    await new Promise(r => setTimeout(r, 500));

    // Step 3: VLOOKUP Merge with actual supplemental data
    addLog('Phase 2 (Step 2): Merging Supplemental Data...');
    if (suppData.length > 0) {
      const beforeMergeCount = transformed.filter(r => r._merged).length;
      transformed = mergeSupplementalData(transformed, suppData);
      const afterMergeCount = transformed.filter(r => r._merged).length;
      addLog(
        `   - Merging ${transformed.length} primary records with ${suppData.length} supplemental records`
      );
      addLog(`   - Successfully matched: ${afterMergeCount} records`);
      if (afterMergeCount === 0) {
        addLog('   ⚠️ WARNING: No records matched. Check that files contain matching addresses.');
      }
    } else {
      addLog('   - No supplemental file uploaded, skipping merge');
    }
    addLog('   - Merged Customer Names, Borrower Data, APR and Rate Types');

    await new Promise(r => setTimeout(r, 500));

    // Step 4: Cleaning
    addLog('Phase 2 (Step 3): Cleaning & Formatting...');
    addLog('   - Formatting APRs (removing trailing zeros)');
    addLog('   - Padding County Codes (5 digits)');
    addLog('   - Padding Tract Numbers (11 digits)');
    const cleaned = cleanAndFormatData(transformed);

    await new Promise(r => setTimeout(r, 500));

    // Step 5: Validation (CRA Wiz Simulation)
    addLog('Phase 3: Simulating CRA Wiz Validation...');
    const errors = validateData(cleaned);
    setValidationErrors(errors);
    addLog(`Validation complete: Found ${errors.length} issues.`);

    // Stats
    const summary = generateSummaryStats(cleaned);
    setStats(summary);

    setProcessedData(cleaned);
    setIsProcessing(false);
    addLog('ETL Process Complete.');

    // Log audit trail
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'System User',
          filesProcessed:
            (files.laserPro ? 1 : 0) + (files.encompass ? 1 : 0) + (files.supp ? 1 : 0),
          recordsProcessed: cleaned.length,
          validationErrors: errors.length,
          phase: 'Complete ETL Pipeline',
        }),
      });
    } catch (err) {
      console.error('Failed to log audit trail:', err);
    }

    if (errors.length > 0) {
      toast({
        title: 'Validation Issues Found',
        description: `Found ${errors.length} records requiring attention.`,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Data processed successfully.' });
    }

    setTimeout(() => setActiveTab('review'), 500);
  };

  const downloadMailMerge = () => {
    if (processedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Run automation first to generate data',
        variant: 'destructive',
      });
      return;
    }

    try {
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `HMDA_Scrub_Data_${monthYear.replace(' ', '_')}.xlsx`;

      // Transform to 128-column CRA Wiz format
      const transformedData = transformToCRAWizFormat(processedData);

      // Generate Excel file with 128-column format
      const ws = utils.json_to_sheet(transformedData, { header: CRA_WIZ_128_COLUMNS });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'CRA Data');

      writeFile(wb, filename);

      toast({
        title: 'Export Complete',
        description: `Downloaded ${filename} with ${processedData.length} records in 128-column format`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Error creating Excel file',
        variant: 'destructive',
      });
    }
  };

  const downloadCRAWiz = () => {
    if (processedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Run automation first to generate data',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use the new 128-column CRA Wiz export format
      exportCRAWizFormat(processedData);

      toast({
        title: 'CRA Export Complete',
        description: `Downloaded ${CRA_WIZ_128_COLUMNS.length}-column CRA Wiz file with ${processedData.length} records`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Error creating CRA file',
        variant: 'destructive',
      });
    }
  };

  // Run comparison against desired output
  const runOutputComparison = () => {
    if (processedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Run automation first to generate data',
        variant: 'destructive',
      });
      return;
    }
    if (desiredOutputData.length === 0) {
      toast({
        title: 'No Desired Output',
        description: 'Upload a desired output file (Input D) first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const transformedData = transformToCRAWizFormat(processedData);
      const result = compareOutputs(transformedData, desiredOutputData);
      setComparisonResult(result);

      toast({
        title: 'Comparison Complete',
        description: `${result.matchPercentage.toFixed(1)}% match rate (${result.matchedRecords}/${result.totalRecords} exact matches)`,
      });
    } catch (error) {
      toast({
        title: 'Comparison Failed',
        description: 'Error comparing outputs',
        variant: 'destructive',
      });
    }
  };

  // Download comparison report Excel
  const downloadComparisonReportFile = () => {
    if (!comparisonResult) {
      toast({
        title: 'No Comparison',
        description: 'Run comparison first',
        variant: 'destructive',
      });
      return;
    }

    try {
      exportComparisonReport(comparisonResult);
      toast({
        title: 'Report Downloaded',
        description: 'Comparison report with all sheets exported',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Error creating comparison report',
        variant: 'destructive',
      });
    }
  };

  const downloadValidationReport = () => {
    if (validationErrors.length === 0) {
      toast({ title: 'No Errors', description: 'All records passed validation!' });
      return;
    }

    try {
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `Validation_Errors_${monthYear.replace(' ', '_')}.xlsx`;

      // Format validation errors for export
      const errorData = validationErrors.map(err => ({
        'Row #': err.rowIdx,
        'Loan Number': err.applNumb,
        Errors: err.errors.join('; '),
      }));

      const ws = utils.json_to_sheet(errorData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Validation Errors');

      writeFile(wb, filename);

      toast({
        title: 'Error Report Downloaded',
        description: `${validationErrors.length} errors exported to ${filename}`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Error creating error report',
        variant: 'destructive',
      });
    }
  };

  // Phase 3: CRA Wiz Post-Processing Handlers
  const handleCRAWizFileUpload = async (file: File) => {
    setCraWizFile(file);
    setPhase3Result(null);

    try {
      const data = await parseCRAWizFile(file);
      setCraWizData(data);
      toast({
        title: 'CRA Wiz File Loaded',
        description: `Parsed ${data.length} rows with ${Object.keys(data[0] || {}).length} columns`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse CRA Wiz export file',
        variant: 'destructive',
      });
    }
  };

  const runPhase3Transform = async () => {
    if (craWizData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please upload a CRA Wiz export file first',
        variant: 'destructive',
      });
      return;
    }

    setIsPhase3Processing(true);

    try {
      await new Promise(r => setTimeout(r, 500)); // Brief delay for UI feedback

      const result = transformCRAWizExport(craWizData);
      setPhase3Result(result);

      toast({
        title: 'Transformation Complete',
        description: `Converted ${result.inputColumns} columns to ${result.outputColumns} columns. ${result.branchMatchCount} branch matches.`,
      });
    } catch (error) {
      toast({
        title: 'Transform Failed',
        description: 'Error during CRA Wiz transformation',
        variant: 'destructive',
      });
    } finally {
      setIsPhase3Processing(false);
    }
  };

  const downloadPhase3WorkItem = () => {
    if (!phase3Result || phase3Result.data.length === 0) {
      toast({ title: 'No Data', description: 'Run transformation first', variant: 'destructive' });
      return;
    }

    exportWorkItemFile(phase3Result.data);
    toast({ title: 'Download Started', description: 'Work Item file is downloading' });
  };

  const downloadPhase3Summary = () => {
    if (!phase3Result) {
      toast({ title: 'No Data', description: 'Run transformation first', variant: 'destructive' });
      return;
    }

    exportTransformSummary(phase3Result);
    toast({ title: 'Download Started', description: 'Summary file is downloading' });
  };

  const downloadCorrectedData = async () => {
    if (processedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Run automation first to generate data',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Import auto-correction and transform functions
      const { autoCorrectData, transformToCRAWizFormat, CRA_WIZ_128_COLUMNS } =
        await import('@/lib/etl-engine');

      // Apply auto-corrections
      const correctedData = autoCorrectData(processedData);

      // Transform to 128-column CRA Wiz format
      const transformedData = transformToCRAWizFormat(correctedData);

      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `HMDA_Auto_Corrected_${monthYear.replace(' ', '_')}.xlsx`;

      // Generate Excel with 128-column CRA Wiz format
      const ws = utils.json_to_sheet(transformedData, { header: CRA_WIZ_128_COLUMNS });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'CRA Data');

      // Add a summary sheet
      const summaryData = [
        {
          'Total Records': transformedData.length,
          'Output Columns': CRA_WIZ_128_COLUMNS.length,
          'Column A': 'BranchName',
          'Column B': 'Branch',
          'Column C': 'ApplNumb',
          'Original Errors': validationErrors.length,
          'Auto-Corrections Applied':
            'Census Tract formatting, Rate decimals, State codes, Whitespace trimming',
          Note: 'Review flagged records - some errors require manual correction',
        },
      ];
      const summaryWs = utils.json_to_sheet(summaryData);
      utils.book_append_sheet(wb, summaryWs, 'Correction Summary');

      writeFile(wb, filename);

      toast({
        title: 'Corrected Data Downloaded',
        description: `${transformedData.length} records in 128-column CRA Wiz format. Review flagged items.`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Error creating corrected file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#003366] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="font-bold text-xl tracking-tight">HMDA/CRA ETL</h1>
          <p className="text-xs text-blue-200 mt-1">Compliance automation</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
              activeTab === 'upload' ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5'
            )}
          >
            <Database className="w-4 h-4" />
            <span className="font-medium text-sm">Data Sources</span>
          </button>

          <button
            onClick={() => setActiveTab('process')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
              activeTab === 'process' ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5'
            )}
          >
            <Play className="w-4 h-4" />
            <span className="font-medium text-sm">Run ETL</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
              activeTab === 'review' ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-sm">Review & Scrub</span>
            {validationErrors.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {validationErrors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('phase3')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
              activeTab === 'phase3' ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5'
            )}
          >
            <ArrowRight className="w-4 h-4" />
            <span className="font-medium text-sm">CRA Wiz Post</span>
            <span className="ml-auto bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              Step 6
            </span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
              activeTab === 'docs' ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5'
            )}
          >
            <FileScan className="w-4 h-4" />
            <span className="font-medium text-sm">Doc Intelligence</span>
            <span className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              New
            </span>
          </button>

          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="px-4 text-xs text-blue-400 uppercase font-semibold mb-2">
              Testing & Tools
            </p>
            <button
              onClick={() => setActiveTab('testing')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                activeTab === 'testing'
                  ? 'bg-white/10 text-white'
                  : 'text-blue-200 hover:bg-white/5'
              )}
            >
              <FileDiff className="w-4 h-4" />
              <span className="font-medium text-sm">Diff Testing</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('debug');
                refreshDebugLogs();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                activeTab === 'debug' ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5'
              )}
            >
              <Bug className="w-4 h-4" />
              <span className="font-medium text-sm">Error Tracking</span>
              {errorLogs.filter(l => l.level === 'error').length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {errorLogs.filter(l => l.level === 'error').length}
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="text-xs text-blue-300 mb-2">System Status</div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <ShieldCheck className="w-4 h-4" />
            Data stays in your browser
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center px-8 justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {activeTab === 'upload' && 'Phase 1: Data Extraction'}
            {activeTab === 'process' && 'Phase 2-3: Transformation & Validation'}
            {activeTab === 'review' && 'Phase 4: Scrub Preparation'}
            {activeTab === 'phase3' && 'Phase 3: CRA Wiz Post-Processing'}
            {activeTab === 'docs' && 'Phase 5: Document Intelligence'}
            {activeTab === 'debug' && 'Error Tracking & Debug'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              Period:{' '}
              <span className="font-medium text-slate-900">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
            {/* UPLOAD TAB */}
            <TabsContent value="upload" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Input A: LaserPro</CardTitle>
                    <CardDescription>Commercial HMDA Loans (Text)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      label="LaserPro Export"
                      onFileSelect={f => handleFileUpload('laserPro', f)}
                      file={files.laserPro}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Input B: Encompass HMDA Export</CardTitle>
                    <CardDescription className="text-xs">
                      Primary HMDA data with ULI, Address, Loan Amount
                      <span className="block text-blue-600 mt-1">
                        File: &quot;October Encompass HMDA Export.xlsx&quot;
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      label="Encompass HMDA Export"
                      onFileSelect={f => handleFileUpload('encompass', f)}
                      file={files.encompass}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Input C: Additional Fields</CardTitle>
                    <CardDescription className="text-xs">
                      Names, Loan Officer, APR, Lock Date
                      <span className="block text-blue-600 mt-1">
                        File: &quot;October HMDA Additional Fields.xlsx&quot;
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      label="Additional Fields Export"
                      onFileSelect={f => handleFileUpload('supp', f)}
                      file={files.supp}
                    />
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileDiff className="w-4 h-4 text-purple-600" />
                      Input D: Desired Output
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Optional: Upload expected output for comparison/validation
                      <span className="block text-purple-600 mt-1">
                        Compare generated vs desired output
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      label="Desired Output (Optional)"
                      onFileSelect={f => handleFileUpload('expected', f)}
                      file={files.expected}
                    />
                    {desiredOutputData.length > 0 && (
                      <div className="mt-2 text-xs text-purple-700 bg-purple-100 p-2 rounded">
                        {desiredOutputData.length} records loaded for comparison
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setActiveTab('process')}
                  className="bg-[#003366] hover:bg-[#002244]"
                >
                  Continue to Phase 2 <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* PROCESS TAB */}
            <TabsContent value="process" className="space-y-6 mt-0">
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Transformation Pipeline</CardTitle>
                    <CardDescription>Execution of Phase 2 & 3 Logic</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-950 text-slate-50 font-mono text-sm p-4 rounded-md h-[300px] overflow-y-auto shadow-inner">
                      {logs.length === 0 && (
                        <span className="text-slate-500">Ready to start...</span>
                      )}
                      {logs.map((log, i) => (
                        <div
                          key={i}
                          className="mb-1 border-b border-slate-800/50 pb-1 last:border-0"
                        >
                          {log}
                        </div>
                      ))}
                      {isProcessing && (
                        <div className="flex items-center gap-2 text-blue-400 mt-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className="w-full bg-[#003366] hover:bg-[#002244]"
                      size="lg"
                      onClick={runEtlProcess}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Run Automation
                    </Button>
                    <div className="text-xs text-muted-foreground px-2">
                      <p className="font-medium mb-1">Pipeline Steps:</p>
                      <ul className="list-disc pl-3 space-y-1">
                        <li>Column Calculation (Term, Branch)</li>
                        <li>VLOOKUP Merge (Supp Data)</li>
                        <li>Format Cleaning (APR, Tract)</li>
                        <li>CRA Wiz Validation Simulation</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* REVIEW TAB */}
            <TabsContent value="review" className="space-y-6 mt-0">
              {stats && (
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-[#003366]">{stats.totalRecords}</div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Total Records
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          notation: 'compact',
                        }).format(stats.totalLoanAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Total Volume
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      'transition-colors',
                      validationErrors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white'
                    )}
                  >
                    <CardContent className="pt-6">
                      <div
                        className={cn(
                          'text-2xl font-bold',
                          validationErrors.length > 0 ? 'text-red-600' : 'text-slate-900'
                        )}
                      >
                        {validationErrors.length}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Validation Errors
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="pt-6 flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={downloadCorrectedData}
                      >
                        <CheckCircle2 className="mr-2 h-3 w-3" /> Download Corrected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={downloadMailMerge}
                      >
                        <Download className="mr-2 h-3 w-3" /> Export Mail Merge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={downloadCRAWiz}
                      >
                        <Database className="mr-2 h-3 w-3" /> Export CRA Wiz
                      </Button>
                      {validationErrors.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          onClick={downloadValidationReport}
                        >
                          <AlertTriangle className="mr-2 h-3 w-3" /> Error Report
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Data Review</CardTitle>
                  <CardDescription>
                    Review processed records. Shows merged data from Encompass + Additional Fields.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium border-b">
                          <tr>
                            <th className="px-4 py-3">ULI/Loan#</th>
                            <th className="px-4 py-3">Address</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">Last Name</th>
                            <th className="px-4 py-3">First Name</th>
                            <th className="px-4 py-3">Lender</th>
                            <th className="px-4 py-3">Loan Amt</th>
                            <th className="px-4 py-3">APR</th>
                            <th className="px-4 py-3">Merged</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {processedData.slice(0, 50).map((row, i) => {
                            // Extract fields using multiple possible field names
                            const uli =
                              row.ULI ||
                              row['Universal Loan Identifier'] ||
                              row.ApplNumb ||
                              row['Loan Number'] ||
                              '-';
                            const address =
                              row.Address ||
                              row['Street Address'] ||
                              row['Property Address'] ||
                              row['Subject Property Address'] ||
                              '-';
                            const city =
                              row.City ||
                              row['Property City'] ||
                              row['Subject Property City'] ||
                              '-';

                            // Handle name fields - including parsing Borrower Name if needed
                            let lastName =
                              row.LastName || row['Last Name'] || row['Borrower Last Name'] || '';
                            let firstName =
                              row.FirstName ||
                              row['First Name'] ||
                              row['Borrower First Name'] ||
                              '';

                            // If names are empty but we have Borrower Name, parse it
                            if (
                              (!lastName || !firstName) &&
                              (row['Borrower Name'] || row['BorrowerFullName'])
                            ) {
                              const parsed = parseBorrowerName(
                                String(row['Borrower Name'] || row['BorrowerFullName'] || '')
                              );
                              if (!lastName) lastName = parsed.lastName;
                              if (!firstName) firstName = parsed.firstName;
                            }

                            const lender = row.Lender || row['Loan Officer'] || '-';
                            const loanAmt = parseFloat(
                              String(
                                row.LoanAmount ||
                                  row['Loan Amount'] ||
                                  row['Loan Amount in Dollars'] ||
                                  0
                              )
                            );
                            const apr =
                              row.APR || row['Annual Percentage Rate'] || row.InterestRate || '-';

                            // Check if record was merged (flag set by mergeSupplementalData)
                            const isMerged = row._merged === true;

                            const error = validationErrors.find(
                              e => e.applNumb === String(uli) || e.rowIdx === i + 1
                            );

                            return (
                              <tr
                                key={i}
                                className={cn(
                                  'hover:bg-slate-50 transition-colors',
                                  error ? 'bg-red-50/50 hover:bg-red-50' : ''
                                )}
                              >
                                <td className="px-4 py-3 font-medium truncate max-w-[100px]">
                                  {uli}
                                </td>
                                <td className="px-4 py-3 truncate max-w-[150px]">
                                  {address || '-'}
                                </td>
                                <td className="px-4 py-3">{city || '-'}</td>
                                <td className="px-4 py-3">{lastName || '-'}</td>
                                <td className="px-4 py-3">{firstName || '-'}</td>
                                <td className="px-4 py-3">{lender}</td>
                                <td className="px-4 py-3">${loanAmt.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                  {apr}
                                  {typeof apr === 'number' ? '%' : ''}
                                </td>
                                <td className="px-4 py-3">
                                  {isMerged ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                      No
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {error ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      <AlertTriangle className="w-3 h-3 mr-1" /> Review
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {processedData.length > 50 && (
                      <div className="px-4 py-3 text-sm text-slate-500 bg-slate-50 border-t">
                        Showing first 50 of {processedData.length} records
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* OUTPUT VALIDATION / COMPARISON SECTION */}
              {desiredOutputData.length > 0 && processedData.length > 0 && (
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileDiff className="w-5 h-5 text-purple-600" />
                      Output Validation
                    </CardTitle>
                    <CardDescription>
                      Compare generated output vs desired output ({desiredOutputData.length}{' '}
                      expected records)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3 mb-4">
                      <Button
                        onClick={runOutputComparison}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Run Comparison
                      </Button>
                      {comparisonResult && (
                        <Button
                          variant="outline"
                          onClick={downloadComparisonReportFile}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export Comparison Report
                        </Button>
                      )}
                    </div>

                    {comparisonResult && (
                      <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-3">
                          <div
                            className={cn(
                              'p-4 rounded-lg border',
                              comparisonResult.matchPercentage >= 90
                                ? 'bg-green-50 border-green-200'
                                : comparisonResult.matchPercentage >= 70
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-red-50 border-red-200'
                            )}
                          >
                            <div
                              className={cn(
                                'text-2xl font-bold',
                                comparisonResult.matchPercentage >= 90
                                  ? 'text-green-600'
                                  : comparisonResult.matchPercentage >= 70
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              )}
                            >
                              {comparisonResult.matchPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Match Rate
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <div className="text-2xl font-bold text-green-600">
                              {comparisonResult.matchedRecords}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Exact Matches
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-600">
                              {comparisonResult.partialMatches}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Partial Matches
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="text-2xl font-bold text-slate-600">
                              {comparisonResult.newRecords}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              New Records
                            </div>
                          </div>
                        </div>

                        {/* Column Accuracy - Show worst columns */}
                        {comparisonResult.worstColumns.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-sm mb-2">
                              Column Accuracy (showing mismatches)
                            </h4>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                              {comparisonResult.worstColumns.map(col => (
                                <div
                                  key={col.column}
                                  className="flex items-center gap-2 text-sm p-2 rounded bg-slate-50"
                                >
                                  <span
                                    className={cn(
                                      'w-5 h-5 flex items-center justify-center rounded-full text-xs',
                                      col.matchRate === 100
                                        ? 'bg-green-100 text-green-700'
                                        : col.matchRate >= 90
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                    )}
                                  >
                                    {col.matchRate === 100 ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : col.matchRate >= 90 ? (
                                      <AlertTriangle className="w-3 h-3" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                  </span>
                                  <span className="font-mono text-xs flex-1">{col.column}</span>
                                  <span
                                    className={cn(
                                      'text-xs font-medium px-2 py-0.5 rounded',
                                      col.matchRate >= 90
                                        ? 'bg-green-100 text-green-700'
                                        : col.matchRate >= 70
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                    )}
                                  >
                                    {col.matchRate.toFixed(0)}%
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({col.mismatches} mismatches)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Row-level comparison preview */}
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2">
                            Row Comparison (first 10 with differences)
                          </h4>
                          <div className="rounded-md border overflow-hidden">
                            <div className="overflow-x-auto max-h-[300px]">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100 sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Key</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Differences</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {comparisonResult.rowComparisons
                                    .filter(r => !r.isMatch || r.isNewRecord)
                                    .slice(0, 10)
                                    .map((row, i) => (
                                      <tr
                                        key={i}
                                        className={cn(
                                          row.isNewRecord
                                            ? 'bg-slate-50'
                                            : Object.keys(row.differences).length <= 3
                                              ? 'bg-yellow-50'
                                              : 'bg-red-50'
                                        )}
                                      >
                                        <td className="px-3 py-2 font-mono text-xs truncate max-w-[150px]">
                                          {row.key}
                                        </td>
                                        <td className="px-3 py-2">
                                          {row.isNewRecord ? (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
                                              New
                                            </span>
                                          ) : Object.keys(row.differences).length <= 3 ? (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-200 text-yellow-800">
                                              {Object.keys(row.differences).length} diff
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-200 text-red-800">
                                              {Object.keys(row.differences).length} diffs
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[300px]">
                                          {row.isNewRecord
                                            ? 'No matching expected record'
                                            : Object.keys(row.differences).slice(0, 5).join(', ')}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* PHASE 3: CRA WIZ POST-PROCESSING TAB */}
            <TabsContent value="phase3" className="space-y-6 mt-0">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900">
                      Step 6: CRA Wiz Return Processing
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Upload the file you downloaded from CRA Wiz after processing. This converts
                      the 243-column CRA Wiz export to the 125-column work item format with Branch
                      VLOOKUP applied.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Upload CRA Wiz Export
                    </CardTitle>
                    <CardDescription>
                      Upload the CSV file downloaded from CRA Wiz after processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      label="CRA Wiz Export File (CSV)"
                      description="243-column CRA Wiz HMDA export"
                      onFileSelect={file => handleCRAWizFileUpload(file)}
                      file={craWizFile}
                      accept={{
                        'text/csv': ['.csv'],
                        'application/vnd.ms-excel': ['.xls', '.xlsx'],
                      }}
                    />

                    {craWizData.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">File Loaded Successfully</span>
                        </div>
                        <div className="mt-2 text-sm text-green-600">
                          {craWizData.length} rows × {Object.keys(craWizData[0] || {}).length}{' '}
                          columns
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Branch List Reference
                    </CardTitle>
                    <CardDescription>
                      Using built-in the bank branch list (48 branches)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Branch List Ready</span>
                      </div>
                      <p className="text-sm text-blue-600 mb-3">
                        {Object.keys(BRANCH_LIST).length} branches configured for VLOOKUP
                      </p>
                      <div className="max-h-32 overflow-y-auto text-xs font-mono bg-white rounded p-2 border">
                        {Object.entries(BRANCH_LIST)
                          .slice(0, 10)
                          .map(([num, name]) => (
                            <div key={num} className="py-0.5">
                              {num}: {name}
                            </div>
                          ))}
                        <div className="text-slate-400 italic">
                          ...and {Object.keys(BRANCH_LIST).length - 10} more
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Transform Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                    onClick={runPhase3Transform}
                    disabled={isPhase3Processing || craWizData.length === 0}
                  >
                    {isPhase3Processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transforming...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Transform for Work Items
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground px-2">
                    <p className="font-medium mb-1">Transformation Steps:</p>
                    <ul className="list-disc pl-3 space-y-1">
                      <li>Apply Branch VLOOKUP (BRANCHNUMB → BRANCHNAME)</li>
                      <li>Add new columns: ErrorMadeBy, DSC (blank)</li>
                      <li>Remove 118 unwanted columns</li>
                      <li>Reorder to exact 125-column format</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {phase3Result && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-white">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                          {phase3Result.inputColumns}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Input Columns
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          {phase3Result.outputColumns}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Output Columns
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                          {phase3Result.rowCount}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Total Rows
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className={cn(
                        'bg-white',
                        phase3Result.branchMissCount > 0 && 'border-yellow-300 bg-yellow-50'
                      )}
                    >
                      <CardContent className="pt-6">
                        <div
                          className={cn(
                            'text-2xl font-bold',
                            phase3Result.branchMissCount > 0 ? 'text-yellow-600' : 'text-green-600'
                          )}
                        >
                          {phase3Result.branchMatchCount}/{phase3Result.rowCount}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Branch Matches
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Data Preview</CardTitle>
                      <CardDescription>
                        First 5 rows of transformed data (125 columns)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-medium border-b">
                              <tr>
                                <th className="px-4 py-3">BRANCHNAME</th>
                                <th className="px-4 py-3">BRANCHNUMB</th>
                                <th className="px-4 py-3">LEI</th>
                                <th className="px-4 py-3">ULI</th>
                                <th className="px-4 py-3">LASTNAME</th>
                                <th className="px-4 py-3">FIRSTNAME</th>
                                <th className="px-4 py-3">LENDER</th>
                                <th className="px-4 py-3">LOANAMOUNTINDOLLARS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {phase3Result.data.slice(0, 5).map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-medium">{row.BRANCHNAME || '-'}</td>
                                  <td className="px-4 py-3">{row.BRANCHNUMB || '-'}</td>
                                  <td className="px-4 py-3 truncate max-w-[100px]">
                                    {row.LEI || '-'}
                                  </td>
                                  <td className="px-4 py-3 truncate max-w-[100px]">
                                    {row.ULI || '-'}
                                  </td>
                                  <td className="px-4 py-3">{row.LASTNAME || '-'}</td>
                                  <td className="px-4 py-3">{row.FIRSTNAME || '-'}</td>
                                  <td className="px-4 py-3">{row.LENDER || '-'}</td>
                                  <td className="px-4 py-3">
                                    ${Number(row.LOANAMOUNTINDOLLARS || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={downloadPhase3WorkItem}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Work Item File
                    </Button>
                    <Button variant="outline" size="lg" onClick={downloadPhase3Summary}>
                      <FileText className="mr-2 h-4 w-4" />
                      Download Summary
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* DOCUMENT INTELLIGENCE TAB (MOCK) */}
            <TabsContent value="docs" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Document-Based Data Extraction (Phase 5)</CardTitle>
                  <CardDescription>
                    Automated extraction from PDF loan documents (Closing Disclosures, Notes,
                    Appraisals).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <FileScan className="w-12 h-12 text-blue-300 mb-4 mx-auto" />
                      <h3 className="text-lg font-medium text-slate-900">
                        Upload Loan Document Packages
                      </h3>
                      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        Upload multiple PDF or text files to automatically extract interest rates,
                        loan terms, and property details.
                      </p>
                    </div>

                    <MultiFileUpload
                      label="Document Files (PDF/Text)"
                      description="Drag & drop multiple files or click to select"
                      onFilesSelect={handleDocumentFilesUpload}
                      files={documentFiles}
                      onRemoveFile={handleRemoveDocumentFile}
                      accept={{ 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }}
                    />

                    {documentFiles.length > 0 && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setDocumentFiles([])}
                          data-testid="button-clear-all"
                        >
                          Clear All
                        </Button>
                        <Button
                          className="bg-[#003366] hover:bg-[#002244]"
                          data-testid="button-process-documents"
                        >
                          Process {documentFiles.length} Document
                          {documentFiles.length !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-slate-700 mb-4">
                      Extraction Capabilities Preview
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-2">
                          Closing Disclosure
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Loan Term
                          </li>
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Interest Rate
                          </li>
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Loan Purpose
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-2">
                          Credit Report
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Middle Score Logic
                          </li>
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Applicant Age
                          </li>
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Bureau Source
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-2">
                          Appraisal
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Construction Method
                          </li>
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Property Address
                          </li>
                          <li className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Occupancy Type
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DEBUG TAB */}
            <TabsContent value="debug" className="space-y-6 mt-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Local Error Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track ETL errors and debug issues locally
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshDebugLogs}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                    <Download className="w-4 h-4 mr-2" /> Export Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearLogs}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Clear All
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-slate-900">{errorLogs.length}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Total Logs
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={
                    errorLogs.filter(l => l.level === 'error').length > 0
                      ? 'bg-red-50 border-red-200'
                      : ''
                  }
                >
                  <CardContent className="pt-6">
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        errorLogs.filter(l => l.level === 'error').length > 0
                          ? 'text-red-600'
                          : 'text-slate-900'
                      )}
                    >
                      {errorLogs.filter(l => l.level === 'error').length}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Errors
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={
                    errorLogs.filter(l => l.level === 'warning').length > 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : ''
                  }
                >
                  <CardContent className="pt-6">
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        errorLogs.filter(l => l.level === 'warning').length > 0
                          ? 'text-yellow-600'
                          : 'text-slate-900'
                      )}
                    >
                      {errorLogs.filter(l => l.level === 'warning').length}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Warnings
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{etlTraces.length}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      ETL Steps
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ETL Traces */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    ETL Pipeline Traces
                  </CardTitle>
                  <CardDescription>Track each step of the ETL process</CardDescription>
                </CardHeader>
                <CardContent>
                  {etlTraces.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No ETL traces recorded yet. Run the automation to see traces.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {etlTraces
                        .slice()
                        .reverse()
                        .map((trace, i) => (
                          <div
                            key={trace.id}
                            className={cn(
                              'p-3 rounded-lg border text-sm',
                              trace.errors.length > 0
                                ? 'bg-red-50 border-red-200'
                                : trace.warnings.length > 0
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-slate-50'
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">{trace.step}</span>
                                <span className="text-muted-foreground ml-2">
                                  {trace.inputCount} → {trace.outputCount} rows
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {trace.duration}ms •{' '}
                                {new Date(trace.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {trace.errors.length > 0 && (
                              <div className="mt-2 text-xs text-red-600">
                                {trace.errors.slice(0, 3).map((err, j) => (
                                  <div key={j}>• {err}</div>
                                ))}
                                {trace.errors.length > 3 && (
                                  <div>...and {trace.errors.length - 3} more</div>
                                )}
                              </div>
                            )}
                            {trace.warnings.length > 0 && (
                              <div className="mt-2 text-xs text-yellow-700">
                                {trace.warnings.slice(0, 3).map((warn, j) => (
                                  <div key={j}>• {warn}</div>
                                ))}
                                {trace.warnings.length > 3 && (
                                  <div>...and {trace.warnings.length - 3} more</div>
                                )}
                              </div>
                            )}
                            {trace.sampleData && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  View Details
                                </summary>
                                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-x-auto">
                                  {JSON.stringify(trace.sampleData, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Error Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Error & Warning Logs
                  </CardTitle>
                  <CardDescription>Recent errors and warnings from the application</CardDescription>
                </CardHeader>
                <CardContent>
                  {errorLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No errors or warnings logged yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {errorLogs
                        .slice()
                        .reverse()
                        .map((log, i) => (
                          <div
                            key={log.id}
                            className={cn(
                              'p-3 rounded-lg border text-sm',
                              log.level === 'error'
                                ? 'bg-red-50 border-red-200'
                                : log.level === 'warning'
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : log.level === 'info'
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-slate-50'
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                {log.level === 'error' && (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                {log.level === 'warning' && (
                                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                )}
                                {log.level === 'info' && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                )}
                                {log.level === 'debug' && (
                                  <Bug className="w-4 h-4 text-slate-500" />
                                )}
                                <span
                                  className={cn(
                                    'text-xs font-medium px-2 py-0.5 rounded',
                                    log.level === 'error'
                                      ? 'bg-red-100 text-red-700'
                                      : log.level === 'warning'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : log.level === 'info'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-slate-100 text-slate-700'
                                  )}
                                >
                                  {log.category}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="mt-1 font-medium">{log.message}</div>
                            {log.details && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  View Details
                                </summary>
                                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                            {log.stack && (
                              <details className="mt-2">
                                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                                  View Stack Trace
                                </summary>
                                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-x-auto text-red-600">
                                  {log.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
