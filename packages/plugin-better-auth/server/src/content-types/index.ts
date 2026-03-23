import account from "./account";
import permission from "./permission";
import role from "./role";
import session from "./session";
import user from "./user";
import verification from "./verification";

export default {
  user: { schema: user },
  session: { schema: session },
  account: { schema: account },
  verification: { schema: verification },
  role: { schema: role },
  permission: { schema: permission },
};
