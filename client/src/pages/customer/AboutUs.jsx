import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';
import { Store, Smartphone, Home, Tv, BadgeCheck, ShieldCheck, CreditCard, RotateCcw, Truck, IndianRupee, Languages, Phone, MessageCircle, Clock, MapPin, CheckCircle2 } from 'lucide-react';

export default function AboutUs() {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SEO
        title="About Us"
        description="Hello Mobiles — trusted mobile phone and electronics store in Nellore district, Andhra Pradesh. Wide range of smartphones, laptops, TVs, and gadgets with EMI options."
        path="/about"
      />

      <div className="gold-gradient rounded-2xl text-white text-center px-6 py-12 mb-10 shadow-lg">
        <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutUs')}</h1>
        <p className="text-white/90 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">{t('cust.aboutHeroSub')}</p>
      </div>

      <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-10">
        <h2 className="text-2xl font-bold gold-text mb-4 pb-3 border-b" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutStoryH')}</h2>
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4 leading-relaxed">
          <p>{t('cust.aboutStory1')}</p>
          <p>{t('cust.aboutStory2')}</p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold gold-text mb-6 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutStoresH')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-gold-500">
            <Store className="h-8 w-8 gold-text mb-3" />
            <h3 className="font-bold text-gray-800 mb-1">{t('comp.storeBuchi')}</h3>
            <p className="text-xs text-gray-500 mb-3">{t('comp.storeBuchiSub')}</p>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{t('cust.aboutStoreBuchiDesc')}</p>
            <p className="text-sm text-gray-800 font-medium">{t('cust.storeBuchiPhone')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('cust.storeBuchiHours')}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-gold-500">
            <Store className="h-8 w-8 gold-text mb-3" />
            <h3 className="font-bold text-gray-800 mb-1">{t('comp.storeAllur')}</h3>
            <p className="text-xs text-gray-500 mb-3">{t('comp.storeAllurSub')}</p>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{t('cust.aboutStoreAllurDesc')}</p>
            <p className="text-sm text-gray-800 font-medium">{t('cust.storeAllurPhone')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('cust.storeAllurHours')}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-gold-500">
            <Store className="h-8 w-8 gold-text mb-3" />
            <h3 className="font-bold text-gray-800 mb-1">{t('cust.storeAllurElectronics')}</h3>
            <p className="text-xs text-gray-500 mb-3">{t('comp.storeAllurSub')}</p>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{t('cust.aboutStoreAllurEFDesc')}</p>
            <p className="text-sm text-gray-800 font-medium">{t('cust.storeAllurElectronicsPhone')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('cust.storeAllurHours')}</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-10">
        <h2 className="text-2xl font-bold gold-text mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutOfferH')}</h2>
        <p className="text-gray-500 text-sm mb-6">{t('cust.aboutOfferIntro')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 bg-gold-50 rounded-xl p-4">
            <Smartphone className="h-6 w-6 gold-text flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">{t('cust.aboutOffer1')}</p>
          </div>
          <div className="flex items-start gap-3 bg-gold-50 rounded-xl p-4">
            <Home className="h-6 w-6 gold-text flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">{t('cust.aboutOffer2')}</p>
          </div>
          <div className="flex items-start gap-3 bg-gold-50 rounded-xl p-4">
            <Tv className="h-6 w-6 gold-text flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">{t('cust.aboutOffer3')}</p>
          </div>
          <div className="flex items-start gap-3 bg-gold-50 rounded-xl p-4">
            <BadgeCheck className="h-6 w-6 gold-text flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">{t('cust.aboutOffer4')}</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold gold-text mb-2 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutWhyH')}</h2>
        <p className="text-gray-500 text-sm text-center mb-6">{t('cust.aboutWhyIntro')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, key: 'cust.aboutWhy1' },
            { icon: CreditCard, key: 'cust.aboutWhy2' },
            { icon: RotateCcw, key: 'cust.aboutWhy3' },
            { icon: Truck, key: 'cust.aboutWhy4' },
            { icon: IndianRupee, key: 'cust.aboutWhy5' },
            { icon: Languages, key: 'cust.aboutWhy6' },
          ].map(({ icon: Icon, key }, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl shadow-sm p-4">
              <Icon className="h-6 w-6 gold-text flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">{t(key)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-10">
        <h2 className="text-2xl font-bold gold-text mb-4 pb-3 border-b" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutDeliveryH')}</h2>
        <div className="flex items-start gap-3">
          <MapPin className="h-6 w-6 gold-text flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-relaxed">{t('cust.aboutDeliveryP')}</p>
        </div>
      </section>

      <section className="gold-gradient rounded-2xl text-white p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-4 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.aboutContactH')}</h2>
        <p className="text-white/90 text-sm text-center max-w-2xl mx-auto mb-6 leading-relaxed">{t('cust.aboutContactP')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 rounded-xl p-4">
            <Phone className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-semibold">{t('cust.helpTitle')}</p>
            <p className="text-xs text-white/90 mt-2">{t('cust.helpVenkatesh')}</p>
            <p className="text-xs text-white/90">{t('cust.helpGowri')}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <MessageCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-semibold">{t('cust.storeWhatsapp')}</p>
            <p className="text-xs text-white/90 mt-2">{t('cust.whatsappSupport')}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <Clock className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-semibold">{t('cust.storeHours')}</p>
            <p className="text-xs text-white/90 mt-2">{t('cust.storeHoursValue')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
