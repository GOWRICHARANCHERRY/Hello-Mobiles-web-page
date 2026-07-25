import { Link } from 'react-router-dom';
import { useState } from 'react';

const sections = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms & Conditions' },
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'returns', label: 'Returns & Refunds' },
];

export default function TermsAndConditions() {
  const [active, setActive] = useState('privacy');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>Policies</h1>
        <p className="text-gray-500 mt-2">Please read our policies carefully before using our services</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <nav className="md:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24 space-y-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${active === s.id ? 'gold-gradient text-white' : 'text-gray-600 hover:bg-gold-50'}`}>
                {s.label}
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
  return (
    <div>
      <SectionTitle>Website Privacy Policy</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>This privacy policy sets out how <strong>Hello Mobiles & Electronics</strong> uses and protects any information that you give Hello Mobiles & Electronics when you use this website.</p>
        <p>Hello Mobiles & Electronics is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, then you can be assured that it will only be used in accordance with this privacy statement.</p>
        <p>Hello Mobiles & Electronics may change this policy from time to time by updating this page. You should check this page from time to time to ensure that you are happy with any changes.</p>

        <h3 className="font-bold text-gray-800 mt-6">What We Collect</h3>
        <p>We may collect the following information:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Name and contact details</li>
          <li>Contact information including email address</li>
          <li>Demographic information such as postcode, preferences, and interests</li>
          <li>Other information relevant to customer surveys and/or offers</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Types of Personal Information Collected</h3>
        <p>A User may have limited access to the Website and utilize some of the Services provided by Hello Mobiles without creating an account on the Website. Unregistered Users can access some of the information and details available on the Website. As part of the registration process, Hello Mobiles may collect the following categories of Personal Information from the Users (hereinafter collectively referred to as "User Information"):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Name</li>
          <li>User ID</li>
          <li>Email address</li>
          <li>Address (including country and postal code)</li>
          <li>Phone Number</li>
          <li>Gender and Age</li>
          <li>Any other information the User may volunteer</li>
        </ul>
        <p>Hello Mobiles may keep records of telephone calls received and made for making inquiries, orders, or other purposes for the purpose of administration of Services.</p>

        <h3 className="font-bold text-gray-800 mt-6">Purposes for Which Your Information May Be Used</h3>
        <p>Hello Mobiles will retain User Information only to the extent it is necessary to provide Services to the Users. The information which Hello Mobiles collects from you may be utilized for various business and/or regulatory purposes including for the following purposes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Registration of the User on the Website</li>
          <li>Processing the User's orders/requests and provision of Services</li>
          <li>Completing transactions with Users effectively and billing for the products/Services provided</li>
          <li>Technical administration and customization of Website</li>
          <li>Ensuring that the Website content is presented to the Users in an effective manner</li>
          <li>Delivery of personalized information and target advertisements to the User</li>
          <li>Improvement of Services, features, and functionality of the Website</li>
          <li>Research and development and for User administration (including conducting user surveys)</li>
          <li>Dealing with requests, enquiries, complaints, or disputes and other customer care related activities</li>
          <li>Communicate any changes in our Services or this Privacy Policy to the Users</li>
          <li>Verification of identity of Users and perform checks to prevent frauds</li>
          <li>Investigating, enforcing, resolving disputes, and applying our Terms of Use and Privacy Policy</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Security</h3>
        <p>We are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we have put in place suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online.</p>

        <h3 className="font-bold text-gray-800 mt-6">Cookies</h3>
        <p>A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyze web traffic or lets you know when you visit a particular site. Cookies allow web applications to respond to you as an individual. You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer.</p>

        <h3 className="font-bold text-gray-800 mt-6">Links to Other Websites</h3>
        <p>Our website may contain links to other websites of interest. However, once you have used these links to leave our site, you should note that we do not have any control over that other website. Therefore, we cannot be responsible for the protection and privacy of any information which you provide whilst visiting such sites and such sites are not governed by this privacy statement.</p>
      </div>
    </div>
  );
}

function Terms() {
  return (
    <div>
      <SectionTitle>Terms & Conditions</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>Welcome to Hello Mobiles & Electronics. These terms and conditions outline the rules and regulations for the use of our website and services.</p>
        <p>By accessing this website, we assume you accept these terms and conditions. Do not continue to use Hello Mobiles & Electronics if you do not agree to take all of the terms and conditions stated on this page.</p>

        <h3 className="font-bold text-gray-800 mt-6">1. General</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Hello Mobiles & Electronics is a retail store dealing in mobile phones, TVs, electronics products, furniture, and home appliances with physical stores in Allur and Buchi, Andhra Pradesh.</li>
          <li>By using our website and services, you confirm that you are at least 18 years of age or accessing the site under the supervision of a parent or legal guardian.</li>
          <li>We reserve the right to modify these terms at any time without prior notice. Changes will be effective immediately upon posting on the website.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">2. Products & Pricing</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>All product images are for illustration purposes only. Actual products may vary slightly in appearance.</li>
          <li>Prices displayed on the website are inclusive or exclusive of GST as indicated. We reserve the right to change prices without prior notice.</li>
          <li>In the event of a pricing error on a product, we reserve the right to cancel the order and refund the amount paid.</li>
          <li>Product availability is subject to stock and may change without notice.</li>
          <li>EMI options are available through our finance partners (Bajaj Finserv, TVS Credit, Chola Finance) and are subject to their respective terms and approval.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">3. Orders & Payment</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>An order placed on our website is an offer to purchase a product. We reserve the right to accept or reject any order at our sole discretion.</li>
          <li>Payment must be made at the time of placing the order through the available payment methods.</li>
          <li>We accept payments via UPI, credit/debit cards, net banking, EMI, and cash on delivery (where applicable).</li>
          <li>All transactions are processed through secure payment gateways and we do not store your card details.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">4. Exchange Offers</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Exchange values displayed on our website are indicative and based on the information provided by you about your old device.</li>
          <li>The final exchange value is determined after physical inspection of the device at our store.</li>
          <li>Hello Mobiles reserves the right to revise the exchange value based on the actual condition of the device.</li>
          <li>Exchange offers cannot be combined with certain promotional offers unless explicitly stated.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">5. User Accounts</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You agree to provide accurate, current, and complete information during registration.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">6. Intellectual Property</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>All content on this website including text, graphics, logos, images, and software is the property of Hello Mobiles & Electronics and is protected by applicable intellectual property laws.</li>
          <li>You may not reproduce, distribute, or create derivative works from any content without our express written permission.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">7. Limitation of Liability</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Hello Mobiles & Electronics shall not be liable for any indirect, incidental, or consequential damages arising out of the use of our products or services.</li>
          <li>Our total liability shall not exceed the purchase price of the product in question.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">8. Governing Law</h3>
        <p>These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Andhra Pradesh.</p>
      </div>
    </div>
  );
}

function Shipping() {
  return (
    <div>
      <SectionTitle>Shipping & Delivery Policy</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>This delivery and shipping policy sets out our policies and procedures towards delivery and shipping of products purchased on the Hello Mobiles & Electronics platform.</p>
        <p>We provide shipping and delivery of our products all over India. We aim to provide the best customer experience by partnering with leading logistics service providers to handle your order in the best possible way and to ensure that you have a hassle-free experience in receiving the product that you have ordered.</p>

        <h3 className="font-bold text-gray-800 mt-6">Shipping Terms</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>We partner with third-party logistic service providers to effectuate product shipping and delivery to you.</li>
          <li>Our standard dispatch timelines depend on the pin code to which delivery is made. You can understand the estimated timelines on the Product Detail Page once you enter the relevant delivery pin code.</li>
          <li>In any case, you will be provided with an estimated timeline for delivery of the product at the time of order confirmation.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Delivery Timelines</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Hyperlocal delivery (within 20 KM):</strong> Approximately 2 hours</li>
          <li><strong>Beyond 20 KM:</strong> Within 24 hours</li>
          <li>For remote areas, delivery may take additional 2-5 business days depending on pin code accessibility.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Delivery Areas</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Though we endeavour to ship and deliver our products all across India, we may, in our sole discretion, determine a select list of areas which are unserviceable for delivery of products.</li>
          <li>In the event an area has been deemed unserviceable, we shall notify you at the time of placing an order.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Your Responsibilities</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>You agree to ensure that all information submitted by you (name, shipping address, billing address, landmarks, contact details, etc.) is true, complete, accurate, and sufficient to identify the actual place of delivery.</li>
          <li>You shall bear absolute liability in case of any failure in delivering the purchased products due to your failure to provide correct, complete, or accurate information.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Delays</h3>
        <p>While we make reasonable endeavours to ensure timely delivery, you accept and acknowledge that the delivery may be delayed on account of:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Logistical issues beyond our control</li>
          <li>Unsuitable weather conditions</li>
          <li>Political disruptions, strikes, employee lockouts, etc.</li>
          <li>Acts of God such as floods, earthquakes, etc.</li>
          <li>Other unforeseeable circumstances</li>
        </ul>
      </div>
    </div>
  );
}

function Returns() {
  return (
    <div>
      <SectionTitle>Returns & Refunds</SectionTitle>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>We want you to be completely satisfied with your purchase from Hello Mobiles & Electronics. If for any reason you are not satisfied, we are here to help.</p>

        <h3 className="font-bold text-gray-800 mt-6">Return Policy</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>You may return most new, unopened items within <strong>7 days</strong> of delivery for a full refund.</li>
          <li>Items must be in their original packaging, unused, and in the same condition that you received them.</li>
          <li>A valid proof of purchase (receipt or order confirmation) is required for all returns.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Eligible for Return</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Products received in a damaged or defective condition</li>
          <li>Wrong product delivered (different from what was ordered)</li>
          <li>Products with manufacturing defects</li>
          <li>Accessories that are missing from the package</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Not Eligible for Return</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Products that have been used, activated, or registered</li>
          <li>Products without original packaging, tags, or accessories</li>
          <li>Products damaged due to misuse or normal wear and tear</li>
          <li>Software, screen protectors, cases, or other accessories once opened</li>
          <li>Products purchased during special promotional sales (clearly marked as non-returnable)</li>
          <li>Gift cards and downloadable software products</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Refund Process</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Once we receive your returned item, we will inspect it and notify you of the approval or rejection of your refund.</li>
          <li>If approved, your refund will be processed within <strong>5-7 business days</strong> to the original payment method.</li>
          <li>For COD orders, refunds will be made via bank transfer or store credit.</li>
          <li>Shipping charges are non-refundable unless the return is due to our error.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Exchange Policy</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>We offer product exchanges within <strong>7 days</strong> of delivery for products of equal or higher value.</li>
          <li>Price differences, if any, must be paid at the time of exchange.</li>
          <li>Exchange is subject to product availability at our store.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Warranty</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>All products come with the manufacturer's warranty as applicable.</li>
          <li>Hello Mobiles & Electronics facilitates warranty claims but is not responsible for manufacturer warranty terms.</li>
          <li>Warranty claims should be directed to the respective manufacturer or authorized service centers.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">How to Initiate a Return</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Contact us via WhatsApp at +91 88868 88128 or email at svlnmobiles12@gmail.com</li>
          <li>Provide your order number and reason for the return</li>
          <li>Our team will guide you through the return process</li>
          <li>For in-store purchases, please visit the store with the original receipt and product</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6">Contact Us</h3>
        <p>For any questions about returns and refunds, please contact us:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>WhatsApp:</strong> +91 88868 88128</li>
          <li><strong>Email:</strong> svlnmobiles12@gmail.com</li>
          <li><strong>Store Hours:</strong> 10:00 AM - 9:00 PM (All days)</li>
        </ul>
      </div>
    </div>
  );
}
