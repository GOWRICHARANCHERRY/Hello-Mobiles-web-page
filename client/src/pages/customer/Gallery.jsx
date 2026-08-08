import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';
import { Camera, GalleryVertical, ImagePlus } from 'lucide-react';

export default function Gallery() {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SEO
        title={t('cust.galleryTitle')}
        description={t('cust.gallerySub')}
        path="/gallery"
      />

      <div className="gold-gradient rounded-2xl text-white text-center px-6 py-12 mb-10 shadow-lg">
        <Camera className="h-14 w-14 mx-auto mb-4" />
        <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cust.galleryTitle')}</h1>
        <p className="text-white/90 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">{t('cust.gallerySub')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GalleryVertical className="h-8 w-8 gold-text" />
          <ImagePlus className="h-6 w-6 gold-text" />
        </div>
        <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">{t('cust.gallerySoon')}</p>
      </div>
    </div>
  );
}
