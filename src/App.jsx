// App.jsx — Snapshot Pro Full UI Setup (Part 1: Imports, State, Logic)
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
import html2pdf from 'html2pdf.js';

const formatCurrency = (value) =>
  `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const unformatCurrency = (value) => value.replace(/[^0-9.]/g, '');

const renderDownPaymentOptions = (loanType) => {
  if (loanType === 'FHA') return [3.5, 5];
  if (loanType === 'Conventional') return [3, 5, 10, 15, 20];
  if (loanType?.includes('VA')) return [0, 5, 10, 15, 20];
  return [];
};

export default function App() {
  const [salesPrice, setSalesPrice] = useState('');
  const [loanData, setLoanData] = useState({
    1: { loanType: '', interestRate: '', downPayment: '', location: '', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
    2: { loanType: '', interestRate: '', downPayment: '', location: '', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
    3: { loanType: '', interestRate: '', downPayment: '', location: '', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
  });
  const [expandedEstimates, setExpandedEstimates] = useState({});
  const [results, setResults] = useState({});
  const [selectedDownPaymentType, setSelectedDownPaymentType] = useState({});
  const [customDownPayments, setCustomDownPayments] = useState({});

  const handleLoanChange = (id, field, value) => {
    if (field === 'interestRate') {
      const clean = value.replace(/[^0-9.]/g, '');
      setLoanData((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: clean }
      }));
    } else {
      setLoanData((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: value }
      }));
    }
  };

  const toggleHomestead = (id) => {
    setLoanData((prev) => ({
      ...prev,
      [id]: { ...prev[id], homestead: !prev[id].homestead }
    }));
  };

  const toggleCityLimits = (id) => {
    setLoanData((prev) => ({
      ...prev,
      [id]: { ...prev[id], cityLimits: !prev[id].cityLimits }
    }));
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
      if (cityLimits) {
        yearlyTax = (sales * (homestead ? 0.1 : 0.2) * 0.054) + 169;
      } else {
        yearlyTax = (sales * (homestead ? 0.1 : 0.2) * 0.041) + 169;
      }
    } else if (location === 'Russell County, AL') {
      if (cityLimits) {
        yearlyTax = (sales * (homestead ? 0.1 : 0.2) * 0.059) - 74;
      } else {
        yearlyTax = (sales * (homestead ? 0.1 : 0.2) * 0.036) - 74;
      }
    }

    return yearlyTax / 12;
  };

  const calculateEstimates = (id) => {
    const data = loanData[id];
    const sales = parseFloat(unformatCurrency(salesPrice)) || 0;
    const rate = parseFloat(data.interestRate) / 100 || 0;
    const downPercent = parseFloat(data.downPayment) || 0;
    const loanType = data.loanType;

    const downPaymentAmount = (sales * downPercent) / 100;
    const loanBase = sales - downPaymentAmount;
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
    const monthlyTax = calculatePropertyTax(sales, data.location, data.homestead, data.cityLimits);

    let monthlyMI = 0;
    if (loanType === 'Conventional' && downPercent < 20) {
      if (downPercent < 3) monthlyMI = 0;
      else if (downPercent === 3) monthlyMI = loanAmount * 0.004 / 12;
      else if (downPercent > 3 && downPercent < 10) monthlyMI = loanAmount * 0.0035 / 12;
      else if (downPercent >= 10 && downPercent < 15) monthlyMI = loanAmount * 0.0025 / 12;
      else if (downPercent >= 15 && downPercent < 20) monthlyMI = loanAmount * 0.0015 / 12;
    } else if (loanType === 'FHA') {
      monthlyMI = loanAmount * (downPercent >= 5 ? 0.005 : 0.0055) / 12;
    }

    const totalPITI = principalInterest + insuranceMonthly + monthlyTax + monthlyMI;

    // Fixed Fees
    const underwritingFee = 1395;
    const appraisalFee = loanType === 'FHA' ? 600 : loanType?.includes('VA') ? (data.location.includes('GA') ? 650 : 600) : 525;
    const creditReport = 140;

    let attorneyFee = 0;
    if (data.attorney === 'Graham Legal Firm') attorneyFee = 1535;
    else if (data.attorney === 'PSSTF') attorneyFee = 1508;
    else if (data.attorney === 'GSHWM') attorneyFee = 1854;

    const titleSearch = 250;

    let ownerTitle = 0, lenderTitle = 0, mortgageTax = 0, transferTax = 0;

if (data.location.includes('GA')) {
  // Georgia Owner's Title based on down payment %
  if (downPercent <= 5) {
    ownerTitle = sales * 0.00226;
  } else if (downPercent <= 10) {
    ownerTitle = sales * 0.00243;
  } else if (downPercent <= 15) {
    ownerTitle = sales * 0.00259;
  } else {
    ownerTitle = sales * 0.00284;
  }

  lenderTitle = loanAmount * 0.00352;
  mortgageTax = (loanAmount / 100) * 0.3;
  transferTax = sales / 1000;

} else if (data.location.includes('AL')) {
  // Alabama Owner's Title based on down payment %
  if (downPercent <= 5) {
    ownerTitle = sales * 0.00109;
  } else if (downPercent <= 10) {
    ownerTitle = sales * 0.0012;
  } else if (downPercent <= 15) {
    ownerTitle = sales * 0.00129;
  } else {
    ownerTitle = sales * 0.00149;
  }

  lenderTitle = loanAmount * 0.00216;
  mortgageTax = (loanAmount / 100) * 0.15;
  transferTax = Math.max((sales - loanAmount) / 1000, 0);
}

    const daysRemaining = 30 - new Date(data.closingDate).getDate();
    const prepaidInterest = (loanAmount * rate / 365) * daysRemaining;
    const insuranceEscrow = (insuranceAnnual / 12) * 3;
    const taxEscrow = monthlyTax * 3;

    const totalClosingCosts = underwritingFee + appraisalFee + creditReport + attorneyFee + titleSearch + ownerTitle + lenderTitle + mortgageTax + transferTax;
    const totalPrepaids = prepaidInterest + insuranceAnnual + insuranceEscrow + taxEscrow;
    const finalCashToClose = downPaymentAmount + totalClosingCosts + totalPrepaids;

    setResults((prev) => ({
      ...prev,
      [id]: {
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
        // ✅ Show only in Loan Summary — not used in totals
        fundingFee: loanType.includes('VA') ? formatCurrency(loanAmount - loanBase) : '',
        ufmip: loanType === 'FHA' ? formatCurrency(loanAmount - loanBase) : '',
        breakdown: {
          underwritingFee: formatCurrency(underwritingFee),
          appraisalFee: formatCurrency(appraisalFee),
          creditReport: formatCurrency(creditReport),
          attorneyFee: formatCurrency(attorneyFee),
          titleSearch: formatCurrency(titleSearch),
          ownerTitle: formatCurrency(ownerTitle),
          lenderTitle: formatCurrency(lenderTitle),
          mortgageTax: formatCurrency(mortgageTax),
          transferTax: formatCurrency(transferTax),
          prepaidInterest: formatCurrency(prepaidInterest),
          insuranceEscrow: formatCurrency(insuranceEscrow),
          taxEscrow: formatCurrency(taxEscrow),
          insuranceAnnual: formatCurrency(insuranceAnnual),
        },
      },
    }));
  };
  // Reset entire form (all 3 estimates)
  const resetForm = () => {
    setSalesPrice('');
    setLoanData({
      1: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
      2: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
      3: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
    });
    setExpandedEstimates({});
    setResults({});
    setSelectedDownPaymentType({});
    setCustomDownPayments({});
  };

  // Reset an individual estimate card
  const resetSingleCard = (id) => {
    setLoanData((prev) => ({
      ...prev,
      [id]: {
        loanType: '',
        interestRate: '',
        downPayment: '',
        location: 'Columbus, GA',
        closingDate: dayjs().format('YYYY-MM-DD'),
      },
    }));
    setResults((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setSelectedDownPaymentType((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setCustomDownPayments((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };
  const exportToPDF = (id) => {
    const element = document.getElementById(`estimate-card-${id}`);
    const options = {
      margin: 0.1, // Smaller margin
      filename: `Loan_Estimate_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 0.85, // Shrinks everything to fit better
        useCORS: true
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };
    html2pdf().from(element).set(options).save();
  };      
  return (
    <div className="min-h-screen text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
  
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
  
        {/* Sales Price Input */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/20 text-center">
          <label className="block mb-2 text-blue-200 font-semibold text-center">Sales Price</label>
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
            className="mx-auto block w-full max-w-xs px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-center text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
  
        {/* Estimate Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {[1, 2, 3].map((id) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: id * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-md"
            >
              <button
                onClick={() =>
                  setExpandedEstimates((prev) => ({
                    ...prev,
                    [id]: !prev[id],
                  }))
                }
                className="w-full font-semibold text-white text-center text-lg py-2 px-4 bg-blue-600 hover:bg-blue-700 transition rounded-lg shadow"
              >
                {`Estimate ${id}`}
              </button>
  
              <AnimatePresence>
                {expandedEstimates[id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4 space-y-4"
                  >
                    {/* Loan Type */}
                    <div>
                      <label className="text-sm text-blue-200 block mb-1">Loan Type</label>
                      <select
                        value={loanData[id]?.loanType || ''}
                        onChange={(e) => handleLoanChange(id, 'loanType', e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        style={{ backgroundColor: '#1f2937', color: 'white' }}
                      >
                        <option value="">Select</option>
                        <option value="Conventional">Conventional</option>
                        <option value="FHA">FHA</option>
                        <option value="VA First">VA First</option>
                        <option value="VA Second">VA Second</option>
                        <option value="VA Exempt">VA Exempt</option>
                      </select>
                    </div>
  
                    {/* Interest Rate */}
                    <div>
                      <label className="text-sm text-blue-200 block mb-1">Interest Rate</label>
                      <input
                        type="text"
                        value={loanData[id]?.interestRate ? `${loanData[id]?.interestRate}%` : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, '');
                          handleLoanChange(id, 'interestRate', raw);
                        }}
                        placeholder="e.g. 6.75%"
                        className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Down Payment */}
                    <div>
                      <label className="text-sm text-blue-200 block mb-1">Down Payment</label>
                      <select
                        value={selectedDownPaymentType[id] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedDownPaymentType((prev) => ({ ...prev, [id]: value }));
                          if (value !== 'custom') {
                            handleLoanChange(id, 'downPayment', value);
                          }
                        }}
                        className="w-full px-4 py-2 rounded-md border text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: '#1f2937', color: 'white' }}
                      >
                        <option value="">Select Down Payment</option>
                        {renderDownPaymentOptions(loanData[id]?.loanType).map((pct) => (
                          <option key={pct} value={pct}>{pct}%</option>
                        ))}
                        <option value="custom">Custom Amount</option>
                      </select>
  
                      {selectedDownPaymentType[id] === 'custom' && (
  <input
    type="text"
    placeholder="$ Enter amount"
    value={customDownPayments[id] || ''}
    onChange={(e) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      const amount = parseFloat(raw);
      const formatted = raw ? `$${Number(raw).toLocaleString()}` : '';

      const price = parseFloat(unformatCurrency(salesPrice));
      const percent = price ? (amount / price) * 100 : 0;

      let adjusted = percent;
      const type = loanData[id]?.loanType;
      if (type === 'FHA' && percent < 3.5) adjusted = 3.5;
      if (type === 'Conventional' && percent < 3) adjusted = 3;

      setCustomDownPayments((prev) => ({ ...prev, [id]: formatted }));
      handleLoanChange(id, 'downPayment', adjusted.toFixed(2));
    }}
    className="w-full px-4 py-2 mt-2 rounded-md border border-white/20 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    style={{
      backgroundColor: '#1f2937',
      color: 'white',
    }}
  />
)}
                    </div>
  
                    {/* Location */}
                    <div>
                      <label className="text-sm text-blue-200 block mb-1">Property Location</label>
                      <select
                        value={loanData[id]?.location || ''}
                        onChange={(e) => handleLoanChange(id, 'location', e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        style={{ backgroundColor: '#1f2937', color: 'white' }}
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
                        value={loanData[id]?.attorney || ''}
                        onChange={(e) => handleLoanChange(id, 'attorney', e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        style={{ backgroundColor: '#1f2937', color: 'white' }}
                      >
                        <option value="">Closing Attorney</option>
                        <option value="Graham Legal Firm">Graham Legal Firm</option>
                        <option value="PSSTF">PSSTF</option>
                        <option value="GSHWM">GSHWM</option>
                      </select>
                    </div>
  
                    {/* Homestead Toggle */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={loanData[id]?.homestead || false}
                        onChange={(e) => handleLoanChange(id, 'homestead', e.target.checked)}
                        className="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
                      />
                      <label className="text-sm text-blue-200">Apply Homestead Exemption</label>
                    </div>
  
                    {/* City Limits Toggle */}
                    {(loanData[id]?.location === 'Lee County, AL' || loanData[id]?.location === 'Russell County, AL') && (
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={loanData[id]?.inCityLimits || false}
                          onChange={(e) => handleLoanChange(id, 'inCityLimits', e.target.checked)}
                          className="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
                        />
                        <label className="text-sm text-blue-200">Property is Inside City Limits</label>
                      </div>
                    )}
  
                    {/* Closing Date */}
                    <div>
                    <label className="text-sm text-blue-200 block mb-1">Closing Date</label>
                    <input
                      type="date"
                      value={loanData[id]?.closingDate || ''}
                      onChange={(e) => handleLoanChange(id, 'closingDate', e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
                    />
                  </div>

                  {/* Estimate Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => calculateEstimates(id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow transition"
                    >
                      Get Estimate
                    </button>
                    <button
                      onClick={() => resetSingleCard(id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg shadow transition"
                    >
                      Reset Estimate
                    </button>
                  </div>

                  {/* Results Display */}
                  {results[id] && (
  <motion.div
    id={`estimate-card-${id}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white/5 border border-white/20 p-4 rounded-xl text-sm space-y-2 text-white mt-4"
  >
    {/* Loan Summary */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pb-1 mb-2">Loan Summary</h3>
    <div><strong>Loan Type:</strong> {loanData[id]?.loanType}</div>
    <div><strong>Property Location:</strong> {loanData[id]?.location}</div>
    <div><strong>Sales Price:</strong> {salesPrice}</div>

    {/* VA Funding Fee (only for VA loans) */}
    {loanData[id]?.loanType?.includes('VA') && results[id]?.fundingFee && (
      <div><strong>VA Funding Fee:</strong> {results[id].fundingFee}</div>
    )}

    {/* FHA UFMIP (only for FHA) */}
    {loanData[id]?.loanType === 'FHA' && results[id]?.ufmip && (
      <div><strong>UFMIP:</strong> {results[id].ufmip}</div>
    )}

    <div><strong>Loan Amount:</strong> {results[id].loanAmount}</div>

    {/* Only show Down Payment if > $0 */}
    {results[id].downPaymentAmount && parseFloat(results[id].downPaymentAmount.replace(/[^0-9.]/g, '')) > 0 && (
      <div><strong>Down Payment:</strong> {results[id].downPaymentAmount}</div>
    )}

    <div><strong>Interest Rate:</strong> {loanData[id]?.interestRate}%</div>
    <div><strong>Closing Date:</strong> {loanData[id]?.closingDate}</div>

    {/* Monthly Payment Section */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">Monthly Payment</h3>
    <div><strong>Principal & Interest:</strong> {results[id].principalInterest}</div>
    <div><strong>Homeowners Insurance:</strong> {results[id].homeownersInsurance}</div>
    <div><strong>Estimated Property Tax:</strong> {results[id].monthlyTax}</div>
    <div><strong>Monthly MI:</strong> {results[id].monthlyMI}</div>
    <div className="text-green-400 font-bold border-t border-white/10 pt-2">
      Total Monthly Payment: {results[id].totalPayment}
    </div>

    {/* Closing Costs */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">Closing Costs</h3>
    <div><strong>Underwriting Fee:</strong> {results[id].breakdown.underwritingFee}</div>
    <div><strong>Appraisal Fee:</strong> {results[id].breakdown.appraisalFee}</div>
    <div><strong>Credit Report:</strong> {results[id].breakdown.creditReport}</div>
    <div><strong>Attorney Fee:</strong> {results[id].breakdown.attorneyFee}</div>
    <div><strong>Title Search:</strong> {results[id].breakdown.titleSearch}</div>
    <div><strong>Owner’s Title Insurance:</strong> {results[id].breakdown.ownerTitle}</div>
    <div><strong>Lender’s Title Insurance:</strong> {results[id].breakdown.lenderTitle}</div>
    <div><strong>Mortgage Tax:</strong> {results[id].breakdown.mortgageTax}</div>
    <div><strong>Transfer Tax:</strong> {results[id].breakdown.transferTax}</div>
    <div className="text-orange-400 font-bold pt-1">Total Closing Costs: {results[id].totalClosingCosts}</div>

    {/* Prepaids & Escrows */}
    <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">Prepaids & Escrows</h3>
    <div><strong>Prepaid Interest:</strong> {results[id].breakdown.prepaidInterest}</div>
    <div><strong>Homeowners Insurance (1yr):</strong> {results[id].breakdown.insuranceAnnual}</div>
    <div><strong>Insurance Escrow (3 mo):</strong> {results[id].breakdown.insuranceEscrow}</div>
    <div><strong>Tax Escrow (3 mo):</strong> {results[id].breakdown.taxEscrow}</div>
    <div className="text-orange-400 font-bold pt-1">Total Prepaids & Escrows: {results[id].totalPrepaids}</div>

    {/* Final Cash to Close */}
    <div className="flex justify-between text-lg font-bold text-orange-400 border-t border-white/20 pt-4 mt-4">
      <span>Final Cash to Close:</span>
      <span>{results[id].finalCashToClose}</span>
    </div>

    {/* Export Button */}
    <div className="mt-4 text-right">
  <button
    onClick={() => exportToPDF(id)}
    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
  >
    Export as PDF
  </button>
</div>

</motion.div> 
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  ))}
</div>

<div className="mt-10 text-center">
  <button
    onClick={resetForm}
    className="bg-red-700 hover:bg-red-800 text-white font-semibold px-6 py-2 rounded-lg shadow"
  >
    Reset All
  </button>
</div>

</div>
</div>
);
}