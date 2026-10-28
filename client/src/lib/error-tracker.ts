/**
 * Local Error Tracking System for HMDA/CRA Tool
 * Tracks errors, warnings, and debug info locally in browser storage
 */

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  category: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ETLTraceLog {
  id: string;
  timestamp: string;
  step: string;
  inputCount: number;
  outputCount: number;
  duration: number;
  errors: string[];
  warnings: string[];
  sampleData?: any;
}

const MAX_LOGS = 500;
const STORAGE_KEY = 'hmda_error_logs';
const TRACE_KEY = 'hmda_etl_traces';

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Get all error logs from localStorage
 */
export const getErrorLogs = (): ErrorLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Get all ETL trace logs from localStorage
 */
export const getETLTraces = (): ETLTraceLog[] => {
  try {
    const stored = localStorage.getItem(TRACE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save error logs to localStorage
 */
const saveErrorLogs = (logs: ErrorLog[]): void => {
  try {
    // Keep only the most recent logs
    const trimmed = logs.slice(-MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Handle QuotaExceededError by clearing old logs and retrying
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn('localStorage quota exceeded, clearing old logs');
      try {
        // Keep only the most recent 100 logs
        const reduced = logs.slice(-100);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
      } catch {
        // If still failing, clear all and save just current
        localStorage.removeItem(STORAGE_KEY);
        console.error('Failed to save error logs even after clearing');
      }
    } else {
      console.error('Failed to save error logs:', e);
    }
  }
};

/**
 * Save ETL traces to localStorage
 */
const saveETLTraces = (traces: ETLTraceLog[]): void => {
  try {
    const trimmed = traces.slice(-100);
    localStorage.setItem(TRACE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Handle QuotaExceededError by clearing old traces and retrying
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn('localStorage quota exceeded, clearing old traces');
      try {
        const reduced = traces.slice(-20);
        localStorage.setItem(TRACE_KEY, JSON.stringify(reduced));
      } catch {
        localStorage.removeItem(TRACE_KEY);
        console.error('Failed to save ETL traces even after clearing');
      }
    } else {
      console.error('Failed to save ETL traces:', e);
    }
  }
};

/**
 * Log an error
 */
export const logError = (category: string, message: string, details?: any, error?: Error): void => {
  const log: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: 'error',
    category,
    message,
    details,
    stack: error?.stack,
  };

  const logs = getErrorLogs();
  logs.push(log);
  saveErrorLogs(logs);

  // Also log to console
  console.error(`[${category}] ${message}`, details, error);
};

/**
 * Log a warning
 */
export const logWarning = (category: string, message: string, details?: any): void => {
  const log: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: 'warning',
    category,
    message,
    details,
  };

  const logs = getErrorLogs();
  logs.push(log);
  saveErrorLogs(logs);

  console.warn(`[${category}] ${message}`, details);
};

/**
 * Log info
 */
export const logInfo = (category: string, message: string, details?: any): void => {
  const log: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: 'info',
    category,
    message,
    details,
  };

  const logs = getErrorLogs();
  logs.push(log);
  saveErrorLogs(logs);

  console.info(`[${category}] ${message}`, details);
};

/**
 * Log debug info
 */
export const logDebug = (category: string, message: string, details?: any): void => {
  const log: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: 'debug',
    category,
    message,
    details,
  };

  const logs = getErrorLogs();
  logs.push(log);
  saveErrorLogs(logs);

  console.debug(`[${category}] ${message}`, details);
};

/**
 * Track an ETL step
 */
export const trackETLStep = (
  step: string,
  inputCount: number,
  outputCount: number,
  duration: number,
  errors: string[] = [],
  warnings: string[] = [],
  sampleData?: any
): void => {
  const trace: ETLTraceLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    step,
    inputCount,
    outputCount,
    duration,
    errors,
    warnings,
    sampleData,
  };

  const traces = getETLTraces();
  traces.push(trace);
  saveETLTraces(traces);

  // Log summary
  if (errors.length > 0) {
    console.error(`[ETL:${step}] Completed with ${errors.length} errors`, {
      inputCount,
      outputCount,
      duration,
      errors,
    });
  } else if (warnings.length > 0) {
    console.warn(`[ETL:${step}] Completed with ${warnings.length} warnings`, {
      inputCount,
      outputCount,
      duration,
      warnings,
    });
  } else {
    console.info(`[ETL:${step}] Completed`, { inputCount, outputCount, duration });
  }
};

/**
 * Clear all error logs
 */
export const clearErrorLogs = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Clear all ETL traces
 */
export const clearETLTraces = (): void => {
  localStorage.removeItem(TRACE_KEY);
};

/**
 * Clear all logs
 */
export const clearAllLogs = (): void => {
  clearErrorLogs();
  clearETLTraces();
};

/**
 * Export logs as JSON for debugging
 */
export const exportLogs = (): string => {
  const data = {
    exportedAt: new Date().toISOString(),
    errorLogs: getErrorLogs(),
    etlTraces: getETLTraces(),
  };
  return JSON.stringify(data, null, 2);
};

/**
 * Download logs as a file
 */
export const downloadLogs = (): void => {
  const json = exportLogs();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hmda_debug_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Get error summary stats
 */
export const getErrorStats = (): {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  debug: number;
  byCategory: Record<string, number>;
} => {
  const logs = getErrorLogs();
  const stats = {
    total: logs.length,
    errors: 0,
    warnings: 0,
    info: 0,
    debug: 0,
    byCategory: {} as Record<string, number>,
  };

  logs.forEach(log => {
    // Map level names to stats property names
    const levelMap: Record<string, keyof typeof stats> = {
      error: 'errors',
      warning: 'warnings',
      info: 'info',
      debug: 'debug',
    };
    const statKey = levelMap[log.level];
    if (statKey && statKey !== 'total' && statKey !== 'byCategory') {
      (stats[statKey] as number)++;
    }
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
  });

  return stats;
};

/**
 * Get recent errors (last N)
 */
export const getRecentErrors = (count: number = 10): ErrorLog[] => {
  return getErrorLogs()
    .filter(log => log.level === 'error')
    .slice(-count);
};

/**
 * Get logs by category
 */
export const getLogsByCategory = (category: string): ErrorLog[] => {
  return getErrorLogs().filter(log => log.category === category);
};

// Export a default tracker object for convenience
export const ErrorTracker = {
  error: logError,
  warn: logWarning,
  info: logInfo,
  debug: logDebug,
  trackETL: trackETLStep,
  getLogs: getErrorLogs,
  getTraces: getETLTraces,
  getStats: getErrorStats,
  getRecent: getRecentErrors,
  clear: clearAllLogs,
  export: exportLogs,
  download: downloadLogs,
};

export default ErrorTracker;
