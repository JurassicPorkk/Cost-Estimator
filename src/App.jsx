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

    setResult(`💬 Loan Estimate
-----------------------------
Loan Amount: $${loanAmount.toFixed(2)}
Principal & Interest: $${principalInterest.toFixed(2)}
Homeowners Insurance: $${homeownersInsurance.toFixed(2)}
Property Tax (Homestead): $${monthlyTaxHomestead.toFixed(2)}
Property Tax (Non-Homestead): $${monthlyTaxNonHomestead.toFixed(2)}

Total PITI (Homestead): $${pitiHomestead.toFixed(2)}
Total PITI (Non-Homestead): $${pitiNonHomestead.toFixed(2)}
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
      <pre style={{ marginTop: 20, background: '#f1f1f1', padding: 12 }}>{result}</pre>
    </div>
  );
}
