import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: Bun.env.OPENAI_API_KEY,
});

export default openai;
