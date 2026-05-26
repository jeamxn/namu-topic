import axios from "axios";

import type { FlareSolverrRequest, FlareSolverrResponse } from "./types"; // 위에서 만든 타입 import
import log from "./logger";

const FLARESOLVERR_URL = `${Bun.env.PROXY_URL}v1`;

const instance = async (targetUrl: string): Promise<FlareSolverrResponse["solution"]> => {
  const payload: FlareSolverrRequest = {
    cmd: "request.get",
    url: targetUrl,
  };
  try {
    const { data } = await axios.post<FlareSolverrResponse>(FLARESOLVERR_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (data.status === "ok") {
      return data.solution;
    } else {
      throw new Error(`FlareSolverr Error: ${data.message}`);
    }
  } catch (error: unknown) {
    log.error("http", "Request Failed", error);
    throw error;
  }
};

export default instance;
