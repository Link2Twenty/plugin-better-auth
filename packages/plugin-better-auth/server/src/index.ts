import config from "./config";
import controllers from "./controllers";
import register from "./register";

export default {
  controllers,
  register,
  config,
  // Needed if you want to create routes in the plugin extensions folder.
  routes: {},
};
