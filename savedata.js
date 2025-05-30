// saveEmailData.js
const fs = require('fs');
const path = require('path');
const { getEmails } = require('./src/utils/api');

async function saveEmailData(filename = 'emailData.json') {
  try {
    const response = await getEmails();

    if (!response || !Array.isArray(response.data)) {
      throw new Error('Expected an array of emails in response.data.');
    }

    const emailArray = response.data;
    const filePath = path.join(__dirname, filename);
    const jsonData = JSON.stringify(emailArray, null, 2); // pretty print

    fs.writeFileSync(filePath, jsonData, 'utf8');
    console.log(`Email data saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving email data:', error.message);
  }
}

saveEmailData();
