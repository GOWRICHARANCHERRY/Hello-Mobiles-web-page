import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';

export default function AboutUs() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SEO
        title="About Us"
        description="Hello Mobiles — trusted mobile phone and electronics store in Visakhapatnam, Andhra Pradesh. Wide range of smartphones, laptops, TVs, and gadgets with EMI options."
        path="/about"
      />
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutUs')}</h1>
        <p className="text-gray-500 mt-2">{t('cust.comingSoon')}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <p className="text-gray-500">{t('cust.aboutContent')}</p>
      </div>
    </div>
  );
}
