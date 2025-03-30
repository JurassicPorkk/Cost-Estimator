// App.jsx — Snapshot Pro Full UI Setup (Part 1: Imports & Setup)

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

const formatCurrency = (value) => {
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const unformatCurrency = (value) => value.replace(/[^0-9.]/g, '');

export default function App() {
  const [salesPrice, setSalesPrice] = useState('');
  const [loanData, setLoanData] = useState({
      1: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
      2: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
      3: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
    });
  const [expandedEstimate, setExpandedEstimate] = useState(null);
  const handleLoanChange = (id, field, value) => {
    setLoanData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };
  const [results, setResults] = useState({});

const calculateEstimates = (id) => {
  const data = loanData[id];
  const sales = parseFloat(unformatCurrency(salesPrice)) || 0;
  const rate = parseFloat(data.interestRate) / 100 || 0;
  const downPercent = parseFloat(data.downPayment) || 0;
  const loanBase = sales - (sales * downPercent / 100);
  const insurance = 1500;
  const termMonths = 360;

  let loanAmount = 0;
  let fundingFee = 0;

  if (data.loanType === 'Conventional') {
    loanAmount = loanBase;
  } else if (data.loanType === 'FHA') {
    loanAmount = loanBase * 1.0175;
  } else if (data.loanType === 'VA First') {
    if (downPercent >= 10) fundingFee = 0.0125;
    else if (downPercent >= 5) fundingFee = 0.015;
    else fundingFee = 0.0215;
    loanAmount = loanBase + loanBase * fundingFee;
  } else if (data.loanType === 'VA Second') {
    if (downPercent >= 10) fundingFee = 0.0125;
    else if (downPercent >= 5) fundingFee = 0.015;
    else fundingFee = 0.033;
    loanAmount = loanBase + loanBase * fundingFee;
  } else if (data.loanType === 'VA Exempt') {
    loanAmount = loanBase;
  }

  const monthlyRate = rate / 12;
  const principalInterest = (monthlyRate * loanAmount) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  const homeownersInsurance = insurance / 12;

  // Simplified tax formula — customize as needed per your rules
  const monthlyTax = (sales * 0.4 * 0.04153) / 12;

  // Simplified MI logic
  let monthlyMI = 0;
  if (data.loanType === 'Conventional' && downPercent < 20) {
    monthlyMI = loanAmount * 0.0035 / 12;
  } else if (data.loanType === 'FHA') {
    monthlyMI = loanAmount * (downPercent >= 5 ? 0.005 : 0.0055) / 12;
  }

  const piti = principalInterest + homeownersInsurance + monthlyTax + monthlyMI;

  const result = {
    loanAmount: formatCurrency(loanAmount),
    principalInterest: formatCurrency(principalInterest),
    homeownersInsurance: formatCurrency(homeownersInsurance),
    monthlyTax: formatCurrency(monthlyTax),
    monthlyMI: formatCurrency(monthlyMI),
    totalPayment: formatCurrency(piti),
    finalCashToClose: formatCurrency(
      (sales * (downPercent / 100)) + // Down Payment
      1320 + // Underwriting Fee
      1075 + // Attorney Fee
      250 +  // Title Search
      70 +   // Recording
      140 +  // Credit Report
      525 +  // Appraisal
      1500   // Prepaid Homeowners
    ),
  };

  setResults((prev) => ({
    ...prev,
    [id]: result
  }));
};

  const resetForm = () => {
    setSalesPrice('');
    setLoanData({
      1: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
      2: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
      3: { loanType: '', interestRate: '', downPayment: '', location: 'Columbus, GA', closingDate: dayjs().format('YYYY-MM-DD') },
    });
    setExpandedEstimate(null);
  }; 

  return (
    <div className="min-h-screen text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-extrabold text-center text-white tracking-tight"
        >
          Snapshot Pro
        </motion.h1>
        <p className="text-center text-sm text-gray-400">by Dustin Steele</p>

        {/* Sales Price Input */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/20">
          <label className="block mb-2 text-blue-200 font-semibold">Sales Price</label>
          <input
            type="text"
            placeholder="Enter Sales Price"
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
            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        // Step 2: Add Expandable Estimate Sections with Loan Info Inputs

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {[1, 2, 3].map((id) => (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: id * 0.1 }}
      className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-md"
    >
      <button
        onClick={() => setExpandedEstimate((prev) => (prev === id ? null : id))}
        className="w-full font-semibold text-white text-center text-lg py-2 px-4 bg-blue-600 hover:bg-blue-700 transition rounded-lg shadow"
      >
        {`Estimate ${id}`}
      </button>

      <AnimatePresence>
      {expandedEstimate === id && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className="overflow-hidden mt-4 space-y-4"
  >
    {/* Loan Inputs */}
    <div>
      <label className="text-sm text-blue-200 block mb-1">Loan Type</label>
      <select
        value={loanData[id]?.loanType || ''}
        onChange={(e) => handleLoanChange(id, 'loanType', e.target.value)}
        className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
      >
        <option value="">Select</option>
        <option value="Conventional">Conventional</option>
        <option value="FHA">FHA</option>
        <option value="VA First">VA First</option>
        <option value="VA Second">VA Second</option>
        <option value="VA Exempt">VA Exempt</option>
      </select>
    </div>

    <div>
      <label className="text-sm text-blue-200 block mb-1">Interest Rate</label>
      <input
        type="text"
        value={loanData[id]?.interestRate || ''}
        onChange={(e) => handleLoanChange(id, 'interestRate', e.target.value)}
        placeholder="e.g. 6.75"
        className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
      />
    </div>

    <div>
      <label className="text-sm text-blue-200 block mb-1">Down Payment %</label>
      <input
        type="text"
        value={loanData[id]?.downPayment || ''}
        onChange={(e) => handleLoanChange(id, 'downPayment', e.target.value)}
        placeholder="e.g. 5"
        className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
      />
    </div>

    <div>
      <label className="text-sm text-blue-200 block mb-1">Property Location</label>
      <select
        value={loanData[id]?.location || ''}
        onChange={(e) => handleLoanChange(id, 'location', e.target.value)}
        className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
      >
        <option value="Columbus, GA">Columbus, GA</option>
        <option value="Harris County, GA">Harris County, GA</option>
        <option value="Lee County, AL">Lee County, AL</option>
        <option value="Russell County, AL">Russell County, AL</option>
      </select>
    </div>

    <div>
      <label className="text-sm text-blue-200 block mb-1">Closing Date</label>
      <input
        type="date"
        value={loanData[id]?.closingDate || ''}
        onChange={(e) => handleLoanChange(id, 'closingDate', e.target.value)}
        className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
      />
    </div>

    {/* Get Estimate Button */}
    <button
      onClick={() => calculateEstimates(id)}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow transition"
    >
      Get Estimate
    </button>
    <div className="mt-8 text-center">
  <button
    onClick={resetForm}
    className="inline-block bg-red-600 hover:bg-red-700 transition text-white font-semibold px-6 py-2 rounded-lg shadow"
  >
    Reset All
  </button>
</div>

    {/* Results Display */}
    {results[id] && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/5 border border-white/20 p-4 rounded-xl text-sm space-y-2 text-white mt-4"
      >
        <div><strong>Loan Amount:</strong> {results[id].loanAmount}</div>
        <div><strong>Principal & Interest:</strong> {results[id].principalInterest}</div>
        <div><strong>Homeowners Insurance:</strong> {results[id].homeownersInsurance}</div>
        <div><strong>Estimated Property Tax:</strong> {results[id].monthlyTax}</div>
        <div><strong>Monthly MI:</strong> {results[id].monthlyMI}</div>
        <div className="text-green-400 font-bold border-t border-white/10 pt-2">
          Total Monthly Payment: {results[id].totalPayment}
        </div>
        {/* Final Cash to Close */}
<div className="flex justify-between text-lg font-bold text-orange-400 border-t border-white/20 pt-4 mt-4">
  <span>Final Cash to Close:</span>
  <span>{results[id].finalCashToClose}</span>
</div>
      </motion.div>
    )}
  </motion.div>
)}
      </AnimatePresence>
    </motion.div>
  ))}
  {/* Step 10: Results Summary Cards */}
  {Object.keys(results).length > 0 && (
  <div className="mt-16 space-y-10">
    <h2 className="text-2xl font-bold text-center text-blue-400 mb-8">
      All Estimate Summaries
    </h2>
    <div className="grid md:grid-cols-3 gap-6">
    {Object.entries(results).map(([id, result]) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 border border-white/20 p-6 rounded-xl text-white text-sm space-y-2 shadow-md backdrop-blur-md"
        >
          <h3 className="text-xl font-bold text-blue-300 text-center">
            Estimate {result.id}: {result.loanType}
          </h3>
          <div><strong>Loan Amount:</strong> {result.loanAmount}</div>
          <div><strong>Down Payment:</strong> {result.downPayment}</div>
          <div><strong>Principal & Interest:</strong> {result.principalAndInterest}</div>
          <div><strong>Homeowners Insurance:</strong> {result.homeownersInsurance}</div>
          <div><strong>Estimated Property Tax:</strong> {result.monthlyTax}</div>
          <div><strong>Monthly MI:</strong> {result.monthlyMI}</div>
          <div className="font-semibold text-green-400 border-t border-white/20 pt-2">
            Total Monthly Payment: {result.totalPayment}
          </div>
          <div className="text-orange-400 font-bold flex justify-between border-t border-white/20 pt-4 mt-2 text-lg">
            <span>Cash to Close:</span>
            <span>{result.finalCashToClose}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
)}

 {/* Placeholder for Step 4: Estimate Results Display */}
<div className="mt-12">
  <div className="grid md:grid-cols-3 gap-6">
    {/* Result cards will be rendered here later */}
    </div>
  </div>
</div>
</div>
</div>}