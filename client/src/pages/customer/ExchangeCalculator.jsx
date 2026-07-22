import { useState } from 'react';
import { RotateCcw, Smartphone, IndianRupee } from 'lucide-react';

const phoneModels = [
  { brand: 'Apple', models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 12', 'iPhone SE 2022'] },
  { brand: 'Samsung', models: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy A54', 'Galaxy A34', 'Galaxy M34'] },
  { brand: 'OnePlus', models: ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord CE 3', 'OnePlus Nord 3'] },
  { brand: 'Xiaomi', models: ['Xiaomi 14', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi 13C'] },
  { brand: 'Vivo', models: ['Vivo X100', 'Vivo V29', 'Vivo Y36'] },
  { brand: 'Oppo', models: ['Oppo Reno 11', 'Oppo A78'] },
  { brand: 'Realme', models: ['Realme GT 5 Pro', 'Realme 12 Pro', 'Realme Narzo 70'] },
];

const exchangeValues = {
  'iPhone 15 Pro Max': 65000, 'iPhone 15 Pro': 55000, 'iPhone 15': 45000,
  'iPhone 14 Pro Max': 48000, 'iPhone 14 Pro': 40000, 'iPhone 14': 32000,
  'iPhone 13 Pro Max': 35000, 'iPhone 13': 25000, 'iPhone 12': 18000, 'iPhone SE 2022': 15000,
  'Galaxy S24 Ultra': 55000, 'Galaxy S24+': 42000, 'Galaxy S24': 35000,
  'Galaxy S23 Ultra': 40000, 'Galaxy S23': 28000, 'Galaxy A54': 15000,
  'Galaxy A34': 12000, 'Galaxy M34': 9000,
  'OnePlus 12': 35000, 'OnePlus 11': 25000, 'OnePlus Nord CE 3': 12000, 'OnePlus Nord 3': 15000,
  'Xiaomi 14': 28000, 'Redmi Note 13 Pro': 10000, 'Redmi Note 13': 8000, 'Redmi 13C': 4000,
  'Vivo X100': 30000, 'Vivo V29': 14000, 'Vivo Y36': 6000,
  'Oppo Reno 11': 15000, 'Oppo A78': 7000,
  'Realme GT 5 Pro': 22000, 'Realme 12 Pro': 13000, 'Realme Narzo 70': 7000,
};

export default function ExchangeCalculator() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [condition, setCondition] = useState('good');

  const brandModels = phoneModels.find(b => b.brand === selectedBrand)?.models || [];
  const conditionMultiplier = condition === 'excellent' ? 1.0 : condition === 'good' ? 0.85 : 0.65;
  const baseValue = exchangeValues[selectedModel] || 0;
  const estimatedValue = Math.round(baseValue * conditionMultiplier);

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-xl flex items-center justify-center">
            <RotateCcw size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Exchange Calculator</h1>
            <p className="text-sm text-gray-500">Get the best value for your old phone</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Brand</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {phoneModels.map(brand => (
                <button key={brand.brand} onClick={() => { setSelectedBrand(brand.brand); setSelectedModel(''); }}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition text-center ${selectedBrand === brand.brand ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  {brand.brand}
                </button>
              ))}
            </div>
          </div>

          {selectedBrand && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Model</label>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none">
                <option value="">Select Model</option>
                {brandModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          )}

          {selectedModel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Condition</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'excellent', label: 'Excellent', desc: 'No scratches, works perfectly' },
                  { value: 'good', label: 'Good', desc: 'Minor scratches, works well' },
                  { value: 'fair', label: 'Fair', desc: 'Visible wear, some issues' },
                ].map(c => (
                  <button key={c.value} onClick={() => setCondition(c.value)}
                    className={`p-4 rounded-xl border-2 text-center transition ${condition === c.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-medium text-sm">{c.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {selectedModel && (
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white text-center">
              <p className="text-orange-100 text-sm mb-1">Estimated Exchange Value</p>
              <p className="text-4xl font-bold flex items-center justify-center gap-1">
                <IndianRupee size={28} />{estimatedValue.toLocaleString()}
              </p>
              <p className="text-orange-200 text-xs mt-2">* Final value may vary after physical inspection at the store</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-700 font-medium text-sm">How Exchange Works:</p>
            <ol className="text-blue-600 text-xs mt-2 space-y-1 list-decimal list-inside">
              <li>Get an estimated value using this calculator</li>
              <li>Visit our store with your old phone</li>
              <li>Our team will inspect and verify the condition</li>
              <li>Get instant discount on your new purchase!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
