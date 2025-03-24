// Updated App.jsx - Move Sales Price & Down Payment to Loan Summary
// and remove Down Payment from Prepaids section

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
  const [downPayment, setDownPayment] = useState(5);
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
    setDownPayment(5);
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
    let downPaymentAmount = 0;

    if (loanType === 'Conventional') {
      const downPaymentPercent = downPayment / 100;
      downPaymentAmount = sales * downPaymentPercent;
      loanAmount = sales - downPaymentAmount;
    } else if (loanType === 'FHA') loanAmount = sales * 0.965 * 1.0175;
    else if (loanType === 'VA First') loanAmount = sales * 1.0215;
    else if (loanType === 'VA Second') loanAmount = sales * 1.033;
    else if (loanType === 'VA Exempt') loanAmount = sales;

    const monthlyRate = rate / 12;
    const principalInterest = (monthlyRate * loanAmount) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    const homeownersInsurance = insurance / 12;

    let monthlyMI = 0;
    if (loanType === 'Conventional') {
      const dp = downPayment;
      if (dp < 10) monthlyMI = (loanAmount * 0.0035) / 12;
      else if (dp < 15) monthlyMI = (loanAmount * 0.0025) / 12;
      else if (dp < 20) monthlyMI = (loanAmount * 0.0015) / 12;
      else monthlyMI = 0;
    }
    if (loanType === 'FHA') monthlyMI = (loanAmount * 0.0055) / 12;

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
    const appraisalFee = loanType.includes('VA')
      ? (location.includes('GA') ? 650 : 600)
      : loanType === 'FHA' ? 600 : 525;

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
      closingCosts: closingCostsItems,
      totalClosingCosts: formatCurrency(closingCostsTotal),
      prepaids: prepaidsItems,
      totalPrepaids: formatCurrency(prepaidsTotal),
      totalCashToClose: formatCurrency(totalCashToClose),
    });
  };

// (UI layout continues unchanged...)
