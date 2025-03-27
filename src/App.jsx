// ✅ FULL APP.JSX FILE
// Includes:
// - Preset + custom down payment for FHA & Conventional
// - Custom input hidden unless selected
// - Live currency formatting
// - 3% PMI logic (0.4%) for Conventional
// - FHA MIP drop at 5%
// - Minimum down payment enforcement (3% Conv, 3.5% FHA)
// - Full UI with itemized cost breakdowns and dark mode

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
  const [loanType, setLoanType] = useState('Conventional');
  const [location, setLocation] = useState('Columbus, GA');
  const [cityLimits, setCityLimits] = useState('Inside');
  const [downOption, setDownOption] = useState('');
  const [customDown, setCustomDown] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const getSales = () => parseFloat(unformatCurrency(salesPrice)) || 0;
  const getDownPayment = () => {
    const custom = parseFloat(unformatCurrency(customDown));
    return downOption === 'custom' && custom > 0 ? custom : parseFloat(downOption) || 0;
  };

  const formatInput = (val) => {
    const raw = val.replace(/[^0-9]/g, '');
    return raw ? `$${Number(raw).toLocaleString()}` : '';
  };

  const validateMinDown = (sales, down) => {
    const minFHA = sales * 0.035;
    const minConv = sales * 0.03;
    if (loanType === 'FHA' && down < minFHA) return minFHA;
    if (loanType === 'Conventional' && down < minConv) return minConv;
    return down;
  };

  const calculate = () => {
    const sales = getSales();
    const rate = parseFloat(unformatCurrency(interestRate)) / 100;
    let downPayment = getDownPayment();
    downPayment = validateMinDown(sales, downPayment);
    const percentDown = downPayment / sales;
    const insurance = 1500;
    let loan = 0;

    if (loanType === 'Conventional') loan = sales - downPayment;
    else if (loanType === 'FHA') loan = (sales - downPayment) * 1.0175;
    else if (loanType.includes('VA')) {
      const baseLoan = sales - downPayment;
      let fee = 0;
      if (loanType === 'VA First') fee = percentDown >= 0.1 ? 0.0125 : percentDown >= 0.05 ? 0.015 : 0.0215;
      if (loanType === 'VA Second') fee = percentDown >= 0.1 ? 0.0125 : percentDown >= 0.05 ? 0.015 : 0.033;
      loan = baseLoan * (1 + fee);
    } else loan = sales;

    const monthlyRate = rate / 12;
    const PI = (monthlyRate * loan) / (1 - Math.pow(1 + monthlyRate, -360));
    const HI = insurance / 12;
    let MI = 0;
    if (loanType === 'Conventional') {
      if (percentDown < 0.03) MI = (loan * 0.004) / 12;
      else if (percentDown < 0.10) MI = (loan * 0.0035) / 12;
      else if (percentDown < 0.15) MI = (loan * 0.0025) / 12;
      else if (percentDown < 0.20) MI = (loan * 0.0015) / 12;
    }
    if (loanType === 'FHA') MI = (loan * (percentDown >= 0.05 ? 0.005 : 0.0055)) / 12;

    let taxHomestead = 0;
    let taxNon = 0;
    if (location === 'Columbus, GA') {
      taxHomestead = sales * 0.4 * 0.04153 - 543;
      taxNon = sales * 0.4 * 0.04153;
    } else if (location === 'Lee County, AL') {
      taxHomestead = cityLimits === 'Inside' ? sales * 0.1 * 0.054 + 169 : sales * 0.1 * 0.041 + 169;
      taxNon = cityLimits === 'Inside' ? sales * 0.2 * 0.054 + 169 : sales * 0.2 * 0.041 + 169;
    } else if (location === 'Russell County, AL') {
      taxHomestead = cityLimits === 'Inside' ? sales * 0.1 * 0.059 - 74 : sales * 0.1 * 0.036 - 74;
      taxNon = cityLimits === 'Inside' ? sales * 0.2 * 0.059 - 74 : sales * 0.2 * 0.036 - 74;
    } else if (location === 'Harris County, GA') {
      taxHomestead = sales * 0.4 * 0.02764;
      taxNon = sales * 0.4 * 0.02764 - 50;
    }

    const T_H = taxHomestead / 12;
    const T_N = taxNon / 12;
    const PITI_H = PI + HI + T_H + MI;
    const PITI_N = PI + HI + T_N + MI;

    const U = 1320, A = 1075, TS = 250, R = 70, CR = 140;
    const appraisal = loanType.includes('VA') ? location.includes('GA') ? 650 : 600 : loanType === 'FHA' ? 600 : 525;
    const OT = location === 'Columbus, GA' ? sales * 0.0022 : location === 'Harris County, GA' ? sales * 0.0024 : sales * 0.0011;
    const LT = location === 'Columbus, GA' ? loan * 0.00352 : location === 'Harris County, GA' ? loan * 0.0036 : loan * 0.00216;
    const MT = ['Columbus, GA', 'Harris County, GA'].includes(location) ? (loan / 100) * 0.3 : (loan / 100) * 0.15;
    let TT = ['Columbus, GA', 'Harris County, GA'].includes(location) ? (sales / 1000) * 1 : (sales - loan) / 1000;
    if (TT < 0) TT = 0;

    const closingItems = [
      { label: 'Underwriting Fee', value: U },
      { label: 'Attorney Fee', value: A },
      { label: 'Title Search Fee', value: TS },
      { label: 'Recording Fee', value: R },
      { label: 'Credit Report Fee', value: CR },
      { label: 'Appraisal Fee', value: appraisal },
      { label: "Owner's Title Insurance", value: OT },
      { label: "Lender's Title Insurance", value: LT },
      { label: 'Mortgage Tax', value: MT },
      { label: 'Transfer Tax', value: TT }
    ];
    const closingTotal = closingItems.reduce((acc, item) => acc + item.value, 0);

    const preItems = [
      { label: 'Prepaid Interest (15 days)', value: (loan * rate / 365) * 15 },
      { label: 'Insurance (1yr prepaid)', value: insurance },
      { label: 'Insurance Cushion (3 mo)', value: insurance / 12 * 3 },
      { label: 'Property Tax Escrow (4 mo)', value: (taxHomestead / 12) * 4 }
    ];
    const preTotal = preItems.reduce((acc, item) => acc + item.value, 0);
    const totalClose = closingTotal + preTotal + downPayment;

    setResult({
      sales: formatCurrency(sales),
      down: formatCurrency(downPayment),
      loan: formatCurrency(loan),
      PI: formatCurrency(PI),
      HI: formatCurrency(HI),
      MI: formatCurrency(MI),
      T_H: formatCurrency(T_H),
      T_N: formatCurrency(T_N),
      PITI_H: formatCurrency(PITI_H),
      PITI_N: formatCurrency(PITI_N),
      closing: closingItems.map(i => ({ ...i, value: formatCurrency(i.value) })),
      closingTotal: formatCurrency(closingTotal),
      prepaids: preItems.map(i => ({ ...i, value: formatCurrency(i.value) })),
      preTotal: formatCurrency(preTotal),
      totalClose: formatCurrency(totalClose)
    });
  };

  const downOptions = loanType === 'FHA'
    ? [3.5, 5]
    : loanType === 'Conventional'
    ? [3, 5, 10, 15, 20]
    : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-center">Loan Estimate Generator</h1>

        <input value={salesPrice} onChange={e => setSalesPrice(formatInput(e.target.value))} placeholder="Sales Price" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        <input value={interestRate} onChange={e => setInterestRate(e.target.value.replace(/[^0-9.]/g, '') + '%')} placeholder="Interest Rate" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />

        <select value={loanType} onChange={e => setLoanType(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600">
          <option>Conventional</option>
          <option>FHA</option>
          <option>VA First</option>
          <option>VA Second</option>
          <option>VA Exempt</option>
        </select>

        {(loanType === 'FHA' || loanType === 'Conventional') && getSales() > 0 && (
          <>
            <select value={downOption} onChange={e => setDownOption(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600">
              <option value="">Select Down Payment</option>
              {downOptions.map(p => {
                const amt = getSales() * (p / 100);
                return <option key={p} value={amt}>{p}% – {formatCurrency(amt)}</option>;
              })}
              <option value="custom">Custom Amount</option>
            </select>
            {downOption === 'custom' && (
              <input value={customDown} onChange={e => setCustomDown(formatInput(e.target.value))} placeholder="Custom Down Payment" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
            )}
          </>
        )}

        {loanType.includes('VA') && (
          <input value={customDown} onChange={e => setCustomDown(formatInput(e.target.value))} placeholder="Down Payment Amount" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        )}

        <select value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600">
          <option>Columbus, GA</option>
          <option>Lee County, AL</option>
          <option>Russell County, AL</option>
          <option>Harris County, GA</option>
        </select>

        {(location !== 'Columbus, GA' && location !== 'Harris County, GA') && (
          <select value={cityLimits} onChange={e => setCityLimits(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600">
            <option>Inside</option>
            <option>Outside</option>
          </select>
        )}

        <div className="flex gap-4">
          <button onClick={calculate} className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded">Get Estimate</button>
          <button onClick={() => window.location.reload()} className="flex-1 bg-gray-400 text-black hover:bg-gray-500 p-2 rounded">Clear</button>
        </div>

        {result && (
          <div className="bg-gray-800 p-4 rounded border border-gray-600 space-y-4">
            <h2 className="text-xl font-bold text-blue-300">Loan Summary</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Sales Price:</span><span>{result.sales}</span></div>
              <div className="flex justify-between"><span>Down Payment:</span><span>{result.down}</span></div>
              <div className="flex justify-between"><span>Loan Amount:</span><span>{result.loan}</span></div>
              <div className="flex justify-between"><span>Principal & Interest:</span><span>{result.PI}</span></div>
              <div className="flex justify-between"><span>Homeowners Insurance:</span><span>{result.HI}</span></div>
              <div className="flex justify-between"><span>Mortgage Insurance:</span><span>{result.MI}</span></div>
              <div className="flex justify-between"><span>Monthly Tax (Homestead):</span><span>{result.T_H}</span></div>
              <div className="flex justify-between"><span>Monthly Tax (Non-Homestead):</span><span>{result.T_N}</span></div>
            </div>

            <h2 className="text-lg font-bold text-green-400">Monthly Payment</h2>
            <div className="flex justify-between"><span>PITI - Homestead:</span><span>{result.PITI_H}</span></div>
            <div className="flex justify-between"><span>PITI - Non-Homestead:</span><span>{result.PITI_N}</span></div>

            <h2 className="text-lg font-bold text-blue-300">Closing Costs</h2>
            <div className="space-y-1 text-sm">
              {result.closing.map((item, i) => (
                <div key={i} className="flex justify-between"><span>{item.label}:</span><span>{item.value}</span></div>
              ))}
              <div className="flex justify-between font-semibold text-yellow-400 pt-2 border-t border-gray-600">
                <span>Total Closing Costs:</span><span>{result.closingTotal}</span>
              </div>
            </div>

            <h2 className="text-lg font-bold text-blue-300">Prepaids & Escrows</h2>
            <div className="space-y-1 text-sm">
              {result.prepaids.map((item, i) => (
                <div key={i} className="flex justify-between"><span>{item.label}:</span><span>{item.value}</span></div>
              ))}
              <div className="flex justify-between font-semibold text-yellow-400 pt-2 border-t border-gray-600">
                <span>Total Prepaids & Escrows:</span><span>{result.preTotal}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold text-orange-400 border-t border-gray-600 pt-4">
              <span>Final Cash to Close:</span><span>{result.totalClose}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
