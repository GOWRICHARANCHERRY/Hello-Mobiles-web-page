import { useState } from 'react';
import { Calculator, IndianRupee } from 'lucide-react';

export default function EMICalculator() {
  const [price, setPrice] = useState(44999);
  const [tenure, setTenure] = useState(12);
  const [interestRate, setInterestRate] = useState(0);

  const monthlyEmi = Math.round(price / tenure);
  const totalPayable = monthlyEmi * tenure;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gold-100 text-gold-600 w-12 h-12 rounded-xl flex items-center justify-center">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">EMI Calculator</h1>
            <p className="text-sm text-gray-500">Calculate your monthly installments</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Product Price</span>
              <span className="text-gold-600">₹{price.toLocaleString()}</span>
            </label>
            <input type="range" min="1000" max="200000" step="500" value={price}
              onChange={e => setPrice(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>₹1,000</span><span>₹2,00,000</span>
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Tenure (Months)</span>
              <span className="text-gold-600">{tenure} months</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[3, 6, 9, 12, 18, 24].map(t => (
                <button key={t} onClick={() => setTenure(t)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition ${tenure === t ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  {t} months
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="bg-gradient-to-br from-gold-600 to-primary-800 rounded-2xl p-6 text-white text-center">
            <p className="text-blue-200 text-sm mb-1">Monthly EMI</p>
            <p className="text-4xl font-bold">₹{monthlyEmi.toLocaleString()}<span className="text-lg font-normal text-blue-200">/month</span></p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-xs">Total Payable</p>
                <p className="font-bold">₹{totalPayable.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Interest Rate</p>
                <p className="font-bold">{interestRate}% (No Cost EMI)</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-medium text-sm">No Cost EMI Available!</p>
            <p className="text-green-600 text-xs mt-1">0% interest on all major bank credit cards. No down payment required.</p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>* EMI calculation is approximate and may vary based on bank.</p>
            <p>* No Cost EMI available on select credit cards.</p>
            <p>* Processing fees may apply from the bank.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
