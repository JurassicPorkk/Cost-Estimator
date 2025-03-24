import React, { useState, useEffect } from 'react';

function unformatCurrency(value) {
  return value.replace(/[^0-9.]/g, '');
}

function formatCurrency(value) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function App() {
  const [salesPrice, setSalesPrice] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanType, setLoanType] = useState('VA First');
  const [location, setLocation] = useState('Columbus, GA');
  const [cityLimits, setCityLimits] = useState('Inside');
  const [result, setResult] = useState('');
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  // ✅ Apply or remove the dark class on <html>
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const clearForm = () => {
    setSalesPrice('');
    setInterestRate('');
    setLoanType('VA First');
    setLocation('Columbus, GA');
    setCityLimits('Inside');
    setResult('');
  };

  const calculateEstimate = () => {
    const sales = parseFloat(unformatCurrency(salesPrice));
    const rate = parseFloat(unformatCurrency(interestRate)) / 100;
    const insurance = 1500;
    const termMonths = 360;

    let loanAmount = 0;
    if (loanType === 'Conventional') loanAmount = sales * 0.95;
    else if (loanType === 'FHA') loanAmount = sales * 0.965 * 1.0175;
    else if (loanType === 'VA First') loanAmount = sales * 1.0215;
    else if (loanType === 'VA Second') loanAmount = sales * 1.033;
    else if (loanType === 'VA Exempt') loanAmount = sales;

    const monthlyRate = rate / 12;
    const principalInterest = (monthlyRate * loanAmount) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    const homeownersInsurance = insurance / 12;

    let yearlyTaxHomestead = 0;
    let yearlyTaxNonHomestead = 0;

    if (location === 'Columbus, GA') {
      yearlyTaxHomestead = sales * 0.4 * 0.04153 - 543;
      yearlyTaxNonHomestead = sales * 0.4 * 0.04153;
    }

    if (location === 'Lee County, AL') {
      if (cityLimits === 'Inside') {
        yearlyTaxHomestead = sales * 0.1 * 0.054 + 169;
        yearlyTaxNonHomestead = sales * 0.2 * 0.054 + 169;
      } else {
        yearlyTaxHomestead = sales * 0.1 * 0.041 + 169;
        yearlyTaxNonHomestead = sales * 0.2 * 0.041 + 169;
      }
    }

    if (location === 'Russell County, AL') {
      if (cityLimits === 'Inside') {
        yearlyTaxHomestead = sales * 0.1 * 0.059 - 74;
        yearlyTaxNonHomestead = sales * 0.2 * 0.059 - 74;
      } else {
        yearlyTaxHomestead = sales * 0.1 * 0.036 - 74;
        yearlyTaxNonHomestead = sales * 0.2 * 0.036 - 74;
      }
    }

    const monthlyTaxHomestead = yearlyTaxHomestead / 12;
    const monthlyTaxNonHomestead = yearlyTaxNonHomestead / 12;
    const pitiHomestead = principalInterest + homeownersInsurance + monthlyTaxHomestead;
    const pitiNonHomestead = principalInterest + homeownersInsurance + monthlyTaxNonHomestead;

    const underwritingFee = 1320;
    const attorneyFee = 1075;
    const titleSearchFee = 250;
    const recordingFee = 70;
    const creditReportFee = 140;
    const appraisalFee = loanType.includes('VA')
      ? (location.includes('GA') ? 650 : 600)
      : loanType === 'FHA' ? 600 : 525;

    const ownerTitle = location === 'Columbus, GA' ? sales * 0.0022 : sales * 0.0011;
    const lenderTitle = location === 'Columbus, GA' ? loanAmount * 0.00352 : loanAmount * 0.00216;

    const mortgageTax = location === 'Columbus, GA'
      ? (loanAmount / 100) * 0.30
      : (loanAmount / 100) * 0.15;

    let transferTax = location === 'Columbus, GA'
      ? (sales / 1000) * 1.0
      : (sales - loanAmount) / 1000;
    if (transferTax < 0) transferTax = 0;

    const closingCosts = underwritingFee + attorneyFee + titleSearchFee + recordingFee + creditReportFee + appraisalFee + ownerTitle + lenderTitle + mortgageTax + transferTax;

    const prepaidInterest = (loanAmount * rate / 365) * 15;
    const insuranceCushion = insurance / 12 * 3;
    const propertyTaxEscrow = (yearlyTaxHomestead / 12) * 4;

    const prepaidsEscrows = prepaidInterest + insurance + insuranceCushion + propertyTaxEscrow;
    const totalCashToClose = closingCosts + prepaidsEscrows;

    setResult(`💬 Loan Estimate Breakdown
-----------------------------
Loan Amount: ${formatCurrency(loanAmount)}
Principal & Interest: ${formatCurrency(principalInterest)}
Homeowners Insurance: ${formatCurrency(homeownersInsurance)}
Monthly Tax (Homestead): ${formatCurrency(monthlyTaxHomestead)}
Monthly Tax (Non-Homestead): ${formatCurrency(monthlyTaxNonHomestead)}

Total Monthly Payment (PITI - Homestead): ${formatCurrency(pitiHomestead)}
Total Monthly Payment (PITI - Non-Homestead): ${formatCurrency(pitiNonHomestead)}

--- Closing Costs ---
Underwriting Fee: ${formatCurrency(underwritingFee)}
Attorney Fee: ${formatCurrency(attorneyFee)}
Title Search Fee: ${formatCurrency(titleSearchFee)}
Recording Fee: ${formatCurrency(recordingFee)}
Credit Report Fee: ${formatCurrency(creditReportFee)}
Appraisal Fee: ${formatCurrency(appraisalFee)}
Owner's Title Insurance: ${formatCurrency(ownerTitle)}
Lender's Title Insurance: ${formatCurrency(lenderTitle)}
Mortgage Tax: ${formatCurrency(mortgageTax)}
Transfer Tax: ${formatCurrency(transferTax)}
Closing Costs Total: ${formatCurrency(closingCosts)}

--- Prepaids & Escrows ---
Prepaid Interest (15 days): ${formatCurrency(prepaidInterest)}
Insurance (1yr prepaid): ${formatCurrency(insurance)}
Insurance Cushion (3 mo): ${formatCurrency(insuranceCushion)}
Property Tax Escrow (4 mo): ${formatCurrency(propertyTaxEscrow)}
Prepaids & Escrows Total: ${formatCurrency(prepaidsEscrows)}

💰 Final Cash to Close: ${formatCurrency(totalCashToClose)}
`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-all duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 space-y-6 text-gray-800 dark:text-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            Loan Estimate Generator
          </h1>
          <button
            onClick={toggleDarkMode}
            className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded transition"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Sales Price"
            value={salesPrice}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              const formatted = raw
                ? Number(raw).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  })
                : '';
              setSalesPrice(formatted);
            }}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600"
          />

          <input
            type="text"
            placeholder="Interest Rate"
            value={interestRate}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, '');
              const formatted = raw ? `${raw}%` : '';
              setInterestRate(formatted);
            }}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600"
          />

          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option>VA First</option>
            <option>VA Second</option>
            <option>VA Exempt</option>
            <option>FHA</option>
            <option>Conventional</option>
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option>Columbus, GA</option>
            <option>Lee County, AL</option>
            <option>Russell County, AL</option>
          </select>

          {location !== 'Columbus, GA' && (
            <select
              value={cityLimits}
              onChange={(e) => setCityLimits(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600"
            >
              <option>Inside</option>
              <option>Outside</option>
            </select>
          )}

          <div className="flex gap-4">
            <button
              onClick={calculateEstimate}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Get Estimate
            </button>
            <button
              onClick={clearForm}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-gray-900 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Clear
            </button>
          </div>
        </div>

        {result && (
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-100 overflow-auto">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}
