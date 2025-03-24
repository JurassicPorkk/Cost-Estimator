import React, { useState } from 'react';

export default function App() {
  const [salesPrice, setSalesPrice] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanType, setLoanType] = useState('VA First');
  const [location, setLocation] = useState('Columbus, GA');
  const [cityLimits, setCityLimits] = useState('Inside');
  const [result, setResult] = useState('');

  const calculateEstimate = () => {
    const sales = parseFloat(salesPrice);
    const rate = parseFloat(interestRate) / 100;
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

    // Taxes
    let yearlyTaxHomestead = 0;
    let yearlyTaxNonHomestead = 0;

    if (location === 'Columbus, GA') {
      yearlyTaxHomestead = sales * 0.4 * 0.04153 - 543;
      yearlyTaxNonHomestead = sales * 0.4 * 0.04153;
    }

    if (location === 'Lee County, AL') {
      if (cityLimits === 'Inside') {
        yearlyTaxHomestead = sales * 0.1 * 0.054 + 169;
        yearlyTaxNonHomestead = sales * 0.2 * 0.054 + 169;
      } else {
        yearlyTaxHomestead = sales * 0.1 * 0.041 + 169;
        yearlyTaxNonHomestead = sales * 0.2 * 0.041 + 169;
      }
    }

    if (location === 'Russell County, AL') {
      if (cityLimits === 'Inside') {
        yearlyTaxHomestead = sales * 0.1 * 0.059 - 74;
        yearlyTaxNonHomestead = sales * 0.2 * 0.059 - 74;
      } else {
        yearlyTaxHomestead = sales * 0.1 * 0.036 - 74;
        yearlyTaxNonHomestead = sales * 0.2 * 0.036 - 74;
      }
    }

    const monthlyTaxHomestead = yearlyTaxHomestead / 12;
    const monthlyTaxNonHomestead = yearlyTaxNonHomestead / 12;
    const pitiHomestead = principalInterest + homeownersInsurance + monthlyTaxHomestead;
    const pitiNonHomestead = principalInterest + homeownersInsurance + monthlyTaxNonHomestead;

    // Closing Costs
    const underwritingFee = 1320;
    const attorneyFee = 1075;
    const titleSearchFee = 250;
    const recordingFee = 70;
    const creditReportFee = 140;
    const appraisalFee = loanType === 'VA First' || loanType === 'VA Second' || loanType === 'VA Exempt' ?
      (location.includes('GA') ? 650 : 600) : loanType === 'FHA' ? 600 : 525;

    const ownerTitle = location === 'Columbus, GA' ? sales * 0.0022 : sales * 0.0011;
    const lenderTitle = location === 'Columbus, GA' ? loanAmount * 0.00352 : loanAmount * 0.00216;

    const mortgageTax = location === 'Columbus, GA'
      ? (loanAmount / 100) * 0.30
      : (loanAmount / 100) * 0.15;

    let transferTax = location === 'Columbus, GA'
      ? (sales / 1000) * 1.0
      : (sales - loanAmount) / 1000;
    if (transferTax < 0) transferTax = 0;

    const closingCosts = underwritingFee + attorneyFee + titleSearchFee + recordingFee + creditReportFee + appraisalFee + ownerTitle + lenderTitle + mortgageTax + transferTax;

    // Prepaids & Escrows
    const prepaidInterest = (loanAmount * rate / 365) * 15; // assume 15 days avg
    const insuranceCushion = insurance / 12 * 3;
    const propertyTaxEscrow = (yearlyTaxHomestead / 12) * 4;

    const prepaidsEscrows = prepaidInterest + insurance + insuranceCushion + propertyTaxEscrow;

    const totalCashToClose = closingCosts + prepaidsEscrows;

    setResult(`💬 Loan Estimate Breakdown
-----------------------------
Loan Amount: $${loanAmount.toFixed(2)}
Principal & Interest: $${principalInterest.toFixed(2)}
Homeowners Insurance: $${homeownersInsurance.toFixed(2)}
Monthly Tax (Homestead): $${monthlyTaxHomestead.toFixed(2)}
Monthly Tax (Non-Homestead): $${monthlyTaxNonHomestead.toFixed(2)}

Total Monthly Payment (PITI - Homestead): $${pitiHomestead.toFixed(2)}
Total Monthly Payment (PITI - Non-Homestead): $${pitiNonHomestead.toFixed(2)}

--- Closing Costs ---
Underwriting Fee: $${underwritingFee}
Attorney Fee: $${attorneyFee}
Title Search Fee: $${titleSearchFee}
Recording Fee: $${recordingFee}
Credit Report Fee: $${creditReportFee}
Appraisal Fee: $${appraisalFee}
Owner's Title Insurance: $${ownerTitle.toFixed(2)}
Lender's Title Insurance: $${lenderTitle.toFixed(2)}
Mortgage Tax: $${mortgageTax.toFixed(2)}
Transfer Tax: $${transferTax.toFixed(2)}
Closing Costs Total: $${closingCosts.toFixed(2)}

--- Prepaids & Escrows ---
Prepaid Interest (15 days): $${prepaidInterest.toFixed(2)}
Insurance (1yr prepaid): $${insurance}
Insurance Cushion (3 mo): $${insuranceCushion.toFixed(2)}
Property Tax Escrow (4 mo): $${propertyTaxEscrow.toFixed(2)}
Prepaids & Escrows Total: $${prepaidsEscrows.toFixed(2)}

💰 Final Cash to Close: $${totalCashToClose.toFixed(2)}
`);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Loan Estimate Generator</h1>
      <input placeholder="Sales Price" value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} />
      <input placeholder="Interest Rate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
      <select value={loanType} onChange={(e) => setLoanType(e.target.value)}>
        <option>VA First</option>
        <option>VA Second</option>
        <option>VA Exempt</option>
        <option>FHA</option>
        <option>Conventional</option>
      </select>
      <select value={location} onChange={(e) => setLocation(e.target.value)}>
        <option>Columbus, GA</option>
        <option>Lee County, AL</option>
        <option>Russell County, AL</option>
      </select>
      {(location !== 'Columbus, GA') && (
        <select value={cityLimits} onChange={(e) => setCityLimits(e.target.value)}>
          <option>Inside</option>
          <option>Outside</option>
        </select>
      )}
      <br />
      <button onClick={calculateEstimate}>Get Estimate</button>
      <pre style={{ marginTop: 20, background: '#ffa500', padding: 12 }}>{result}</pre>
    </div>
  );
}
