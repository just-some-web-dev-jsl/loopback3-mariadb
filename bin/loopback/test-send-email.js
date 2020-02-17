'use strict';

const app = require('../../server/server');
const dsConfig = require('../../server/datasources.development');
const emailAddress = dsConfig.emailDs.transports[0].auth.user;

app.models.Email.send(
  {
    to: 'TEST_EMAIL_ADDRESS',
    from: emailAddress,
    subject: 'Test email message',
    text: '<strong>HTML</strong> tags are not converted',
    html: '<strong>HTML</strong> tags are converted',
  },
  function(err) {
    if (err) throw err;
    console.log('> email sent successfully.');
    process.exit();
  }
);
