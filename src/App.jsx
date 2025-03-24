import React, { useState } from 'react';

export default function App() {
  const [result, setResult] = useState('');

  const handleEstimate = () => {
    setResult("Sample estimate shown here. Backend integration coming soon.");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Loan Estimate Generator</h1>
      <button onClick={handleEstimate}>Get Estimate</button>
      <p style={{ marginTop: 20 }}>{result}</p>
    </div>
  );
}