export interface Config {
  table_prefix?: string;
}

const config: {
  default: Config;
  validator: (config: Config) => void;
} = {
  default: {
    table_prefix: "ba_",
  },
  validator(config) {
    if (config.table_prefix === undefined) return;

    if (
      typeof config.table_prefix !== "string" ||
      config.table_prefix.length === 0
    ) {
      throw new Error("table_prefix must be a non-empty string");
    }

    if (!/^[a-z][a-z0-9]*(_[a-z0-9]+)*_$/.test(config.table_prefix)) {
      throw new Error(
        'table_prefix must be snake_case and end with an underscore (e.g. "ba_")',
      );
    }
  },
};

export default config;
