import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';

const sections = [
  { id: 'privacy', label: 'cust.privacyPolicy' },
  { id: 'terms', label: 'cust.termsConditions' },
  { id: 'shipping', label: 'cust.shippingDelivery' },
  { id: 'returns', label: 'cust.returnsRefunds' },
];

const pathToSection = {
  '/terms-and-conditions': 'terms',
  '/privacy-policy': 'privacy',
  '/shipping-policy': 'shipping',
  '/return-policy': 'returns',
  '/refund-policy': 'returns',
};

const blockCopy = (e) => e.preventDefault();

export default function TermsAndConditions() {
  const { t } = useLanguage();
  const location = useLocation();
  const [active, setActive] = useState(() => pathToSection[location.pathname] || 'terms');

  useEffect(() => {
    const s = pathToSection[location.pathname];
    if (s) setActive(s);
  }, [location.pathname]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 select-none" onCopy={blockCopy} onCut={blockCopy} onContextMenu={blockCopy} onSelectStart={blockCopy} onDragStart={blockCopy}>
      <SEO
        title="Terms & Conditions"
        description="Read the terms and conditions, privacy policy, shipping and returns policy for Hello Mobiles, Nellore district."
        path={location.pathname}
      />
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.policies')}</h1>
        <p className="text-gray-500 mt-2">{t('cust.policiesSubtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <nav className="md:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24 space-y-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${active === s.id ? 'gold-gradient text-white' : 'text-gray-600 hover:bg-gold-50'}`}>
                {t(s.label)}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 bg-white rounded-xl shadow-sm p-6 md:p-8 min-h-[500px]">
          {active === 'privacy' && <PrivacyPolicy />}
          {active === 'terms' && <Terms />}
          {active === 'shipping' && <Shipping />}
          {active === 'returns' && <Returns />}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-2xl font-bold gold-text mb-6 pb-3 border-b" style={{ fontFamily: 'Playfair Display, serif' }}>{children}</h2>;
}

function PrivacyPolicy() {
  const { t } = useLanguage();
  return (
    <div>
      <SectionTitle>{t('cust.privacyTitle')}</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>{t('cust.privacyP1a')}<strong>Hello Mobiles & Electronics</strong>{t('cust.privacyP1b')}</p>
        <p>{t('cust.privacyP2')}</p>
        <p>{t('cust.privacyP3')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH1')}</h3>
        <p>{t('cust.privacyCollectIntro')}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.privacyCollect1')}</li>
          <li>{t('cust.privacyCollect2')}</li>
          <li>{t('cust.privacyCollect3')}</li>
          <li>{t('cust.privacyCollect4')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH2')}</h3>
        <p>{t('cust.privacyTypesIntro')}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.privacyTypes1')}</li>
          <li>{t('cust.privacyTypes2')}</li>
          <li>{t('cust.privacyTypes3')}</li>
          <li>{t('cust.privacyTypes4')}</li>
          <li>{t('cust.privacyTypes5')}</li>
          <li>{t('cust.privacyTypes6')}</li>
          <li>{t('cust.privacyTypes7')}</li>
        </ul>
        <p>{t('cust.privacyTypesNote')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH3')}</h3>
        <p>{t('cust.privacyPurposesIntro')}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.privacyPurposes1')}</li>
          <li>{t('cust.privacyPurposes2')}</li>
          <li>{t('cust.privacyPurposes3')}</li>
          <li>{t('cust.privacyPurposes4')}</li>
          <li>{t('cust.privacyPurposes5')}</li>
          <li>{t('cust.privacyPurposes6')}</li>
          <li>{t('cust.privacyPurposes7')}</li>
          <li>{t('cust.privacyPurposes8')}</li>
          <li>{t('cust.privacyPurposes9')}</li>
          <li>{t('cust.privacyPurposes10')}</li>
          <li>{t('cust.privacyPurposes11')}</li>
          <li>{t('cust.privacyPurposes12')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH4')}</h3>
        <p>{t('cust.privacySecurityP')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH5')}</h3>
        <p>{t('cust.privacyCookiesP')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH6')}</h3>
        <p>{t('cust.privacyLinksP')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH7')}</h3>
        <p>{t('cust.privacyGrievanceP')}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.privacyGrievanceName')}</li>
          <li>{t('cust.privacyGrievanceDesignation')}</li>
          <li>{t('cust.privacyGrievanceCompany')}</li>
          <li>{t('cust.privacyGrievanceEmail')}</li>
          <li>{t('cust.privacyGrievancePhone')}</li>
        </ul>
        <p>{t('cust.privacyGrievanceWithdraw')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.privacyH8')}</h3>
        <p>{t('cust.privacyDeletionP')}</p>
      </div>
    </div>
  );
}

function Terms() {
  const { t } = useLanguage();
  return (
    <div>
      <SectionTitle>{t('cust.termsConditions')}</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>{t('cust.termsP0')}</p>
        <p>{t('cust.termsP1')}</p>
        <p>{t('cust.termsP3')}</p>
        <p>{t('cust.termsP2')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH1')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.terms1_1')}</li>
          <li>{t('cust.terms1_2')}</li>
          <li>{t('cust.terms1_3')}</li>
          <li>{t('cust.terms1_4')}</li>
          <li>{t('cust.terms1_5')}</li>
          <li>{t('cust.terms1_6')}</li>
          <li>{t('cust.terms1_7')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH2')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.terms2_1')}</li>
          <li>{t('cust.terms2_2')}</li>
          <li>{t('cust.terms2_3')}</li>
          <li>{t('cust.terms2_4')}</li>
          <li>{t('cust.terms2_5')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH3')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.terms3_1')}</li>
          <li>{t('cust.terms3_2')}</li>
          <li>{t('cust.terms3_3')}</li>
          <li>{t('cust.terms3_4')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH4')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.terms4_1')}</li>
          <li>{t('cust.terms4_2')}</li>
          <li>{t('cust.terms4_3')}</li>
          <li>{t('cust.terms4_4')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH5')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.terms5_1')}</li>
          <li>{t('cust.terms5_2')}</li>
          <li>{t('cust.terms5_3')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH6')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.terms6_1')}</li>
          <li>{t('cust.terms6_2')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH7')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.terms7_1')}</li>
          <li>{t('cust.terms7_2')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.termsH8')}</h3>
        <p>{t('cust.terms8P')}</p>
        <p>{t('cust.terms8Contact')}</p>
      </div>
    </div>
  );
}

function Shipping() {
  const { t } = useLanguage();
  return (
    <div>
      <SectionTitle>{t('cust.shippingTitle')}</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>{t('cust.shippingP1')}</p>
        <p>{t('cust.shippingP2')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.shippingH1')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.shipping1_1')}</li>
          <li>{t('cust.shipping1_2')}</li>
          <li>{t('cust.shipping1_3')}</li>
          <li>{t('cust.shipping1_4')}</li>
          <li>{t('cust.shipping1_5')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.shippingH2')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>{t('cust.shipping2_1Label')}:</strong> {t('cust.shipping2_1Value')}</li>
          <li><strong>{t('cust.shipping2_2Label')}:</strong> {t('cust.shipping2_2Value')}</li>
          <li>{t('cust.shipping2_3')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.shippingH3')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.shipping3_1')}</li>
          <li>{t('cust.shipping3_2')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.shippingH4')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.shipping4_1')}</li>
          <li>{t('cust.shipping4_2')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.shippingH5')}</h3>
        <p>{t('cust.shipping5Intro')}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.shipping5_1')}</li>
          <li>{t('cust.shipping5_2')}</li>
          <li>{t('cust.shipping5_3')}</li>
          <li>{t('cust.shipping5_4')}</li>
          <li>{t('cust.shipping5_5')}</li>
        </ul>
      </div>
    </div>
  );
}

function Returns() {
  const { t } = useLanguage();
  return (
    <div>
      <SectionTitle>{t('cust.returnsTitle')}</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>{t('cust.returnsIntro')}</p>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH1')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returns1_1')}</li>
          <li>{t('cust.returns1_2')}</li>
          <li>{t('cust.returns1_3')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH_Cancel')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returnsCancel1')}</li>
          <li>{t('cust.returnsCancel2')}</li>
          <li>{t('cust.returnsCancel3')}</li>
          <li>{t('cust.returnsCancel4')}</li>
          <li>{t('cust.returnsCancel5')}</li>
          <li>{t('cust.returnsCancel6')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH2')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returns2_1')}</li>
          <li>{t('cust.returns2_2')}</li>
          <li>{t('cust.returns2_3')}</li>
          <li>{t('cust.returns2_4')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH3')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returns3_1')}</li>
          <li>{t('cust.returns3_2')}</li>
          <li>{t('cust.returns3_3')}</li>
          <li>{t('cust.returns3_4')}</li>
          <li>{t('cust.returns3_5')}</li>
          <li>{t('cust.returns3_6')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH4')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returns4_1')}</li>
          <li>{t('cust.returns4_2')}</li>
          <li>{t('cust.returns4_3')}</li>
          <li>{t('cust.returns4_4')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH5')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returns5_1')}</li>
          <li>{t('cust.returns5_2')}</li>
          <li>{t('cust.returns5_3')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH6')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returns6_1')}</li>
          <li>{t('cust.returns6_2')}</li>
          <li>{t('cust.returns6_3')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH7')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('cust.returns7_1')}</li>
          <li>{t('cust.returns7_2')}</li>
          <li>{t('cust.returns7_3')}</li>
          <li>{t('cust.returns7_4')}</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">{t('cust.returnsH8')}</h3>
        <p>{t('cust.returns8Intro')}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>{t('cust.returns8_1')}</strong> +91 88868 88128</li>
          <li><strong>{t('cust.returns8_2')}</strong> svlnmobiles12@gmail.com</li>
          <li><strong>{t('cust.returns8_3')}</strong> {t('cust.storeHoursValue')}</li>
        </ul>
      </div>
    </div>
  );
}
