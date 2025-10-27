const bcrypt = require('bcryptjs');

const hashInDB = '$2b$10$34BIu/HqL/MRMJ1cveryGeg.lSNC/6fIZt90MFb7RCw8vOxu3JXmy';
const passwordTry = 'admin123';

(async () => {
  const match = await bcrypt.compare(passwordTry, hashInDB);
  console.log('Match:', match);
})();
