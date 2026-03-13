import account from "./account";
import session from "./session";
import user from "./user";
import verification from "./verification";

export default {
  user: { schema: user },
  session: { schema: session },
  account: { schema: account },
  verification: { schema: verification },
};
