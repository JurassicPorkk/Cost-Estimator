import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const formatCurrency = (value) => {
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const unformatCurrency = (value) => value.replace(/[^0-9.]/g, '');

export default function App() {
  // Section 1: State Initialization
  const [salesPrice, setSalesPrice] = useState('');
  const [selectedLoanTypes, setSelectedLoanTypes] = useState([]);
  const [downPayments, setDownPayments] = useState({});
  const [customDowns, setCustomDowns] = useState({});
  const [interestRates, setInterestRates] = useState({});
  const [closingDate, setClosingDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [location, setLocation] = useState('Columbus, GA');
  const [cityLimits, setCityLimits] = useState('Inside');
  const [results, setResults] = useState([]);
  const resultsRef = React.useRef(null);

  // Section 2: Dark Mode and Loan Types
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const loanOptions = ['Conventional', 'FHA', 'VA First', 'VA Second', 'VA Exempt'];

  const toggleLoanType = (type) => {
    setSelectedLoanTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Section 3: Input Handlers
  const handleDownChange = (loanType, value) => {
    setDownPayments({ ...downPayments, [loanType]: value });
  };

  const handleCustomChange = (loanType, value) => {
    setCustomDowns({ ...customDowns, [loanType]: value });
  };

  const getDownPaymentAmount = (loanType) => {
    const sales = parseFloat(unformatCurrency(salesPrice)) || 0;
    const custom = parseFloat(unformatCurrency(customDowns[loanType] || '')) || 0;
    const preset = parseFloat(downPayments[loanType]);

    if (downPayments[loanType] === 'custom' && custom > 0) return custom;
    if (loanType.includes('VA') && !downPayments[loanType]) return 0;

    return sales * (preset / 100);
  };

  // Section 4: Tax Calculation by County
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
const calculateEstimate = () => {
    const sales = parseFloat(unformatCurrency(salesPrice));
    const insurance = 1500;
    const termMonths = 360;
    const resultsArray = [];

    selectedLoanTypes.forEach((loanType) => {
      const downPaymentAmount = getDownPaymentAmount(loanType);
      const loanBase = sales - downPaymentAmount;
      const rate = parseFloat(unformatCurrency(interestRates[loanType])) / 100 || 0;
      let loanAmount = 0;
      let fundingFee = 0;

      const downPaymentPercent = (downPaymentAmount / sales) * 100;

      if (loanType === 'Conventional') {
        loanAmount = loanBase;
      } else if (loanType === 'FHA') {
        loanAmount = loanBase * 1.0175;
      } else if (loanType === 'VA First') {
        if (downPaymentPercent >= 10) fundingFee = 0.0125;
        else if (downPaymentPercent >= 5) fundingFee = 0.015;
        else fundingFee = 0.0215;
        loanAmount = loanBase + (loanBase * fundingFee);
      } else if (loanType === 'VA Second') {
        if (downPaymentPercent >= 10) fundingFee = 0.0125;
        else if (downPaymentPercent >= 5) fundingFee = 0.015;
        else fundingFee = 0.033;
        loanAmount = loanBase + (loanBase * fundingFee);
      } else if (loanType === 'VA Exempt') {
        loanAmount = loanBase;
      }

      const monthlyRate = rate / 12;
      const principalInterest = (monthlyRate * loanAmount) / (1 - Math.pow(1 + monthlyRate, -termMonths));
      const homeownersInsurance = insurance / 12;
      const { monthlyTaxHomestead, monthlyTaxNonHomestead } = getTaxValues(location, cityLimits, sales);

      let monthlyMI = 0;
      if (loanType === 'Conventional') {
        if (downPaymentPercent === 3) monthlyMI = loanAmount * 0.004 / 12;
        else if (downPaymentPercent > 3 && downPaymentPercent < 10) monthlyMI = loanAmount * 0.0035 / 12;
        else if (downPaymentPercent >= 10 && downPaymentPercent < 15) monthlyMI = loanAmount * 0.0025 / 12;
        else if (downPaymentPercent >= 15 && downPaymentPercent < 20) monthlyMI = loanAmount * 0.0015 / 12;
      } else if (loanType === 'FHA') {
        monthlyMI = loanAmount * (downPaymentPercent >= 5 ? 0.005 : 0.0055) / 12;
      }

      const pitiHomestead = principalInterest + homeownersInsurance + monthlyTaxHomestead + monthlyMI;
      const pitiNonHomestead = principalInterest + homeownersInsurance + monthlyTaxNonHomestead + monthlyMI;

      const underwritingFee = 1320;
      const attorneyFee = 1075;
      const titleSearchFee = 250;
      const recordingFee = 70;
      const creditReportFee = 140;
      const appraisalFee = loanType.includes('VA') ? location.includes('GA') ? 650 : 600 : loanType === 'FHA' ? 600 : 525;
      const grmaFee = location === 'Columbus, GA' || location === 'Harris County, GA' ? 10 : 0;

      const ownerTitle = location === 'Columbus, GA' ? sales * 0.0022 : location === 'Harris County, GA' ? sales * 0.0024 : sales * 0.0011;
      const lenderTitle = location === 'Columbus, GA' ? loanAmount * 0.00352 : location === 'Harris County, GA' ? loanAmount * 0.0036 : loanAmount * 0.00216;
      const mortgageTax = location === 'Columbus, GA' || location === 'Harris County, GA' ? (loanAmount / 100) * 0.3 : (loanAmount / 100) * 0.15;
      let transferTax = location === 'Columbus, GA' || location === 'Harris County, GA' ? sales / 1000 : (sales - loanAmount) / 1000;
      if (transferTax < 0) transferTax = 0;

      const closingCosts = underwritingFee + attorneyFee + titleSearchFee + recordingFee + creditReportFee + appraisalFee + ownerTitle + lenderTitle + mortgageTax + transferTax + grmaFee;

      const closing = dayjs(closingDate);
      const daysUntilNextMonth = closing.endOf('month').diff(closing, 'day');
      const prepaidInterest = (loanAmount * rate / 365) * daysUntilNextMonth;
      const insuranceCushion = insurance / 12 * 3;
      const propertyTaxEscrow = monthlyTaxHomestead * 3;
      const prepaids = prepaidInterest + insurance + insuranceCushion + propertyTaxEscrow;

      const totalCashToClose = downPaymentAmount + closingCosts + prepaids;

      resultsArray.push({
        loanType,
        loanAmount: formatCurrency(loanAmount),
        downPaymentAmount: formatCurrency(downPaymentAmount),
        principalInterest: formatCurrency(principalInterest),
        homeownersInsurance: formatCurrency(homeownersInsurance),
        monthlyTaxHomestead: formatCurrency(monthlyTaxHomestead),
        monthlyTaxNonHomestead: formatCurrency(monthlyTaxNonHomestead),
        monthlyMI: formatCurrency(monthlyMI),
        pitiHomestead: formatCurrency(pitiHomestead),
        pitiNonHomestead: formatCurrency(pitiNonHomestead),
        closingCostsBreakdown: [
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
          { label: 'GRMA Fee', value: formatCurrency(grmaFee) }
        ],
        closingCosts: formatCurrency(closingCosts),
        prepaidsBreakdown: [
          { label: `Prepaid Interest (${daysUntilNextMonth} days)`, value: formatCurrency(prepaidInterest) },
          { label: 'Insurance (1yr prepaid)', value: formatCurrency(insurance) },
          { label: 'Insurance Cushion (3 mo)', value: formatCurrency(insuranceCushion) },
          { label: 'Property Tax Escrow (3 mo)', value: formatCurrency(propertyTaxEscrow) }
        ],
        prepaids: formatCurrency(prepaids),
        totalCashToClose: formatCurrency(totalCashToClose)
      });
    });

    setResults(resultsArray);
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
const resetForm = () => {
    setSalesPrice('');
    setSelectedLoanTypes([]);
    setDownPayments({});
    setCustomDowns({});
    setInterestRates({});
    setClosingDate(dayjs().format('YYYY-MM-DD'));
    setLocation('Columbus, GA');
    setCityLimits('Inside');
    setResults([]);
  };
    return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-center text-blue-300">Loan Estimate Generator</h1>
        <p className="text-center text-gray-400 text-sm">Compare multiple loan types side-by-side with detailed itemized estimates</p>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
  <div className="grid gap-4 sm:grid-cols-2">
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
              minimumFractionDigits: 0
            })
          : '';
        setSalesPrice(formatted);
      }}
      className="w-full px-4 py-2 border border-gray-600 bg-white/10 text-white rounded backdrop-blur-md placeholder-white/60"
    />

    <select
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      className="w-full px-4 py-2 border border-gray-600 bg-white/10 text-white rounded backdrop-blur-md"
    >
      <option>Columbus, GA</option>
      <option>Harris County, GA</option>
      <option>Lee County, AL</option>
      <option>Russell County, AL</option>
    </select>

    {(location === 'Lee County, AL' || location === 'Russell County, AL') && (
      <select
        value={cityLimits}
        onChange={(e) => setCityLimits(e.target.value)}
        className="w-full px-4 py-2 border border-gray-600 bg-white/10 text-white rounded backdrop-blur-md"
      >
        <option>Inside</option>
        <option>Outside</option>
      </select>
    )}
  </div>

  <div className="mt-6">
    <p className="text-blue-200 font-semibold mb-2">Select Loan Types to Compare:</p>
    <div className="flex flex-wrap gap-2">
      {loanOptions.map((type) => (
        <button
          key={type}
          className={`px-3 py-1 rounded border transition ${
            selectedLoanTypes.includes(type)
              ? 'bg-blue-600 border-blue-400'
              : 'bg-white/10 border-gray-500 text-white'
          }`}
          onClick={() => toggleLoanType(type)}
        >
          {type}
        </button>
      ))}
    </div>
  </div>
</div>

{selectedLoanTypes.map((type) => {
  const sales = parseFloat(unformatCurrency(salesPrice)) || 0;
  const presetOptions =
    type === 'FHA' ? [3.5, 5] :
    type === 'Conventional' ? [3, 5, 10, 15, 20] :
    [5, 10, 15, 20];

  return (
    <div key={type} className="bg-white/10 backdrop-blur-lg p-6 mt-6 rounded-xl shadow-lg border border-white/20 space-y-4">
      <h2 className="text-xl font-semibold text-blue-300">{type} Options</h2>

      <select
        value={downPayments[type] || ''}
        onChange={(e) => handleDownChange(type, e.target.value)}
        className="w-full px-4 py-2 border border-gray-400 bg-white/10 text-white rounded"
      >
        <option value="">Select Down Payment</option>
        {presetOptions.map((percent) => (
          <option key={percent} value={percent}>
            {`${percent}% – ${formatCurrency(sales * (percent / 100))}`}
          </option>
        ))}
        <option value="custom">Custom Amount</option>
      </select>

      {downPayments[type] === 'custom' && (
        <input
          type="text"
          placeholder="Custom Down Payment"
          value={customDowns[type] || ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            const formatted = raw ? Number(raw).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }) : '';
            handleCustomChange(type, formatted);
          }}
          className="w-full px-4 py-2 border border-gray-400 bg-white/10 text-white rounded"
        />
      )}

      <input
        type="text"
        placeholder={`${type} Interest Rate`}
        value={interestRates[type] || ''}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, '');
          const formatted = raw ? `${raw}%` : '';
          setInterestRates((prev) => ({ ...prev, [type]: formatted }));
        }}
        className="w-full px-4 py-2 border border-gray-400 bg-white/10 text-white rounded"
      />
    </div>
  );
})}

<div className="grid gap-4 sm:grid-cols-2 mt-6">
  <input
    type="date"
    value={closingDate}
    onChange={(e) => setClosingDate(e.target.value)}
    className="w-full px-4 py-2 border border-gray-600 bg-gray-800 rounded"
  />
  <div className="flex gap-2">
    <button
      onClick={calculateEstimate}
      className="bg-green-600 hover:bg-green-700 transition text-white font-bold px-4 py-2 rounded w-full"
    >
      Get Estimate
    </button>
    <button
      onClick={resetForm}
      className="bg-red-600 hover:bg-red-700 transition text-white font-bold px-4 py-2 rounded w-full"
    >
      Clear
    </button>
  </div>
</div>

{results.length > 0 && (
          <div className="space-y-10 mt-10" ref={resultsRef}>
            <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Estimate Results</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {results.map((res, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 text-white space-y-4"
                >
                  <h2 className="text-xl font-bold text-blue-300 text-center">{res.loanType} Loan</h2>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold text-blue-200">Loan Summary</div>
                    <div>Loan Amount: {res.loanAmount}</div>
                    <div>Down Payment: {res.downPaymentAmount}</div>
                    <div>Principal & Interest: {res.principalInterest}</div>
                    <div>Insurance: {res.homeownersInsurance}</div>
                    <div>Tax (Homestead): {res.monthlyTaxHomestead}</div>
                    <div>Tax (Non-Homestead): {res.monthlyTaxNonHomestead}</div>
                    <div>Monthly MI: {res.monthlyMI}</div>
                  </div>
                  <div className="mt-2 font-semibold text-green-400 text-sm">
                    <div>PITI (Homestead): {res.pitiHomestead}</div>
                    <div>PITI (Non-Homestead): {res.pitiNonHomestead}</div>
                  </div>
                  <div>
                    <div className="text-blue-200 font-semibold mb-1">Closing Costs</div>
                    <div className="space-y-1 text-sm">
                      {res.closingCostsBreakdown.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                      <div className="font-bold text-yellow-400 border-t border-gray-600 pt-2 mt-2">
                        Total Closing Costs: {res.closingCosts}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-200 font-semibold mb-1">Prepaids & Escrows</div>
                    <div className="space-y-1 text-sm">
                      {res.prepaidsBreakdown.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                      <div className="font-bold text-yellow-400 border-t border-gray-600 pt-2 mt-2">
                        Total Prepaids: {res.prepaids}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-orange-400 border-t border-gray-600 pt-4 mt-4">
                    <span>Final Cash to Close:</span>
                    <span>{res.totalCashToClose}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
