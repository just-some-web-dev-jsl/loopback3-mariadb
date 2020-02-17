'use strict';

module.exports = {
  Admin: {
    dataSource: 'ummaDs',
    options: {
      realmRequired: false,
      restrictResetPasswordTokenScope: true,
      resetPasswordTokenTTL: 3600,
      emailVerificationRequired: true,
      caseSensitiveEmail: false,
      ttl: 2592000,
      maxTTL: 31556926,
      remoting: {
        sharedMethods: {
          '*': true,
        },
      },
    },
    public: true,
  },
  Buyer: {
    dataSource: 'ummaDs',
    options: {
      realmRequired: false,
      restrictResetPasswordTokenScope: true,
      resetPasswordTokenTTL: 3600,
      emailVerificationRequired: true,
      caseSensitiveEmail: false,
      ttl: 2592000,
      maxTTL: 31556926,
      remoting: {
        sharedMethods: {
          '*': true,
        },
      },
    },
    public: true,
  },
  Seller: {
    dataSource: 'ummaDs',
    options: {
      realmRequired: false,
      restrictResetPasswordTokenScope: true,
      resetPasswordTokenTTL: 3600,
      emailVerificationRequired: true,
      caseSensitiveEmail: false,
      ttl: 2592000,
      maxTTL: 31556926,
      remoting: {
        sharedMethods: {
          '*': true,
        },
      },
    },
    public: true,
  },
};
