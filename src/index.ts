import getAiData from "./getAiData";
import getAllTrendingWithReasons from "./getAllTrendingWithReasons";
import sendSlackMessage from "./sendSlackMessage";

const results = await getAllTrendingWithReasons();
const data = await getAiData(results);
await sendSlackMessage("U0875J5QQDP", data);
