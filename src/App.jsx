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
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const clearForm = () => {
    setSalesPrice('');
    setInterestRate('');
    setLoanType('VA First');
    setLocation('Columbus, GA');
    setCityLimits('Inside');
    setResult(null);
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

    const closingCostsItems = [
      { label: 'Underwriting Fee', value: formatCurrency(underwritingFee) },
      { label: 'Attorney Fee', value: formatCurrency(attorneyFee) },
      { label: 'Title Search Fee', value: formatCurrency(titleSearchFee) },
      { label: 'Recording Fee', value: formatCurrency(recordingFee) },
      { label: 'Credit Report Fee', value: formatCurrency(creditReportFee) },
      { label: 'Appraisal Fee', value: formatCurrency(appraisalFee) },
      { label: "Owner's Title Insurance", value: formatCurrency(ownerTitle) },
      { label: "Lender's Title Insurance", value: formatCurrency(lenderTitle) },
      { label: 'Mortgage Tax', value: formatCurrency(mortgageTax) },
      { label: 'Transfer Tax', value: formatCurrency(transferTax) },
    ];

    const closingCostsTotal = underwritingFee + attorneyFee + titleSearchFee + recordingFee + creditReportFee + appraisalFee + ownerTitle + lenderTitle + mortgageTax + transferTax;

    const prepaidInterest = (loanAmount * rate / 365) * 15;
    const insuranceCushion = insurance / 12 * 3;
    const propertyTaxEscrow = (yearlyTaxHomestead / 12) * 4;

    const prepaidsItems = [
      { label: 'Prepaid Interest (15 days)', value: formatCurrency(prepaidInterest) },
      { label: 'Insurance (1yr prepaid)', value: formatCurrency(insurance) },
      { label: 'Insurance Cushion (3 mo)', value: formatCurrency(insuranceCushion) },
      { label: 'Property Tax Escrow (4 mo)', value: formatCurrency(propertyTaxEscrow) },
    ];

    const prepaidsTotal = prepaidInterest + insurance + insuranceCushion + propertyTaxEscrow;
    const totalCashToClose = closingCostsTotal + prepaidsTotal;

    setResult({
      loanAmount: formatCurrency(loanAmount),
      principalInterest: formatCurrency(principalInterest),
      homeownersInsurance: formatCurrency(homeownersInsurance),
      monthlyTaxHomestead: formatCurrency(monthlyTaxHomestead),
      monthlyTaxNonHomestead: formatCurrency(monthlyTaxNonHomestead),
      pitiHomestead: formatCurrency(pitiHomestead),
      pitiNonHomestead: formatCurrency(pitiNonHomestead),
      closingCosts: closingCostsItems,
      totalClosingCosts: formatCurrency(closingCostsTotal),
      prepaids: prepaidsItems,
      totalPrepaids: formatCurrency(prepaidsTotal),
      totalCashToClose: formatCurrency(totalCashToClose),
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-gray-800 shadow-lg rounded-2xl p-6 sm:p-8 space-y-6 text-gray-100">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-300 text-center">Loan Estimate Generator</h1>

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
            className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg"
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
            className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg"
          />

          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg"
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
            className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg"
          >
            <option>Columbus, GA</option>
            <option>Lee County, AL</option>
            <option>Russell County, AL</option>
          </select>

          {location !== 'Columbus, GA' && (
            <select
              value={cityLimits}
              onChange={(e) => setCityLimits(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg"
            >
              <option>Inside</option>
              <option>Outside</option>
            </select>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={calculateEstimate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Get Estimate
            </button>
            <button
              onClick={clearForm}
              className="w-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Clear
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-6 bg-gray-700 border border-gray-600 p-4 sm:p-6 rounded-xl overflow-auto">
            {/* Loan Summary */}
            <div>
              <h2 className="text-lg font-bold text-blue-300 mb-2">Loan Summary</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Loan Amount:</span><span>{result.loanAmount}</span></div>
                <div className="flex justify-between"><span>Principal & Interest:</span><span>{result.principalInterest}</span></div>
                <div className="flex justify-between"><span>Homeowners Insurance:</span><span>{result.homeownersInsurance}</span></div>
                <div className="flex justify-between"><span>Monthly Tax (Homestead):</span><span>{result.monthlyTaxHomestead}</span></div>
                <div className="flex justify-between"><span>Monthly Tax (Non-Homestead):</span><span>{result.monthlyTaxNonHomestead}</span></div>
              </div>
            </div>

            {/* Monthly Payment */}
            <div>
              <h2 className="text-lg font-bold text-blue-300 mb-2">Monthly Payment</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between font-semibold text-green-400"><span>PITI - Homestead:</span><span>{result.pitiHomestead}</span></div>
                <div className="flex justify-between font-semibold text-green-400"><span>PITI - Non-Homestead:</span><span>{result.pitiNonHomestead}</span></div>
              </div>
            </div>

            {/* Closing Costs */}
            <div>
              <h2 className="text-lg font-bold text-blue-300 mb-2">Closing Costs</h2>
              <div className="space-y-1 text-sm">
                {result.closingCosts.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-2 font-semibold text-yellow-400 border-t border-gray-500 pt-2">
                  <span>Total Closing Costs:</span><span>{result.totalClosingCosts}</span>
                </div>
              </div>
            </div>

            {/* Prepaids & Escrows */}
            <div>
              <h2 className="text-lg font-bold text-blue-300 mb-2">Prepaids & Escrows</h2>
              <div className="space-y-1 text-sm">
                {result.prepaids.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-2 font-semibold text-yellow-400 border-t border-gray-500 pt-2">
                  <span>Total Prepaids & Escrows:</span><span>{result.totalPrepaids}</span>
                </div>
              </div>
            </div>

            {/* Final Total */}
            <div className="text-xl font-bold text-orange-400 border-t border-gray-500 pt-4 flex justify-between">
              <span>Final Cash to Close:</span><span>{result.totalCashToClose}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
