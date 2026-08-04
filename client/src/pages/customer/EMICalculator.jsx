import { useState } from 'react';
import { Calculator, IndianRupee } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';

export default function EMICalculator() {
  const [price, setPrice] = useState(44999);
  const [tenure, setTenure] = useState(12);
  const [interestRate, setInterestRate] = useState(0);
  const { t } = useLanguage();

  const monthlyEmi = Math.round(price / tenure);
  const totalPayable = monthlyEmi * tenure;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <SEO
        title="EMI Calculator"
        description="Calculate your monthly EMI on mobile phones and electronics at Hello Mobiles, Nellore district. Zero-interest EMI options available."
        path="/emi-calculator"
      />
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gold-100 text-gold-700 w-12 h-12 rounded-xl flex items-center justify-center">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('cust.emiCalculator')}</h1>
            <p className="text-sm text-gray-500">{t('cust.calculateMonthlyInstallments')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>{t('cust.productPrice')}</span>
              <span className="text-gold-700">₹{price.toLocaleString()}</span>
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
              <span>{t('cust.tenureMonths')}</span>
              <span className="text-gold-700">{t('cust.months', { count: tenure })}</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[3, 6, 9, 12, 18, 24].map(months => (
                <button key={months} onClick={() => setTenure(months)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition ${tenure === months ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  {t('cust.months', { count: months })}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="bg-gradient-to-br from-gold-600 to-primary-800 rounded-2xl p-6 text-white text-center">
            <p className="text-blue-200 text-sm mb-1">{t('cust.monthlyEmi')}</p>
            <p className="text-4xl font-bold">₹{monthlyEmi.toLocaleString()}<span className="text-lg font-normal text-blue-200">/{t('cust.month')}</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-xs">{t('cust.totalPayable')}</p>
                <p className="font-bold">₹{totalPayable.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">{t('cust.interestRate')}</p>
                <p className="font-bold">{interestRate}% ({t('cust.noCostEmi')})</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-medium text-sm">{t('cust.noCostEmiAvailable')}</p>
            <p className="text-green-600 text-xs mt-1">{t('cust.noCostEmiDesc')}</p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>{t('cust.emiDisclaimer1')}</p>
            <p>{t('cust.emiDisclaimer2')}</p>
            <p>{t('cust.emiDisclaimer3')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
