import { Api } from "../services/Api.js";

export function useApi() {
  return new Api();
}
