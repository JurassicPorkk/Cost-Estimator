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

  const handleSalesPriceChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const formatted = raw
      ? Number(raw).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        })
      : '';
    setSalesPrice(formatted);
  };

  const handleInterestRateChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const formatted = raw ? `${raw}%` : '';
    setInterestRate(formatted);
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
    } else if (location === 'Lee County, AL') {
      if (cityLimits === 'Inside') {
        yearlyTaxHomestead = sales * 0.1 * 0.054 + 169;
        yearlyTaxNonHomestead = sales * 0.2 * 0.054 + 169;
      } else {
        yearlyTaxHomestead = sales * 0.1 * 0.041 + 169;
        yearlyTaxNonHomestead = sales * 0.2 * 0.041 + 169;
      }
    } else if (location === 'Russell County, AL') {
      if (cityLimits === 'Inside') {
        yearlyTaxHomestead = sales * 0.1 * 0.059 - 74;
        yearlyTaxNonHomestead = sales * 0.2 * 0.059 - 74;
      } else {
        yearlyTaxHomestead = sales * 0.1 * 0.036 - 74;
        yearlyTaxNonHomestead = sales * 0.2 * 0.036 - 74;
      }
    } else if (location === 'Harris County, GA') {
      yearlyTaxHomestead = sales * 0.4 * 0.02764;
      yearlyTaxNonHomestead = sales * 0.4 * 0.02764 - 50;
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
      { label: \"Owner's Title Insurance\", value: formatCurrency(ownerTitle) },
      { label: \"Lender's Title Insurance\", value: formatCurrency(lenderTitle) },
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
      totalCashToClose: formatCurrency(totalCashToClose)
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">Loan Estimate Generator</h1>

        <input
          type="text"
          placeholder="Sales Price"
          value={salesPrice}
          onChange={handleSalesPriceChange}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        />

        <input
          type="text"
          placeholder="Interest Rate"
          value={interestRate}
          onChange={handleInterestRateChange}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        />

        <select
          value={loanType}
          onChange={(e) => setLoanType(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
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
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        >
          <option>Columbus, GA</option>
          <option>Lee County, AL</option>
          <option>Russell County, AL</option>
          <option>Harris County, GA</option>
        </select>

        {(location !== 'Columbus, GA' && location !== 'Harris County, GA') && (
          <select
            value={cityLimits}
            onChange={(e) => setCityLimits(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          >
            <option>Inside</option>
            <option>Outside</option>
          </select>
        )}

        <div className="flex gap-4">
          <button onClick={calculateEstimate} className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded">Get Estimate</button>
          <button onClick={clearForm} className="flex-1 bg-gray-400 text-black hover:bg-gray-500 p-2 rounded">Clear</button>
        </div>

        {result && (
          <div className="bg-gray-800 p-4 rounded border border-gray-600 space-y-2">
            <h2 className="text-xl font-semibold text-blue-300">Estimate Breakdown</h2>
            <div className="flex justify-between"><span>Loan Amount:</span><span>{result.loanAmount}</span></div>
            <div className="flex justify-between"><span>Principal & Interest:</span><span>{result.principalInterest}</span></div>
            <div className="flex justify-between"><span>Homeowners Insurance:</span><span>{result.homeownersInsurance}</span></div>
            <div className="flex justify-between"><span>Monthly Tax (Homestead):</span><span>{result.monthlyTaxHomestead}</span></div>
            <div className="flex justify-between"><span>Monthly Tax (Non-Homestead):</span><span>{result.monthlyTaxNonHomestead}</span></div>
            <div className="flex justify-between font-bold text-green-400 pt-2 border-t border-gray-600">
              <span>Total PITI (Homestead):</span><span>{result.pitiHomestead}</span>
            </div>
            <div className="flex justify-between font-bold text-green-400">
              <span>Total PITI (Non-Homestead):</span><span>{result.pitiNonHomestead}</span>
            </div>

            <h3 className="pt-4 font-semibold text-blue-300">Closing Costs</h3>
            {result.closingCosts.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-yellow-400 border-t border-gray-600 pt-2">
              <span>Total Closing Costs:</span><span>{result.totalClosingCosts}</span>
            </div>

            <h3 className="pt-4 font-semibold text-blue-300">Prepaids & Escrows</h3>
            {result.prepaids.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-yellow-400 border-t border-gray-600 pt-2">
              <span>Total Prepaids:</span><span>{result.totalPrepaids}</span>
            </div>

            <div className="flex justify-between font-bold text-orange-400 border-t border-gray-600 pt-4 text-lg">
              <span>Final Cash to Close:</span><span>{result.totalCashToClose}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
