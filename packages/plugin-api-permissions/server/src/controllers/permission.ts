import type { Context } from "koa";
import { getPluginService } from "../utils";

export default () => ({
  async layout(ctx: Context) {
    const layout = getPluginService("permission").getPermissionsLayout();
    ctx.send({ data: { conditions: [], sections: layout } });
  },
});
