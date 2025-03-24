import React, { useState } from 'react';

export default function App() {
  const [result, setResult] = useState('');

  const handleEstimate = () => {
    setResult(`Loan Summary
Loan Type: VA First
Loan Amount: $200,000

Monthly Payment (PITI)
Principal & Interest: $1,264.14
Homeowners Insurance: $125.00
Property Tax (Homestead): $235.00
Property Tax (Non-Homestead): $310.00
Total Monthly Payment: $1,624.14

Title & Fixed Fees
Owner’s Title: $462.00
Lender’s Title: $704.00
Underwriting Fee: $1,320.00
Attorney Fee: $1,075.00
Credit Report: $140.00
Appraisal: $650.00
Title Search: $250.00
Recording Fee: $70.00
Mortgage Tax: $600.00
Transfer Tax: $0.00

Prepaids & Escrows
Prepaid Interest: $234.25
Homeowners Insurance (1 Yr): $1,500.00
Insurance Escrow (3 mo): $375.00
Property Tax Escrow (4 mo): $940.00

Final Cash to Close: $10,927.39`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Loan Estimate Generator</h1>
        <button style={styles.button} onClick={handleEstimate}>
          Get Estimate
        </button>
        <pre style={styles.result}>{result}</pre>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: '#f2f4f8',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Segoe UI, sans-serif',
  },
  card: {
    background: '#fff',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '90%',
  },
  title: {
    fontSize: '24px',
    marginBottom: '24px',
    textAlign: 'center',
    color: '#333',
  },
  button: {
    background: '#0070f3',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
  },
  result: {
    marginTop: '24px',
    whiteSpace: 'pre-wrap',
    background: '#f9f9f9',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px',
    maxHeight: '400px',
    overflowY: 'auto',
    lineHeight: '1.6',
    color: '#222',
  },
};
