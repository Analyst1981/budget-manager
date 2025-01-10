import React from 'react';
import './App.css';
import BudgetManager from './components/budget-manager';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">预算管理器</h1>
        <BudgetManager />
      </div>
    </div>
  );
}

export default App;
