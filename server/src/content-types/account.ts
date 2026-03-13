export default {
  "kind": "collectionType",
  "collectionName": "better_auth_accounts",
  "info": {
    "singularName": "account",
    "pluralName": "accounts",
    "displayName": "Accounts",
    "description": "Better Auth account"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {
    "content-manager": {
      "visible": false
    },
    "content-type-builder": {
      "visible": false
    }
  },
  "attributes": {
    "accountId": {
      "type": "string",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      },
      "required": true
    },
    "providerId": {
      "type": "string",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      },
      "required": true
    },
    "userId": {
      "type": "integer",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      },
      "required": true
    },
    "accessToken": {
      "type": "text",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "refreshToken": {
      "type": "text",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "idToken": {
      "type": "text",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "accessTokenExpiresAt": {
      "type": "datetime",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "refreshTokenExpiresAt": {
      "type": "datetime",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "scope": {
      "type": "string",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "password": {
      "type": "string",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    }
  }
};
