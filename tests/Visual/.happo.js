import { RemoteBrowserTarget } from "happo.io";

export default {
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,

  targets: {
    "chrome-desktop": new RemoteBrowserTarget("chrome", {
      viewport: "1280x800",
    }),
  },
};
