/**
 * Deterministic Financial Calculation Library
 * Handles null, zero, and negative denominators explicitly.
 * Never invents numbers. Every ratio in TrustLens is computed by these pure functions.
 */

export interface CalcResult {
  value: number | null;
  formatted: string;
  status: 'valid' | 'missing_input' | 'zero_denominator' | 'negative_equity';
  note: string;
}

export function roundTo(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined
): { value: number | null; error?: string } {
  if (numerator === null || numerator === undefined || denominator === null || denominator === undefined) {
    return { value: null, error: 'Missing numerator or denominator (Null)' };
  }
  if (denominator === 0) {
    return { value: null, error: 'Division by zero blocked by deterministic guard' };
  }
  return { value: roundTo(numerator / denominator, 4) };
}


/**
 * Gross Margin (%) = ((Revenue - COGS) / Revenue) * 100
 */
export function calcGrossMargin(revenue: number | null | undefined, cogs: number | null | undefined): CalcResult {
  if (revenue === null || revenue === undefined || cogs === null || cogs === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: 'Revenue or COGS is missing.' };
  }
  if (revenue === 0) {
    return { value: null, formatted: 'N/A (Zero Revenue)', status: 'zero_denominator', note: 'Cannot divide by zero revenue.' };
  }
  const gm = roundTo(((revenue - cogs) / revenue) * 100, 1);
  return {
    value: gm,
    formatted: `${gm.toFixed(1)}%`,
    status: 'valid',
    note: `((${revenue.toFixed(1)} - ${cogs.toFixed(1)}) / ${revenue.toFixed(1)}) × 100 = ${gm.toFixed(1)}%`,
  };
}

/**
 * Net Margin (%) = (Net Income / Revenue) * 100
 */
export function calcNetMargin(netIncome: number | null | undefined, revenue: number | null | undefined): CalcResult {
  if (netIncome === null || netIncome === undefined || revenue === null || revenue === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: 'Net income or revenue is missing.' };
  }
  if (revenue === 0) {
    return { value: null, formatted: 'N/A (Zero Revenue)', status: 'zero_denominator', note: 'Cannot divide by zero revenue.' };
  }
  const nm = roundTo((netIncome / revenue) * 100, 1);
  return {
    value: nm,
    formatted: `${nm.toFixed(1)}%`,
    status: 'valid',
    note: `(${netIncome.toFixed(1)} / ${revenue.toFixed(1)}) × 100 = ${nm.toFixed(1)}%`,
  };
}

/**
 * Return on Assets (ROA %) = (Net Income / Total Assets) * 100
 */
export function calcROA(netIncome: number | null | undefined, totalAssets: number | null | undefined): CalcResult {
  if (netIncome === null || netIncome === undefined || totalAssets === null || totalAssets === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: 'Net income or total assets is missing.' };
  }
  if (totalAssets <= 0) {
    return { value: null, formatted: 'N/A (Invalid Assets)', status: 'zero_denominator', note: 'Total assets must be positive.' };
  }
  const roa = roundTo((netIncome / totalAssets) * 100, 1);
  return {
    value: roa,
    formatted: `${roa.toFixed(1)}%`,
    status: 'valid',
    note: `(${netIncome.toFixed(1)} / ${totalAssets.toFixed(1)}) × 100 = ${roa.toFixed(1)}%`,
  };
}

/**
 * Return on Equity (ROE %) = (Net Income / Equity) * 100
 */
export function calcROE(netIncome: number | null | undefined, equity: number | null | undefined): CalcResult {
  if (netIncome === null || netIncome === undefined || equity === null || equity === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: 'Net income or equity is missing.' };
  }
  if (equity === 0) {
    return { value: null, formatted: 'N/A (Zero Equity)', status: 'zero_denominator', note: 'Cannot divide by zero equity.' };
  }
  if (equity < 0) {
    return { value: null, formatted: 'N/M (Negative Equity)', status: 'negative_equity', note: 'ROE is not meaningful when shareholders equity is negative.' };
  }
  const roe = roundTo((netIncome / equity) * 100, 1);
  return {
    value: roe,
    formatted: `${roe.toFixed(1)}%`,
    status: 'valid',
    note: `(${netIncome.toFixed(1)} / ${equity.toFixed(1)}) × 100 = ${roe.toFixed(1)}%`,
  };
}

/**
 * Current Ratio (x) = Current Assets / Current Liabilities
 */
export function calcCurrentRatio(currentAssets: number | null | undefined, currentLiabilities: number | null | undefined): CalcResult {
  if (currentAssets === null || currentAssets === undefined || currentLiabilities === null || currentLiabilities === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: 'Current assets or current liabilities is missing.' };
  }
  if (currentLiabilities <= 0) {
    return { value: null, formatted: 'N/A (Zero Liabilities)', status: 'zero_denominator', note: 'Current liabilities must be positive.' };
  }
  const cr = roundTo(currentAssets / currentLiabilities, 2);
  return {
    value: cr,
    formatted: `${cr.toFixed(2)}x`,
    status: 'valid',
    note: `${currentAssets.toFixed(1)} / ${currentLiabilities.toFixed(1)} = ${cr.toFixed(2)}x`,
  };
}

/**
 * Debt-to-Equity (x) = Total Liabilities / Shareholders' Equity
 */
export function calcDebtToEquity(totalLiabilities: number | null | undefined, equity: number | null | undefined): CalcResult {
  if (totalLiabilities === null || totalLiabilities === undefined || equity === null || equity === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: 'Total liabilities or equity is missing.' };
  }
  if (equity === 0) {
    return { value: null, formatted: 'N/A (Zero Equity)', status: 'zero_denominator', note: 'Cannot divide by zero equity.' };
  }
  if (equity < 0) {
    return { value: null, formatted: 'N/M (Negative Equity)', status: 'negative_equity', note: 'D/E is not meaningful with negative equity.' };
  }
  const de = roundTo(totalLiabilities / equity, 2);
  return {
    value: de,
    formatted: `${de.toFixed(2)}x`,
    status: 'valid',
    note: `${totalLiabilities.toFixed(1)} / ${equity.toFixed(1)} = ${de.toFixed(2)}x`,
  };
}

/**
 * Asset Turnover (x) = Revenue / Total Assets
 */
export function calcAssetTurnover(revenue: number | null | undefined, totalAssets: number | null | undefined): CalcResult {
  if (revenue === null || revenue === undefined || totalAssets === null || totalAssets === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: 'Revenue or total assets is missing.' };
  }
  if (totalAssets <= 0) {
    return { value: null, formatted: 'N/A (Invalid Assets)', status: 'zero_denominator', note: 'Total assets must be positive.' };
  }
  const at = roundTo(revenue / totalAssets, 2);
  return {
    value: at,
    formatted: `${at.toFixed(2)}x`,
    status: 'valid',
    note: `${revenue.toFixed(1)} / ${totalAssets.toFixed(1)} = ${at.toFixed(2)}x`,
  };
}

/**
 * Period-over-Period Growth (YoY or QoQ %) = ((Current - Prior) / |Prior|) * 100
 */
export function calcPeriodChange(current: number | null | undefined, prior: number | null | undefined, label = 'YoY'): CalcResult {
  if (current === null || current === undefined || prior === null || prior === undefined) {
    return { value: null, formatted: 'N/A (Missing Data)', status: 'missing_input', note: `Current or prior period value is missing for ${label} calculation.` };
  }
  if (prior === 0) {
    return { value: null, formatted: 'N/A (Zero Base)', status: 'zero_denominator', note: `Prior period value is zero; ${label} percentage growth undefined.` };
  }
  const pct = roundTo(((current - prior) / Math.abs(prior)) * 100, 1);
  const sign = pct > 0 ? '+' : '';
  return {
    value: pct,
    formatted: `${sign}${pct.toFixed(1)}%`,
    status: 'valid',
    note: `((${current.toFixed(1)} - ${prior.toFixed(1)}) / ${Math.abs(prior).toFixed(1)}) × 100 = ${sign}${pct.toFixed(1)}%`,
  };
}

/**
 * Built-in Deterministic Calculation Unit Tests (runnable in UI and evaluation page)
 */
export interface UnitTestCase {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runDeterministicUnitTests(): UnitTestCase[] {
  const gm24 = calcGrossMargin(540.0, 324.0);
  const nm24 = calcNetMargin(59.4, 540.0);
  const cr24 = calcCurrentRatio(275, 165);
  const de24 = calcDebtToEquity(371, 297);
  const roa24 = calcROA(59.4, 668);
  const roe24 = calcROE(59.4, 297);
  const at24 = calcAssetTurnover(540.0, 668);
  const revYoY24 = calcPeriodChange(540.0, 468.0, 'YoY');
  const q4OcfMissing = calcPeriodChange(null, 18.0, 'QoQ');
  const zeroDiv = calcNetMargin(10, 0);
  const negEquity = calcROE(25, -50);

  return [
    {
      id: 'UT-1',
      name: 'Aurora FY2024 Gross Margin ((540 - 324) / 540)',
      passed: gm24.value === 40.0,
      expected: '40.0%',
      actual: gm24.formatted,
    },
    {
      id: 'UT-2',
      name: 'Aurora FY2024 Net Margin (59.4 / 540.0)',
      passed: nm24.value === 11.0,
      expected: '11.0%',
      actual: nm24.formatted,
    },
    {
      id: 'UT-3',
      name: 'Aurora FY2024 Current Ratio (275 / 165)',
      passed: cr24.value === 1.67,
      expected: '1.67x',
      actual: cr24.formatted,
    },
    {
      id: 'UT-4',
      name: 'Aurora FY2024 Debt-to-Equity (371 / 297)',
      passed: de24.value === 1.25,
      expected: '1.25x',
      actual: de24.formatted,
    },
    {
      id: 'UT-5',
      name: 'Aurora FY2024 Return on Assets (59.4 / 668)',
      passed: roa24.value === 8.9,
      expected: '8.9%',
      actual: roa24.formatted,
    },
    {
      id: 'UT-6',
      name: 'Aurora FY2024 Return on Equity (59.4 / 297)',
      passed: roe24.value === 20.0,
      expected: '20.0%',
      actual: roe24.formatted,
    },
    {
      id: 'UT-7',
      name: 'Aurora FY2024 Asset Turnover (540 / 668)',
      passed: at24.value === 0.81,
      expected: '0.81x',
      actual: at24.formatted,
    },
    {
      id: 'UT-8',
      name: 'Aurora FY2024 Revenue YoY ((540 - 468) / 468)',
      passed: revYoY24.value === 15.4,
      expected: '+15.4%',
      actual: revYoY24.formatted,
    },
    {
      id: 'UT-9',
      name: 'Null Handling: Missing Q4 Operating Cash Flow QoQ',
      passed: q4OcfMissing.value === null && q4OcfMissing.status === 'missing_input',
      expected: 'N/A (Missing Data)',
      actual: q4OcfMissing.formatted,
    },
    {
      id: 'UT-10',
      name: 'Zero Denominator Guard (Revenue = 0)',
      passed: zeroDiv.value === null && zeroDiv.status === 'zero_denominator',
      expected: 'N/A (Zero Revenue)',
      actual: zeroDiv.formatted,
    },
    {
      id: 'UT-11',
      name: 'Negative Equity Guard (Equity = -50)',
      passed: negEquity.value === null && negEquity.status === 'negative_equity',
      expected: 'N/M (Negative Equity)',
      actual: negEquity.formatted,
    },
  ];
}
