// FULL APP.JSX WITH HYBRID DOWN PAYMENT SYSTEM FOR FHA & CONVENTIONAL
import React, { useState, useEffect } from 'react';

function unformatCurrency(value) {
  return value.replace(/[^0-9.]/g, '');
}

function formatCurrency(value) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function generateDownPaymentOptions(percentages, sales) {
  return percentages.map((p) => {
    const amount = sales * (p / 100);
    return {
      label: `${p}% – ${formatCurrency(amount)}`,
      value: amount
    };
  });
}

export default function App() {
  const [salesPrice, setSalesPrice] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanType, setLoanType] = useState('VA First');
  const [location, setLocation] = useState('Columbus, GA');
  const [cityLimits, setCityLimits] = useState('Inside');
  const [downPaymentPreset, setDownPaymentPreset] = useState('');
  const [customDownPayment, setCustomDownPayment] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const getSales = () => parseFloat(unformatCurrency(salesPrice)) || 0;

  const getDownPaymentAmount = () => {
    const preset = parseFloat(downPaymentPreset);
    const custom = parseFloat(unformatCurrency(customDownPayment));
    return !isNaN(custom) && custom > 0 ? custom : !isNaN(preset) ? preset : 0;
  };

  const clearForm = () => {
    setSalesPrice('');
    setInterestRate('');
    setLoanType('VA First');
    setLocation('Columbus, GA');
    setCityLimits('Inside');
    setDownPaymentPreset('');
    setCustomDownPayment('');
    setResult(null);
  };

  const handleSalesPriceChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const formatted = raw ? Number(raw).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }) : '';
    setSalesPrice(formatted);
  };

  const handleInterestRateChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const formatted = raw ? `${raw}%` : '';
    setInterestRate(formatted);
  };

  const calculateEstimate = () => {
    const sales = getSales();
    const rate = parseFloat(unformatCurrency(interestRate)) / 100;
    const insurance = 1500;
    const termMonths = 360;
    const downPaymentAmount = getDownPaymentAmount();
    const downPercent = downPaymentAmount / sales;

    let loanAmount = 0;
    if (loanType === 'Conventional') {
      loanAmount = sales - downPaymentAmount;
    } else if (loanType === 'FHA') {
      const baseLoan = sales - downPaymentAmount;
      loanAmount = baseLoan * 1.0175;
    } else if (loanType.includes('VA')) {
      const baseLoan = sales - downPaymentAmount;
      let feePercent = 0;
      if (loanType === 'VA First') {
        if (downPercent >= 0.1) feePercent = 0.0125;
        else if (downPercent >= 0.05) feePercent = 0.015;
        else feePercent = 0.0215;
      } else if (loanType === 'VA Second') {
        if (downPercent >= 0.1) feePercent = 0.0125;
        else if (downPercent >= 0.05) feePercent = 0.015;
        else feePercent = 0.033;
      } else {
        feePercent = 0;
      }
      loanAmount = baseLoan * (1 + feePercent);
    }

    const monthlyRate = rate / 12;
    const principalInterest = (monthlyRate * loanAmount) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    const homeownersInsurance = insurance / 12;

    let monthlyMI = 0;
    if (loanType === 'Conventional') {
      if (downPercent < 0.10) monthlyMI = (loanAmount * 0.0035) / 12;
      else if (downPercent < 0.15) monthlyMI = (loanAmount * 0.0025) / 12;
      else if (downPercent < 0.20) monthlyMI = (loanAmount * 0.0015) / 12;
    }
    if (loanType === 'FHA') {
      monthlyMI = (loanAmount * (downPercent >= 0.05 ? 0.005 : 0.0055)) / 12;
    }

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
    const pitiHomestead = principalInterest + homeownersInsurance + monthlyTaxHomestead + monthlyMI;
    const pitiNonHomestead = principalInterest + homeownersInsurance + monthlyTaxNonHomestead + monthlyMI;

    const underwritingFee = 1320;
    const attorneyFee = 1075;
    const titleSearchFee = 250;
    const recordingFee = 70;
    const creditReportFee = 140;
    const appraisalFee = loanType.includes('VA') ? (location.includes('GA') ? 650 : 600) : loanType === 'FHA' ? 600 : 525;

    let ownerTitle = 0;
    let lenderTitle = 0;
    if (location === 'Columbus, GA') {
      ownerTitle = sales * 0.0022;
      lenderTitle = loanAmount * 0.00352;
    } else if (location === 'Harris County, GA') {
      ownerTitle = sales * 0.0024;
      lenderTitle = loanAmount * 0.0036;
    } else {
      ownerTitle = sales * 0.0011;
      lenderTitle = loanAmount * 0.00216;
    }

    let mortgageTax = 0;
    let transferTax = 0;
    if (location === 'Columbus, GA' || location === 'Harris County, GA') {
      mortgageTax = (loanAmount / 100) * 0.30;
      transferTax = (sales / 1000) * 1.00;
    } else {
      mortgageTax = (loanAmount / 100) * 0.15;
      transferTax = (sales - loanAmount) / 1000;
      if (transferTax < 0) transferTax = 0;
    }

    const closingCostsTotal = underwritingFee + attorneyFee + titleSearchFee + recordingFee + creditReportFee + appraisalFee + ownerTitle + lenderTitle + mortgageTax + transferTax;

    const prepaidInterest = (loanAmount * rate / 365) * 15;
    const insuranceCushion = insurance / 12 * 3;
    const propertyTaxEscrow = (yearlyTaxHomestead / 12) * 4;
    const prepaidsTotal = prepaidInterest + insurance + insuranceCushion + propertyTaxEscrow;
    const totalCashToClose = closingCostsTotal + prepaidsTotal + downPaymentAmount;

    setResult({
      salesPrice: formatCurrency(sales),
      downPaymentAmount: formatCurrency(downPaymentAmount),
      loanAmount: formatCurrency(loanAmount),
      principalInterest: formatCurrency(principalInterest),
      homeownersInsurance: formatCurrency(homeownersInsurance),
      monthlyMI: formatCurrency(monthlyMI),
      monthlyTaxHomestead: formatCurrency(monthlyTaxHomestead),
      monthlyTaxNonHomestead: formatCurrency(monthlyTaxNonHomestead),
      pitiHomestead: formatCurrency(pitiHomestead),
      pitiNonHomestead: formatCurrency(pitiNonHomestead),
      totalClosingCosts: formatCurrency(closingCostsTotal),
      totalPrepaids: formatCurrency(prepaidsTotal),
      totalCashToClose: formatCurrency(totalCashToClose)
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-center">Loan Estimate Generator</h1>

        <input type="text" placeholder="Sales Price" value={salesPrice} onChange={handleSalesPriceChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        <input type="text" placeholder="Interest Rate" value={interestRate} onChange={handleInterestRateChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />

        <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600">
          <option>VA First</option>
          <option>VA Second</option>
          <option>VA Exempt</option>
          <option>FHA</option>
          <option>Conventional</option>
        </select>

        {(loanType === 'Conventional' || loanType === 'FHA') && getSales() > 0 && (
          <>
            <select
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              value={downPaymentPreset}
              onChange={(e) => setDownPaymentPreset(e.target.value)}>
              <option value="">Select Down Payment</option>
              {generateDownPaymentOptions(
                loanType === 'FHA' ? [3.5, 5, 10, 15] : [5, 10, 15, 20],
                getSales()
              ).map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or enter custom down payment"
              value={customDownPayment}
              onChange={(e) => setCustomDownPayment(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </>
        )}

        {loanType.includes('VA') && (
          <input
            type="text"
            placeholder="VA Down Payment Amount"
            value={customDownPayment}
            onChange={(e) => setCustomDownPayment(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
        )}

        <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600">
          <option>Columbus, GA</option>
          <option>Lee County, AL</option>
          <option>Russell County, AL</option>
          <option>Harris County, GA</option>
        </select>

        {(location !== 'Columbus, GA' && location !== 'Harris County, GA') && (
          <select value={cityLimits} onChange={(e) => setCityLimits(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600">
            <option>Inside</option>
            <option>Outside</option>
          </select>
        )}

        <div className="flex gap-4">
          <button onClick={calculateEstimate} className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded">Get Estimate</button>
          <button onClick={clearForm} className="flex-1 bg-gray-400 text-black hover:bg-gray-500 p-2 rounded">Clear</button>
        </div>

        {result && (
          <div className="bg-gray-800 p-4 rounded border border-gray-600 space-y-4">
            <h2 className="text-xl font-semibold text-blue-300">Loan Summary</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Sales Price:</span><span>{result.salesPrice}</span></div>
              <div className="flex justify-between"><span>Down Payment:</span><span>{result.downPaymentAmount}</span></div>
              <div className="flex justify-between"><span>Loan Amount:</span><span>{result.loanAmount}</span></div>
              <div className="flex justify-between"><span>Principal & Interest:</span><span>{result.principalInterest}</span></div>
              <div className="flex justify-between"><span>Homeowners Insurance:</span><span>{result.homeownersInsurance}</span></div>
              <div className="flex justify-between"><span>Mortgage Insurance:</span><span>{result.monthlyMI}</span></div>
              <div className="flex justify-between"><span>Monthly Tax (Homestead):</span><span>{result.monthlyTaxHomestead}</span></div>
              <div className="flex justify-between"><span>Monthly Tax (Non-Homestead):</span><span>{result.monthlyTaxNonHomestead}</span></div>
            </div>

            <h2 className="text-lg font-semibold text-green-400">Monthly Payment</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>PITI - Homestead:</span><span>{result.pitiHomestead}</span></div>
              <div className="flex justify-between"><span>PITI - Non-Homestead:</span><span>{result.pitiNonHomestead}</span></div>
            </div>

            <h2 className="text-xl font-semibold text-blue-300">Closing Costs</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Total Closing Costs:</span><span>{result.totalClosingCosts}</span></div>
            </div>

            <h2 className="text-xl font-semibold text-blue-300">Prepaids & Escrows</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Total Prepaids & Escrows:</span><span>{result.totalPrepaids}</span></div>
            </div>

            <div className="flex justify-between font-bold text-orange-400 border-t border-gray-600 pt-4 text-lg">
              <span>Final Cash to Close:</span>
              <span>{result.totalCashToClose}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
