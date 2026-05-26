import { GoogleGenAI } from "@google/genai";

// 환경변수에서 GCP 서비스 계정 자격 증명 구성
const projectId = Bun.env.VERTEX_PROJECT_ID;
const location = Bun.env.VERTEX_LOCATION || "global";
const clientEmail = Bun.env.VERTEX_CLIENT_EMAIL;
const clientId = Bun.env.VERTEX_CLIENT_ID;
const clientX509CertUrl = Bun.env.VERTEX_CLIENT_X509_CERT_URL;
const privateKeyId = Bun.env.VERTEX_PRIVATE_KEY_ID;

// PRIVATE KEY 로딩: base64(권장) → 평문(레거시) 순서로 시도
const decodePrivateKey = (): string => {
  const b64 = Bun.env.VERTEX_PRIVATE_KEY_B64;
  if (b64) {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  const raw = Bun.env.VERTEX_PRIVATE_KEY ?? "";
  // .env 에서 \n 으로 이스케이프된 줄바꿈을 실제 줄바꿈으로 복원
  return raw.replace(/\\n/g, "\n");
};
const privateKey = decodePrivateKey();
const dnsMappingRaw = Bun.env.VERTEX_DNS_MAPPING;

if (!projectId) {
  throw new Error("VERTEX_PROJECT_ID 환경변수가 필요합니다.");
}
if (!clientEmail || !privateKey) {
  throw new Error("VERTEX_CLIENT_EMAIL / VERTEX_PRIVATE_KEY 환경변수가 필요합니다.");
}

// 서비스 계정 JSON 형태로 구성
const credentials = {
  type: "service_account" as const,
  project_id: projectId,
  private_key_id: privateKeyId,
  private_key: privateKey,
  client_email: clientEmail,
  client_id: clientId,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: clientX509CertUrl,
  universe_domain: "googleapis.com",
};

// 선택: 사설 엔드포인트 매핑 (VERTEX_DNS_MAPPING="aiplatform.googleapis.com=custom.endpoint.example.com")
let httpOptions: { baseUrl?: string } | undefined;
if (dnsMappingRaw) {
  try {
    // JSON 형태 ({"aiplatform.googleapis.com":"my-endpoint"})
    const parsed = JSON.parse(dnsMappingRaw);
    const target = parsed?.["aiplatform.googleapis.com"] || parsed?.aiplatform;
    if (target) {
      httpOptions = { baseUrl: target.startsWith("http") ? target : `https://${target}` };
    }
  } catch {
    // key=value;key=value 형태
    const entries = dnsMappingRaw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    for (const e of entries) {
      const [k, v] = e.split("=").map((s) => s?.trim());
      if (k && v && k.includes("aiplatform")) {
        httpOptions = { baseUrl: v.startsWith("http") ? v : `https://${v}` };
        break;
      }
    }
  }
}

const ai = new GoogleGenAI({
  vertexai: true,
  project: projectId,
  location,
  googleAuthOptions: { credentials },
  ...(httpOptions ? { httpOptions } : {}),
});

export const VERTEX_MODEL = Bun.env.VERTEX_MODEL || "gemini-2.5-flash";

export interface ChatMessage {
  system: string;
  user: string;
}

/**
 * Vertex AI Gemini로 텍스트 생성. system + user 메시지를 받아 텍스트를 반환.
 */
export const generateText = async ({ system, user }: ChatMessage): Promise<string> => {
  const response = await ai.models.generateContent({
    model: VERTEX_MODEL,
    contents: [{ role: "user", parts: [{ text: user }] }],
    config: {
      systemInstruction: { parts: [{ text: system }] },
    },
  });

  return response.text ?? "";
};

export default ai;
