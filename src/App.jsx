import React, { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import './index.css';
import { Analytics } from '@vercel/analytics/react';
import { getOwnerTitleRate } from './utils/titleUtils';
import { getLenderTitleRate } from './utils/lenderTitleUtils';

export default function App() {
  const [salesPrice, setSalesPrice] = useState('');
  const [loanData, setLoanData] = useState({
    loanType: '',
    interestRate: '',
    downPayment: '',
    downPaymentAmount: '',
    location: '',
    closingDate: dayjs().format('YYYY-MM-DD'),
    homestead: true,
    cityLimits: true,
    attorney: '',
  });
  const [selectedDownPaymentType, setSelectedDownPaymentType] = useState('');
  const [customDownPayment, setCustomDownPayment] = useState('');
  const [results, setResults] = useState(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const formatCurrency = (value) =>
    `$${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const unformatCurrency = (value) => value.replace(/[^0-9.]/g, '');

  const renderDownPaymentOptions = (loanType) => {
    if (loanType === 'FHA') return [3.5, 5];
    if (loanType === 'Conventional') return [5, 10, 15, 20];
    if (loanType?.includes('VA')) return [0, 5, 10, 15, 20];
    return [];
  };

  const handleLoanChange = (field, value) => {
    setLoanData((prev) => ({
      ...prev,
      [field]: field === 'interestRate' ? value.replace(/[^0-9.]/g, '') : value,
    }));
  };

  const toggleHomestead = () =>
    setLoanData((prev) => ({ ...prev, homestead: !prev.homestead }));

  const toggleCityLimits = () =>
    setLoanData((prev) => ({ ...prev, cityLimits: !prev.cityLimits }));

  const isValidForm = () => {
    return (
      salesPrice &&
      loanData.loanType &&
      loanData.interestRate &&
      loanData.downPayment &&
      loanData.location &&
      loanData.closingDate &&
      loanData.attorney
    );
  };

  const calculatePropertyTax = (sales, location, homestead, cityLimits) => {
    let yearlyTax = 0;
    if (location === 'Columbus, GA') {
      yearlyTax = sales * 0.4 * 0.04153;
      if (homestead) yearlyTax -= 543;
    } else if (location === 'Harris County, GA') {
      yearlyTax = sales * 0.4 * 0.02764;
      if (homestead) yearlyTax -= 50;
    } else if (location === 'Lee County, AL') {
      yearlyTax = (sales * (homestead ? 0.1 : 0.2) * (cityLimits ? 0.054 : 0.041)) + 169;
    } else if (location === 'Russell County, AL') {
      yearlyTax = (sales * (homestead ? 0.1 : 0.2) * (cityLimits ? 0.059 : 0.036)) - 74;
    }
    return yearlyTax / 12;
  };

  const calculateEstimates = () => {
  const sales = parseFloat(unformatCurrency(salesPrice)) || 0;

  // ✅ Sales Price Cap Check
  if (sales > 1000000) {
    alert("This app only supports sales prices up to $1,000,000.");
    return;
  }

  const rate = parseFloat(loanData.interestRate) / 100 || 0;
  const downPercent = parseFloat(loanData.downPayment) || 0;
  const loanType = loanData.loanType;

  let downPaymentAmount = (sales * downPercent) / 100;
  if (customDownPayment) {
    const custom = parseFloat(unformatCurrency(customDownPayment)) || 0;
    downPaymentAmount = custom;
  }

  const loanBase = sales - downPaymentAmount;

  // ✅ Base Loan Amount Caps by Loan Type
  if (loanType === 'Conventional' && loanBase > 806500) {
    alert("Conventional loans are limited to a base loan amount of $806,500. Please increase your down payment or lower the sales price.");
    return;
  }
  if (loanType === 'FHA' && loanBase > 524225) {
    alert("FHA loans are limited to a base loan amount of $524,225. Please increase your down payment or lower the sales price.");
    return;
  }
  if (loanType?.includes('VA') && loanBase > 1000000) {
    alert("VA loans are limited to a base loan amount of $1,000,000. Please increase your down payment or lower the sales price.");
    return;
  }

  const termMonths = 360;
  const monthlyRate = rate / 12;
  const insuranceAnnual = 1500;
  const insuranceMonthly = insuranceAnnual / 12;

  let loanAmount = 0;
  let fundingFee = 0;
  if (loanType === 'Conventional') loanAmount = loanBase;
  else if (loanType === 'FHA') loanAmount = loanBase * 1.0175;
  else if (loanType === 'VA First') {
    fundingFee = downPercent >= 10 ? 0.0125 : downPercent >= 5 ? 0.015 : 0.0215;
    loanAmount = loanBase + loanBase * fundingFee;
  } else if (loanType === 'VA Second') {
    fundingFee = downPercent >= 10 ? 0.0125 : downPercent >= 5 ? 0.015 : 0.033;
    loanAmount = loanBase + loanBase * fundingFee;
  } else if (loanType === 'VA Exempt') loanAmount = loanBase;

  const principalInterest = (monthlyRate * loanAmount) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  const monthlyTax = calculatePropertyTax(sales, loanData.location, loanData.homestead, loanData.cityLimits);

  let monthlyMI = 0;
  if (loanType === 'Conventional' && downPercent < 20) {
    if (downPercent === 3) monthlyMI = loanAmount * 0.004 / 12;
    else if (downPercent > 3 && downPercent < 10) monthlyMI = loanAmount * 0.0035 / 12;
    else if (downPercent >= 10 && downPercent < 15) monthlyMI = loanAmount * 0.0025 / 12;
    else if (downPercent >= 15 && downPercent < 20) monthlyMI = loanAmount * 0.0015 / 12;
  } else if (loanType === 'FHA') {
    monthlyMI = loanAmount * (downPercent >= 5 ? 0.005 : 0.0055) / 12;
  }

  const totalPITI = principalInterest + insuranceMonthly + monthlyTax + monthlyMI;
  const underwritingFee = 1395;
  const appraisalFee = loanType === 'FHA' ? 600 : loanType.includes('VA') ? (loanData.location.includes('GA') ? 650 : 600) : 525;
  const creditReport = 140;
  const titleSearch = 250;

  let attorneyFees = {};
  if (loanData.attorney === 'Graham Legal Firm') {
    attorneyFees = { cpl: 25, courier: 100, endorsements: 125, expressPayoff: 35, processing: 50, settlement: 1075, wire: 25, recording: 100 };
  } else if (loanData.attorney === 'GSHWM') {
    attorneyFees = { cpl: 55, courier: 375, docPrep: 110, eRecording: 14, expressPayoff: 115, titleExam: 240, settlement: 830, titleCommitment: 80, recording: 100, wire: 35 };
  } else if (loanData.attorney === 'PSSTF') {
    attorneyFees = { cpl: 25, docPrep: 99, eRecording: 10, endorsements: 125, postClosing: 99, titleExam: 250, settlement: 675, titleBinder: 125, recording: 100 };
  }

  const totalAttorneyFee = Object.values(attorneyFees).reduce((sum, v) => sum + v, 0);

  let ownerTitle = 0, lenderTitle = 0, mortgageTax = 0, transferTax = 0;
  const state = loanData.location.includes('GA') ? 'georgia' : loanData.location.includes('AL') ? 'alabama' : '';
  const titleRate = getOwnerTitleRate(state, sales, loanAmount);
  ownerTitle = sales * titleRate;
  const lenderRate = getLenderTitleRate(state, sales, loanAmount);
  lenderTitle = loanAmount * lenderRate;

  if (state === 'georgia') {
    mortgageTax = (loanAmount / 100) * 0.3;
    transferTax = sales / 1000;
  } else if (state === 'alabama') {
    mortgageTax = (loanAmount / 100) * 0.15;
    transferTax = Math.max((sales - loanAmount) / 1000, 0);
  }

  const daysRemaining = 30 - new Date(loanData.closingDate).getDate();
  const prepaidInterest = (loanAmount * rate / 365) * daysRemaining;
  const insuranceEscrow = (insuranceAnnual / 12) * 3;
  const taxEscrow = monthlyTax * 3;

  const totalClosingCosts = underwritingFee + appraisalFee + creditReport + totalAttorneyFee + titleSearch + ownerTitle + lenderTitle + mortgageTax + transferTax;
  const totalPrepaids = prepaidInterest + insuranceAnnual + insuranceEscrow + taxEscrow;
  const finalCashToClose = downPaymentAmount + totalClosingCosts + totalPrepaids;

  setResults({
    loanAmount: formatCurrency(loanAmount),
    principalInterest: formatCurrency(principalInterest),
    homeownersInsurance: formatCurrency(insuranceMonthly),
    monthlyTax: formatCurrency(monthlyTax),
    monthlyMI: formatCurrency(monthlyMI),
    totalPayment: formatCurrency(totalPITI),
    downPaymentAmount: downPaymentAmount === 0 ? null : formatCurrency(downPaymentAmount),
    totalClosingCosts: formatCurrency(totalClosingCosts),
    totalPrepaids: formatCurrency(totalPrepaids),
    finalCashToClose: formatCurrency(finalCashToClose),
    fundingFee: loanType.includes('VA') ? formatCurrency(loanAmount - loanBase) : '',
    ufmip: loanType === 'FHA' ? formatCurrency(loanAmount - loanBase) : '',
    breakdown: {
      underwritingFee: formatCurrency(underwritingFee),
      appraisalFee: formatCurrency(appraisalFee),
      creditReport: formatCurrency(creditReport),
      titleSearch: formatCurrency(titleSearch),
      ownerTitle: formatCurrency(ownerTitle),
      lenderTitle: formatCurrency(lenderTitle),
      mortgageTax: formatCurrency(mortgageTax),
      transferTax: formatCurrency(transferTax),
      prepaidInterest: formatCurrency(prepaidInterest),
      insuranceEscrow: formatCurrency(insuranceEscrow),
      taxEscrow: formatCurrency(taxEscrow),
      insuranceAnnual: formatCurrency(insuranceAnnual),
      ...Object.fromEntries(Object.entries(attorneyFees).map(([k, v]) => [k, formatCurrency(v)])),
    },
  });
};
  
  const resetForm = () => {
    setSalesPrice('');
    setLoanData({
      loanType: '',
      interestRate: '',
      downPayment: '',
      downPaymentAmount: '',
      location: '',
      closingDate: dayjs().format('YYYY-MM-DD'),
      homestead: true,
      cityLimits: true,
      attorney: ''
    });
    setSelectedDownPaymentType('');
    setCustomDownPayment('');
    setResults(null);
  
    // ✅ Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
  <div className="min-h-screen text-white p-6 font-sans">
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center -mt-6 -mb-6"
      >
        <img
          src="/cash-to-close-logo.png"
          alt="Cash To Close Logo"
          className="w-72 md:w-80 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
        />
      </motion.div>

      {/* Estimate Input Card */}
<div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/20 space-y-4 text-white">

{/* Sales Price Input */}
<div>
        <label className="text-sm text-blue-200 block mb-1 text-centered">Sales Price</label>
        <input
          type="text"
          placeholder="Enter"
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
          className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white text-centered focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

  {/* Loan Type */}
  <div>
    <label className="text-sm text-blue-200 block mb-1">Loan Type</label>
    <select
      value={loanData.loanType}
      onChange={(e) => handleLoanChange('loanType', e.target.value)}
      className="w-full px-4 py-2 rounded-md border border-white/20 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select</option>
      <option value="Conventional">Conventional</option>
      <option value="FHA">FHA</option>
      <option value="VA First">VA – First-Time Use</option>
      <option value="VA Second">VA – Subsequent Use</option>
      <option value="VA Exempt">VA – Exempt (Disability)</option>
    </select>
  </div>

  {/* Interest Rate */}
  <div>
    <label className="text-sm text-blue-200 block mb-1">Interest Rate</label>
    <input
      type="text"
      placeholder="e.g. 6.75%"
      value={loanData.interestRate ? `${loanData.interestRate}%` : ''}
      onChange={(e) => handleLoanChange('interestRate', e.target.value)}
      className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white text-centered focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* Down Payment */}
  <div>
    <label className="text-sm text-blue-200 block mb-1">Down Payment</label>
    <select
      value={selectedDownPaymentType}
      onChange={(e) => {
        const val = e.target.value;
        setSelectedDownPaymentType(val);
        if (val !== "custom") {
          handleLoanChange("downPayment", val);
        }
      }}
      className="w-full px-4 py-2 rounded-md border border-white/20 bg-gray-800 text-white"
    >
      <option value="">Select Down Payment</option>
      {renderDownPaymentOptions(loanData.loanType).map((pct) => (
        <option key={pct} value={pct}>{pct}%</option>
      ))}
      <option value="custom">Custom Amount</option>
    </select>

    {selectedDownPaymentType === "custom" && (
  <input
    type="text"
    placeholder="$ Enter amount"
    inputMode="decimal"
    value={customDownPayment}
    onChange={(e) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      const numeric = parseFloat(raw) || 0;
      const price = parseFloat(unformatCurrency(salesPrice)) || 0;
      const pct = price ? (numeric / price) * 100 : 0;
      let adjusted = pct;

      if (loanData.loanType === "FHA" && pct < 3.5) adjusted = 3.5;
      if (loanData.loanType === "Conventional" && pct < 5) adjusted = 5;

      setCustomDownPayment(raw); // store raw number during typing
      handleLoanChange("downPayment", adjusted.toFixed(2));
    }}
    onBlur={(e) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      const numeric = parseFloat(raw) || 0;
      setCustomDownPayment(
        numeric.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        })
      );
    }}
    onFocus={(e) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      setCustomDownPayment(raw);
    }}
    className="w-full px-4 py-2 mt-2 rounded-md border border-white/20 bg-gray-800 text-white"
  />
)}
  </div>

  {/* Property Location */}
  <div>
    <label className="text-sm text-blue-200 block mb-1">Property Location</label>
    <select
      value={loanData.location}
      onChange={(e) => handleLoanChange('location', e.target.value)}
      className="w-full px-4 py-2 rounded-md border border-white/20 bg-gray-800 text-white"
    >
      <option value="">Select Location</option>
      <option value="Columbus, GA">Columbus, GA</option>
      <option value="Harris County, GA">Harris County, GA</option>
      <option value="Lee County, AL">Lee County, AL</option>
      <option value="Russell County, AL">Russell County, AL</option>
    </select>
  </div>

  {/* Closing Attorney */}
  <div>
    <label className="text-sm text-blue-200 block mb-1">Closing Attorney</label>
    <select
      value={loanData.attorney}
      onChange={(e) => handleLoanChange('attorney', e.target.value)}
      className="w-full px-4 py-2 rounded-md border border-white/20 bg-gray-800 text-white"
    >
      <option value="">Select Attorney</option>
      <option value="Graham Legal Firm">Graham Legal Firm</option>
      <option value="PSSTF">PSSTF</option>
      <option value="GSHWM">GSHWM</option>
    </select>
  </div>

  {/* Homestead Toggle */}
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={loanData.homestead}
      onChange={toggleHomestead}
      className="form-checkbox h-5 w-5 text-blue-500 rounded"
    />
    <label className="text-sm text-blue-200">Apply Homestead Exemption</label>
  </div>

  {/* Inside City Limits Toggle */}
  {(loanData.location === "Lee County, AL" || loanData.location === "Russell County, AL") && (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={loanData.cityLimits}
        onChange={toggleCityLimits}
        className="form-checkbox h-5 w-5 text-blue-500 rounded"
      />
      <label className="text-sm text-blue-200">Inside City Limits</label>
    </div>
  )}

  {/* Closing Date */}
  <div>
    <label className="text-sm text-blue-200 block mb-1">Closing Date</label>
    <input
      type="date"
      value={loanData.closingDate}
      onChange={(e) => handleLoanChange('closingDate', e.target.value)}
      className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
    />
  </div>

  {/* Action Buttons */}
  <div className="flex flex-col gap-3 pt-4">
    <button
      onClick={calculateEstimates}
      disabled={!isValidForm()}
      className={`w-full text-white font-semibold py-2 rounded-lg shadow transition ${
        isValidForm() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
      }`}
    >
      Get Estimate
    </button>
    <button
      onClick={resetForm}
      className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2 rounded-lg shadow"
    >
      Reset
    </button>
  </div>
</div>
{/* Estimate Results Display */}
{results && (
  <motion.div
    ref={resultsRef}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white/5 border border-white/20 p-4 rounded-xl text-sm space-y-2 text-white mt-8"
  >
    {/* Loan Summary */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pb-1 mb-2">Loan Summary</h3>
    <div><strong>Loan Type:</strong> {loanData.loanType}</div>
    <div><strong>Property Location:</strong> {loanData.location}</div>
    <div><strong>Sales Price:</strong> {salesPrice}</div>
    {loanData.loanType?.includes("VA") && results.fundingFee && (
      <div><strong>VA Funding Fee:</strong> {results.fundingFee}</div>
    )}
    {loanData.loanType === "FHA" && results.ufmip && (
      <div><strong>UFMIP:</strong> {results.ufmip}</div>
    )}
    <div><strong>Loan Amount:</strong> {results.loanAmount}</div>
    {results.downPaymentAmount && (
      <div><strong>Down Payment:</strong> {results.downPaymentAmount}</div>
    )}
    <div><strong>Interest Rate:</strong> {loanData.interestRate}%</div>
    <div><strong>Closing Date:</strong> {loanData.closingDate}</div>

    {/* Monthly Payment */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">Monthly Payment</h3>
    <div><strong>Principal & Interest:</strong> {results.principalInterest}</div>
    <div><strong>Homeowners Insurance:</strong> {results.homeownersInsurance}</div>
    <div><strong>Estimated Property Tax:</strong> {results.monthlyTax}</div>
    <div><strong>Monthly MI:</strong> {results.monthlyMI}</div>
    <div className="text-green-400 font-bold border-t border-white/10 pt-2">
      Total Monthly Payment: {results.totalPayment}
    </div>

    {/* Closing Costs */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">Closing Costs</h3>
    <div><strong>Underwriting Fee:</strong> {results.breakdown.underwritingFee}</div>
    <div><strong>Appraisal Fee:</strong> {results.breakdown.appraisalFee}</div>
    <div><strong>Credit Report:</strong> {results.breakdown.creditReport}</div>
    <div><strong>Title Search:</strong> {results.breakdown.titleSearch}</div>
    <div><strong>Owner’s Title Insurance:</strong> {results.breakdown.ownerTitle}</div>
    <div><strong>Lender’s Title Insurance:</strong> {results.breakdown.lenderTitle}</div>
    <div><strong>Mortgage Tax:</strong> {results.breakdown.mortgageTax}</div>
    <div><strong>Transfer Tax:</strong> {results.breakdown.transferTax}</div>
    {Object.entries(results.breakdown).map(([label, value]) => (
      label !== "ownerTitle" &&
      label !== "lenderTitle" &&
      label !== "mortgageTax" &&
      label !== "transferTax" &&
      label !== "underwritingFee" &&
      label !== "appraisalFee" &&
      label !== "creditReport" &&
      label !== "titleSearch" &&
      label !== "prepaidInterest" &&
      label !== "insuranceEscrow" &&
      label !== "taxEscrow" &&
      label !== "insuranceAnnual" &&
      !["principalInterest", "monthlyTax", "monthlyMI"].includes(label) &&
      <div key={label}><strong>{label.replace(/([A-Z])/g, ' $1')}:</strong> {value}</div>
    ))}
    <div className="text-orange-400 font-bold pt-1">Total Closing Costs: {results.totalClosingCosts}</div>

    {/* Prepaids & Escrows */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">Prepaids & Escrows</h3>
    <div><strong>Prepaid Interest:</strong> {results.breakdown.prepaidInterest}</div>
    <div><strong>Homeowners Insurance (1yr):</strong> {results.breakdown.insuranceAnnual}</div>
    <div><strong>Insurance Escrow (3 mo):</strong> {results.breakdown.insuranceEscrow}</div>
    <div><strong>Tax Escrow (3 mo):</strong> {results.breakdown.taxEscrow}</div>
    <div className="text-orange-400 font-bold pt-1">Total Prepaids & Escrows: {results.totalPrepaids}</div>

    {/* Final Cash to Close */}
    <div className="flex justify-between text-lg font-bold text-orange-400 border-t border-white/20 pt-4 mt-4">
  <span>Final Cash to Close:</span>
  <span>{results.finalCashToClose}</span>
</div>

{/* Estimate Disclaimer */}
<p className="text-xs text-gray-400 mt-6 italic">
  This estimate is for informational purposes only and does not represent a loan approval or final cost breakdown. Actual figures may vary. Always consult with your loan officer before making any financial decisions.
</p>
</motion.div>
)}
</div>
<Analytics />
</div>)}