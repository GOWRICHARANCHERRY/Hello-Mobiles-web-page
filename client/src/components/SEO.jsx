import { Helmet } from 'react-helmet-async';

const SITE = 'https://hello-mobiles.com';
const DEFAULT_OG_IMAGE = `${SITE}/logo.png`;

export default function SEO({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  product = false,
  structuredData,
  noindex = false,
}) {
  const fullTitle = title ? `${title} | Hello Mobiles` : 'Hello Mobiles — Mobile Phones, Electronics & Gadgets in Nellore district';
  const fullUrl = `${SITE}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={fullUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Hello Mobiles" />

      <meta name="twitter:card" content={product ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}
