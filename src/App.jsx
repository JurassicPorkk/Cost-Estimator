// App.jsx — Snapshot Pro Full UI Setup (Part 1: Imports, State, Logic)
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

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
    1: { loanType: '', interestRate: '', downPayment: '', downPaymentAmount: '', location: '', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
    2: { loanType: '', interestRate: '', downPayment: '', downPaymentAmount: '', location: '', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
    3: { loanType: '', interestRate: '', downPayment: '', downPaymentAmount: '', location: '', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
  });
  const [expandedEstimates, setExpandedEstimates] = useState({});
  const [results, setResults] = useState({});
  const [selectedDownPaymentType, setSelectedDownPaymentType] = useState({});
  const [customDownPayments, setCustomDownPayments] = useState({});
  const [attorneyFees, setAttorneyFees] = useState({});

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
  
    let downPaymentAmount = (sales * downPercent) / 100;
  
    // ✅ Override with custom dollar amount if set
    if (customDownPayments[id]) {
      const amount = parseFloat(unformatCurrency(customDownPayments[id])) || 0;
      downPaymentAmount = amount;
    }
  
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
    const monthlyTax = calculatePropertyTax(sales, data.location, data.homestead, data.inCityLimits);
  
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
  
    const underwritingFee = 1395;
    const appraisalFee = loanType === 'FHA' ? 600 : loanType?.includes('VA') ? (data.location.includes('GA') ? 650 : 600) : 525;
    const creditReport = 140;
    const titleSearch = 250;
  
    // ✅ Attorney Fee Itemization
    let attorneyFees = {};

if (data.attorney === 'Graham Legal Firm') {
  attorneyFees = {
    cpl: 25,
    courier: 100,
    endorsements: 125,
    expressPayoff: 35,
    processing: 50,
    settlement: 1075,
    wire: 25,
    recording: 100,
  };
} else if (data.attorney === 'GSHWM') {
  attorneyFees = {
    cpl: 55,
    courier: 375,
    docPrep: 110,
    eRecording: 14,
    expressPayoff: 115,
    titleExam: 240,
    settlement: 830,
    titleCommitment: 80,
    recording: 100,
    wire: 35,
  };
} else if (data.attorney === 'PSSTF') {
  attorneyFees = {
    cpl: 25,
    docPrep: 99,
    eRecording: 10,
    endorsements: 125,
    postClosing: 99,
    titleExam: 250,
    settlement: 675,
    titleBinder: 125,
    recording: 100,
  };
}

// ⬇️ This is required for all calculations using attorney fees:
const totalAttorneyFee = Object.values(attorneyFees).reduce((sum, fee) => sum + fee, 0);
  
    let ownerTitle = 0, lenderTitle = 0, mortgageTax = 0, transferTax = 0;
  
    if (data.location.includes('GA')) {
      if (downPercent <= 5) ownerTitle = sales * 0.00226;
      else if (downPercent <= 10) ownerTitle = sales * 0.00243;
      else if (downPercent <= 15) ownerTitle = sales * 0.00259;
      else ownerTitle = sales * 0.00284;
  
      lenderTitle = loanAmount * 0.00352;
      mortgageTax = (loanAmount / 100) * 0.3;
      transferTax = sales / 1000;
    } else if (data.location.includes('AL')) {
      if (downPercent <= 5) ownerTitle = sales * 0.00109;
      else if (downPercent <= 10) ownerTitle = sales * 0.0012;
      else if (downPercent <= 15) ownerTitle = sales * 0.00129;
      else ownerTitle = sales * 0.00149;
  
      lenderTitle = loanAmount * 0.00216;
      mortgageTax = (loanAmount / 100) * 0.15;
      transferTax = Math.max((sales - loanAmount) / 1000, 0);
    }
  
    const daysRemaining = 30 - new Date(data.closingDate).getDate();
    const prepaidInterest = (loanAmount * rate / 365) * daysRemaining;
    const insuranceEscrow = (insuranceAnnual / 12) * 3;
    const taxEscrow = monthlyTax * 3;
  
    const attorneyTotal = Object.values(attorneyFees).reduce((sum, val) => sum + val, 0);
    const totalClosingCosts = underwritingFee + appraisalFee + creditReport + totalAttorneyFee + titleSearch + ownerTitle + lenderTitle + mortgageTax + transferTax;
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
          ...Object.fromEntries(Object.entries(attorneyFees).map(([key, val]) => [key, formatCurrency(val)])),
        }
      }
    }));
  };  
  // Reset entire form (all 3 estimates)
  const resetForm = () => {
    setSalesPrice('');
    setLoanData({
      1: { loanType: '', interestRate: '', downPayment: '', downPaymentAmount: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
      2: { loanType: '', interestRate: '', downPayment: '', downPaymentAmount: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
      3: { loanType: '', interestRate: '', downPayment: '', downPaymentAmount: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD'), homestead: true, cityLimits: true, attorney: '' },
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
        downPaymentAmount: '',
        location: 'Columbus, GA',
        closingDate: dayjs().format('YYYY-MM-DD'),
        homestead: true,
        cityLimits: true,
        attorney: ''
      }
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
        {/* Single Estimate Card */}
<div className="grid grid-cols-1 gap-6 mt-10">
  <motion.div
    key={1}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-md"
  >
    {/* Toggle form open/closed */}
    <button
      onClick={() =>
        setExpandedEstimates((prev) => ({ ...prev, [1]: !prev[1] }))
      }
      className="w-full font-semibold text-white text-lg py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
    >
      Estimate
    </button>

    <AnimatePresence>
      {expandedEstimates[1] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden mt-4 space-y-4"
        >
          {/* Loan Type */}
          <div>
            <label className="text-sm text-blue-200 block mb-1">
              Loan Type
            </label>
            <select
              value={loanData[1]?.loanType || ""}
              onChange={(e) =>
                handleLoanChange(1, "loanType", e.target.value)
              }
              className="w-full px-4 py-2 rounded-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              style={{ backgroundColor: "#1f2937", color: "white" }}
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
            <label className="text-sm text-blue-200 block mb-1">
              Interest Rate
            </label>
            <input
              type="text"
              value={
                loanData[1]?.interestRate
                  ? `${loanData[1].interestRate}%`
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, "");
                handleLoanChange(1, "interestRate", raw);
              }}
              placeholder="e.g. 6.75%"
              className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Down Payment */}
          <div>
            <label className="text-sm text-blue-200 block mb-1">
              Down Payment
            </label>
            <select
              value={selectedDownPaymentType[1] || ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDownPaymentType((p) => ({ ...p, [1]: val }));
                if (val !== "custom") {
                  handleLoanChange(1, "downPayment", val);
                }
              }}
              className="w-full px-4 py-2 rounded-md border text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: "#1f2937", color: "white" }}
            >
              <option value="">Select Down Payment</option>
              {renderDownPaymentOptions(loanData[1]?.loanType).map((pct) => (
                <option key={pct} value={pct}>
                  {pct}%
                </option>
              ))}
              <option value="custom">Custom Amount</option>
            </select>

            {selectedDownPaymentType[1] === "custom" && (
              <input
                type="text"
                placeholder="$ Enter amount"
                value={customDownPayments[1] || ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  const amount = parseFloat(raw);
                  const price = parseFloat(unformatCurrency(salesPrice)) || 0;
                  const pct = price ? (amount / price) * 100 : 0;
                  let adjusted = pct;
                  if (loanData[1]?.loanType === "FHA" && pct < 3.5)
                    adjusted = 3.5;
                  if (loanData[1]?.loanType === "Conventional" && pct < 3)
                    adjusted = 3;
                  setCustomDownPayments((p) => ({ ...p, [1]: raw }));
                  handleLoanChange(1, "downPayment", adjusted.toFixed(2));
                }}
                className="w-full px-4 py-2 mt-2 rounded-md border border-white/20 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: "#1f2937", color: "white" }}
              />
            )}
          </div>

          {/* Property Location */}
          <div>
            <label className="text-sm text-blue-200 block mb-1">
              Property Location
            </label>
            <select
              value={loanData[1]?.location || ""}
              onChange={(e) =>
                handleLoanChange(1, "location", e.target.value)
              }
              className="w-full px-4 py-2 rounded-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              style={{ backgroundColor: "#1f2937", color: "white" }}
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
            <label className="text-sm text-blue-200 block mb-1">
              Closing Attorney
            </label>
            <select
              value={loanData[1]?.attorney || ""}
              onChange={(e) =>
                handleLoanChange(1, "attorney", e.target.value)
              }
              className="w-full px-4 py-2 rounded-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              style={{ backgroundColor: "#1f2937", color: "white" }}
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
              checked={loanData[1]?.homestead || false}
              onChange={(e) =>
                handleLoanChange(1, "homestead", e.target.checked)
              }
              className="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
            />
            <label className="text-sm text-blue-200">
              Apply Homestead Exemption
            </label>
          </div>

          {/* Inside City Limits Toggle */}
          {(loanData[1]?.location === "Lee County, AL" ||
            loanData[1]?.location === "Russell County, AL") && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={loanData[1]?.inCityLimits || false}
                onChange={(e) =>
                  handleLoanChange(1, "inCityLimits", e.target.checked)
                }
                className="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
              />
              <label className="text-sm text-blue-200">
                Property is Inside City Limits
              </label>
            </div>
          )}

          {/* Closing Date */}
          <div>
            <label className="text-sm text-blue-200 block mb-1">
              Closing Date
            </label>
            <input
              type="date"
              value={loanData[1]?.closingDate || ""}
              onChange={(e) =>
                handleLoanChange(1, "closingDate", e.target.value)
              }
              className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => calculateEstimates(1)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow"
            >
              Get Estimate
            </button>
            <button
              onClick={() => resetSingleCard(1)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg shadow"
            >
              Reset Estimate
            </button>
          </div>

          {/* Results Display */}
          {results[1] && (
            <motion.div
              id="estimate-card-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 border border-white/20 p-4 rounded-xl text-sm space-y-2 text-white mt-4"
            >
              {/* Loan Summary */}
              <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pb-1 mb-2">
                Loan Summary
              </h3>
              <div>
                <strong>Loan Type:</strong> {loanData[1]?.loanType}
              </div>
              <div>
                <strong>Property Location:</strong> {loanData[1]?.location}
              </div>
              <div>
                <strong>Sales Price:</strong> {salesPrice}
              </div>
              {loanData[1]?.loanType?.includes("VA") &&
                results[1]?.fundingFee && (
                  <div>
                    <strong>VA Funding Fee:</strong> {results[1].fundingFee}
                  </div>
                )}
              {loanData[1]?.loanType === "FHA" && results[1]?.ufmip && (
                <div>
                  <strong>UFMIP:</strong> {results[1].ufmip}
                </div>
              )}
              <div>
                <strong>Loan Amount:</strong> {results[1].loanAmount}
              </div>
              {results[1].downPaymentAmount &&
                parseFloat(
                  results[1].downPaymentAmount.replace(/[^0-9.]/g, "")
                ) > 0 && (
                  <div>
                    <strong>Down Payment:</strong>{" "}
                    {results[1].downPaymentAmount}
                  </div>
                )}
              <div>
                <strong>Interest Rate:</strong> {loanData[1]?.interestRate}%
              </div>
              <div>
                <strong>Closing Date:</strong> {loanData[1]?.closingDate}
              </div>

              {/* Monthly Payment */}
              <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">
                Monthly Payment
              </h3>
              <div>
                <strong>Principal & Interest:</strong>{" "}
                {results[1].principalInterest}
              </div>
              <div>
                <strong>Homeowners Insurance:</strong>{" "}
                {results[1].homeownersInsurance}
              </div>
              <div>
                <strong>Estimated Property Tax:</strong> {results[1].monthlyTax}
              </div>
              <div>
                <strong>Monthly MI:</strong> {results[1].monthlyMI}
              </div>
              <div className="text-green-400 font-bold border-t border-white/10 pt-2">
                Total Monthly Payment: {results[1].totalPayment}
              </div>

              {/* Closing Costs */}
              <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">
                Closing Costs
              </h3>
              <div>
                <strong>Underwriting Fee:</strong>{" "}
                {results[1].breakdown.underwritingFee}
              </div>
              <div>
                <strong>Appraisal Fee:</strong>{" "}
                {results[1].breakdown.appraisalFee}
              </div>
              <div>
                <strong>Credit Report:</strong>{" "}
                {results[1].breakdown.creditReport}
              </div>
              <div>
                <strong>Attorney Fee:</strong>{" "}
                {results[1].breakdown.attorneyFee}
              </div>
              <div>
                <strong>Title Search:</strong>{" "}
                {results[1].breakdown.titleSearch}
              </div>
              <div>
                <strong>Owner’s Title Insurance:</strong>{" "}
                {results[1].breakdown.ownerTitle}
              </div>
              <div>
                <strong>Lender’s Title Insurance:</strong>{" "}
                {results[1].breakdown.lenderTitle}
              </div>
              <div>
                <strong>Mortgage Tax:</strong>{" "}
                {results[1].breakdown.mortgageTax}
              </div>
              <div>
                <strong>Transfer Tax:</strong>{" "}
                {results[1].breakdown.transferTax}
              </div>
              <div className="text-orange-400 font-bold pt-1">
                Total Closing Costs: {results[1].totalClosingCosts}
              </div>

              {/* Prepaids & Escrows */}
              <h3 className="text-lg font-bold text-blue-300 border-b border-white/10 pt-4 pb-1 mb-2">
                Prepaids & Escrows
              </h3>
              <div>
                <strong>Prepaid Interest:</strong>{" "}
                {results[1].breakdown.prepaidInterest}
              </div>
              <div>
                <strong>Homeowners Insurance (1yr):</strong>{" "}
                {results[1].breakdown.insuranceAnnual}
              </div>
              <div>
                <strong>Insurance Escrow (3 mo):</strong>{" "}
                {results[1].breakdown.insuranceEscrow}
              </div>
              <div>
                <strong>Tax Escrow (3 mo):</strong>{" "}
                {results[1].breakdown.taxEscrow}
              </div>
              <div className="text-orange-400 font-bold pt-1">
                Total Prepaids & Escrows: {results[1].totalPrepaids}
              </div>

              {/* Final Cash to Close */}
              <div className="flex justify-between text-lg font-bold text-orange-400 border-t border-white/20 pt-4 mt-4">
                <span>Final Cash to Close:</span>
                <span>{results[1].finalCashToClose}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
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