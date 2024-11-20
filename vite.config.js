import { defineConfig } from "vite";
import commonConfig from "./vite.config.common";
export default ({ mode }) => {
  return defineConfig(commonConfig(mode));
};
