import { App } from "@slack/bolt";

const slack = new App({
  token: Bun.env.SLACK_BOT_TOKEN,
  appToken: Bun.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const sendSlackMessage = async (userId: string, markdown: string) => {
  await slack.client.chat.postMessage({
    channel: userId,
    text: markdown,
  });
};

export default sendSlackMessage;
