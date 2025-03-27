// App.jsx

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

function unformatCurrency(value) {
  return value.replace(/[^0-9.]/g, '');
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2).toLocaleString('en-US')}`;
}

export default function App() {
  const [salesPrice, setSalesPrice] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [location, setLocation] = useState('Columbus, GA');
  const [cityLimits, setCityLimits] = useState('Inside');
  const [downOption, setDownOption] = useState('');
  const [customDown, setCustomDown] = useState('');
  const [closingDate, setClosingDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const loanTypes = ['Conventional', 'FHA', 'VA First'];

  const getSales = () => parseFloat(unformatCurrency(salesPrice)) || 0;

  const getDownPayment = (loanType) => {
    const sales = getSales();
    const custom = parseFloat(unformatCurrency(customDown));
    if (downOption === 'custom' && custom > 0) return custom;

    const presetMap = {
      'Conventional': [3, 5, 10, 15, 20],
      'FHA': [3.5, 5],
      'VA First': [5, 10, 15, 20]
    };

    const selected = parseFloat(downOption);
    if (presetMap[loanType]?.includes(selected)) return sales * (selected / 100);

    return 0;
  };

  const getTaxValues = (location, cityLimits, sales) => {
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

    return {
      monthlyTaxHomestead: taxHomestead / 12,
      monthlyTaxNonHomestead: taxNon / 12
    };
  };

  const calculateLoanDetails = (loanType) => {
    const sales = getSales();
    const rate = parseFloat(unformatCurrency(interestRate)) / 100;
    let down = getDownPayment(loanType);

    // Enforce minimums
    if (loanType === 'FHA' && down < sales * 0.035) down = sales * 0.035;
    if (loanType === 'Conventional' && down < sales * 0.03) down = sales * 0.03;

    let loan = 0;
    if (loanType === 'Conventional') loan = sales - down;
    else if (loanType === 'FHA') loan = (sales - down) * 1.0175;
    else if (loanType === 'VA First') {
      const base = sales - down;
      const fee = down >= sales * 0.10 ? 0.0125 : down >= sales * 0.05 ? 0.015 : 0.0215;
      loan = base * (1 + fee);
    }

    const monthlyRate = rate / 12;
    const PI = (monthlyRate * loan) / (1 - Math.pow(1 + monthlyRate, -360));
    const HI = 1500 / 12;

    let MI = 0;
    if (loanType === 'Conventional') {
      const pd = down / sales;
      if (pd === 0.03) MI = (loan * 0.004) / 12;
      else if (pd < 0.10) MI = (loan * 0.0035) / 12;
      else if (pd < 0.15) MI = (loan * 0.0025) / 12;
      else if (pd < 0.20) MI = (loan * 0.0015) / 12;
    } else if (loanType === 'FHA') {
      MI = (loan * (down / sales >= 0.05 ? 0.005 : 0.0055)) / 12;
    }

    const { monthlyTaxHomestead, monthlyTaxNonHomestead } = getTaxValues(location, cityLimits, sales);

    const PITI_H = PI + HI + MI + monthlyTaxHomestead;
    const PITI_N = PI + HI + MI + monthlyTaxNonHomestead;

    const daysInMonth = dayjs(closingDate).daysInMonth();
    const closingDay = dayjs(closingDate).date();
    const daysUntilMonthEnd = daysInMonth - closingDay;

    const prepaidInterest = ((loan * rate) / 365) * daysUntilMonthEnd;

    const appraisal = loanType === 'FHA' ? 600 : loanType.includes('VA') ? (location.includes('GA') ? 650 : 600) : 525;
    const OT = location === 'Columbus, GA' ? sales * 0.0022 : location === 'Harris County, GA' ? sales * 0.0024 : sales * 0.0011;
    const LT = location === 'Columbus, GA' ? loan * 0.00352 : location === 'Harris County, GA' ? loan * 0.0036 : loan * 0.00216;
    const MT = ['Columbus, GA', 'Harris County, GA'].includes(location) ? (loan / 100) * 0.3 : (loan / 100) * 0.15;
    let TT = ['Columbus, GA', 'Harris County, GA'].includes(location) ? (sales / 1000) * 1 : (sales - loan) / 1000;
    if (TT < 0) TT = 0;

    const closingItems = [
      { label: 'Underwriting Fee', value: 1320 },
      { label: 'Attorney Fee', value: 1075 },
      { label: 'Title Search Fee', value: 250 },
      { label: 'Recording Fee', value: 70 },
      { label: 'Credit Report Fee', value: 140 },
      { label: 'Appraisal Fee', value: appraisal },
      { label: "Owner's Title Insurance", value: OT },
      { label: "Lender's Title Insurance", value: LT },
      { label: 'Mortgage Tax', value: MT },
      { label: 'Transfer Tax', value: TT }
    ];
    const closingTotal = closingItems.reduce((sum, i) => sum + i.value, 0);

    const preItems = [
      { label: 'Prepaid Interest', value: prepaidInterest },
      { label: 'Insurance (1yr prepaid)', value: 1500 },
      { label: 'Insurance Cushion (3 mo)', value: 1500 / 12 * 3 },
      { label: 'Property Tax Escrow (4 mo)', value: monthlyTaxHomestead * 4 }
    ];
    const preTotal = preItems.reduce((sum, i) => sum + i.value, 0);

    return {
      loanType,
      salesPrice: formatCurrency(sales),
      downPayment: formatCurrency(down),
      loanAmount: formatCurrency(loan),
      principalInterest: formatCurrency(PI),
      homeownersInsurance: formatCurrency(HI),
      mortgageInsurance: formatCurrency(MI),
      monthlyTaxHomestead: formatCurrency(monthlyTaxHomestead),
      monthlyTaxNonHomestead: formatCurrency(monthlyTaxNonHomestead),
      pitiHomestead: formatCurrency(PITI_H),
      pitiNonHomestead: formatCurrency(PITI_N),
      closingCosts: closingItems.map(i => ({ ...i, value: formatCurrency(i.value) })),
      totalClosingCosts: formatCurrency(closingTotal),
      prepaids: preItems.map(i => ({ ...i, value: formatCurrency(i.value) })),
      totalPrepaids: formatCurrency(preTotal),
      finalCashToClose: formatCurrency(down + closingTotal + preTotal)
    };
  };

  const calculateAll = () => {
    const output = loanTypes.map(type => calculateLoanDetails(type));
    setResult(output);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center text-blue-300">Loan Estimate Generator</h1>

        <input value={salesPrice} onChange={(e) => setSalesPrice(e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))} placeholder="Sales Price" className="w-full p-2 bg-gray-800 border border-gray-600 rounded" />
        <input value={interestRate} onChange={(e) => setInterestRate(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Interest Rate" className="w-full p-2 bg-gray-800 border border-gray-600 rounded" />

        <select value={downOption} onChange={(e) => setDownOption(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded">
          <option value="">Select Down Payment</option>
          {[3, 3.5, 5, 10, 15, 20].map(p => (
            <option key={p} value={p}>{p}% – ${((getSales() * p) / 100).toFixed(2)}</option>
          ))}
          <option value="custom">Custom Amount</option>
        </select>
        {downOption === 'custom' && (
          <input value={customDown} onChange={(e) => setCustomDown(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Custom Down Payment" className="w-full p-2 bg-gray-800 border border-gray-600 rounded" />
        )}

        <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded" />

        <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded">
          <option>Columbus, GA</option>
          <option>Lee County, AL</option>
          <option>Russell County, AL</option>
          <option>Harris County, GA</option>
        </select>

        {(location !== 'Columbus, GA' && location !== 'Harris County, GA') && (
          <select value={cityLimits} onChange={(e) => setCityLimits(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded">
            <option>Inside</option>
            <option>Outside</option>
          </select>
        )}

        <div className="flex gap-4">
          <button onClick={calculateAll} className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold">Compare Estimates</button>
          <button onClick={() => window.location.reload()} className="w-full p-2 bg-gray-400 text-black hover:bg-gray-500 rounded font-semibold">Clear</button>
        </div>

        {result && result.map((res, i) => (
          <div key={i} className="bg-gray-800 border border-gray-600 p-4 rounded space-y-4">
            <h2 className="text-xl font-bold text-center text-yellow-400">{res.loanType} Loan</h2>

            <div className="text-sm space-y-1">
              <h3 className="font-bold text-blue-300">Loan Summary</h3>
              <div className="flex justify-between"><span>Sales Price:</span><span>{res.salesPrice}</span></div>
              <div className="flex justify-between"><span>Down Payment:</span><span>{res.downPayment}</span></div>
              <div className="flex justify-between"><span>Loan Amount:</span><span>{res.loanAmount}</span></div>
              <div className="flex justify-between"><span>Principal & Interest:</span><span>{res.principalInterest}</span></div>
              <div className="flex justify-between"><span>Homeowners Insurance:</span><span>{res.homeownersInsurance}</span></div>
              <div className="flex justify-between"><span>Mortgage Insurance:</span><span>{res.mortgageInsurance}</span></div>
              <div className="flex justify-between"><span>Monthly Tax (Homestead):</span><span>{res.monthlyTaxHomestead}</span></div>
              <div className="flex justify-between"><span>Monthly Tax (Non-Homestead):</span><span>{res.monthlyTaxNonHomestead}</span></div>
            </div>

            <div className="text-sm space-y-1">
              <h3 className="font-bold text-green-400">Monthly Payment</h3>
              <div className="flex justify-between"><span>PITI - Homestead:</span><span>{res.pitiHomestead}</span></div>
              <div className="flex justify-between"><span>PITI - Non-Homestead:</span><span>{res.pitiNonHomestead}</span></div>
            </div>

            <div className="text-sm space-y-1">
              <h3 className="font-bold text-blue-300">Closing Costs</h3>
              {res.closingCosts.map((item, idx) => (
                <div key={idx} className="flex justify-between"><span>{item.label}:</span><span>{item.value}</span></div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-600 font-semibold text-yellow-400">
                <span>Total Closing Costs:</span><span>{res.totalClosingCosts}</span>
              </div>
            </div>

            <div className="text-sm space-y-1">
              <h3 className="font-bold text-blue-300">Prepaids & Escrows</h3>
              {res.prepaids.map((item, idx) => (
                <div key={idx} className="flex justify-between"><span>{item.label}:</span><span>{item.value}</span></div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-600 font-semibold text-yellow-400">
                <span>Total Prepaids & Escrows:</span><span>{res.totalPrepaids}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold text-orange-400 border-t border-gray-600 pt-4">
              <span>Final Cash to Close:</span><span>{res.finalCashToClose}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
