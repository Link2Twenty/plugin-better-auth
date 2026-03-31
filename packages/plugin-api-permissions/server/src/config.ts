import type { UID } from "@strapi/strapi";

export interface Config {
  user_uid?: UID.CollectionType;
}

const config: {
  default: Config,
  validator: () => void
} = {
  default: {
    user_uid: undefined,
  },
  validator() {},
};

export default config;
