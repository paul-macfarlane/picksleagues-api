import axios from "axios";
import { ESPNRefList } from "../models/shared/types";

export async function getAllRefUrlsFromESPNListUrl(
  listUrl: string,
): Promise<string[]> {
  let response = await axios.get<ESPNRefList>(`${listUrl}&page=${1}`);

  let refs = response.data.items.map((item) => item.$ref);
  while (response.data.pageIndex < response.data.pageCount) {
    response = await axios.get<ESPNRefList>(
      `${listUrl.replace("http://", "https://")}&page=${
        response.data.pageIndex + 1
      }`,
    );

    refs = [...refs, ...response.data.items.map((item) => item.$ref)];
  }

  return refs;
}
