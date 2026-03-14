export default {
  "kind": "collectionType",
  "collectionName": "better_auth_sessions",
  "info": {
    "singularName": "session",
    "pluralName": "sessions",
    "displayName": "Sessions",
    "description": "Better Auth session"
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
    "expiresAt": {
      "type": "datetime",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      },
      "required": true
    },
    "token": {
      "type": "string",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      },
      "required": true,
      "unique": true
    },
    "ipAddress": {
      "type": "string",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "userAgent": {
      "type": "string",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      }
    },
    "userId": {
      "type": "integer",
      "pluginOptions": {
        "better-auth": {
          "managed": true
        }
      },
      "required": true
    }
  }
};
