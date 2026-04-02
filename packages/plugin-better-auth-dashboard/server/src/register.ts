import { getPluginService } from "./utils";

export default async () => {
  await getPluginService("crypto").setKeyPair();
};