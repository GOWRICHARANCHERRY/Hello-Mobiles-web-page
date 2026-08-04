import customerEn from './customer-en';
import customerHi from './customer-hi';
import customerTe from './customer-te';
import componentEn from './component-en';
import componentHi from './component-hi';
import componentTe from './component-te';
import adminEn from './admin-en';
import adminHi from './admin-hi';
import adminTe from './admin-te';
import admin2En from './admin2-en';
import admin2Hi from './admin2-hi';
import admin2Te from './admin2-te';
import employeeEn from './employee-en';
import employeeHi from './employee-hi';
import employeeTe from './employee-te';

export default {
  en: { ...customerEn, ...componentEn, ...adminEn, ...admin2En, ...employeeEn },
  hi: { ...customerHi, ...componentHi, ...adminHi, ...admin2Hi, ...employeeHi },
  te: { ...customerTe, ...componentTe, ...adminTe, ...admin2Te, ...employeeTe },
};
