import { defineConfig } from "vite";
import commonConfig from "./vite.config.common.js";
export default ({ mode }) => {
  return defineConfig(commonConfig(mode));
};
