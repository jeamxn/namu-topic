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

// VERTEX_DNS_MAPPING은 DNS 차원 매핑(예: asia-northeast3-aiplatform.googleapis.com=10.37.1.100)
// → 코드에서 HTTP baseUrl로 강제하지 않음. 도커의 extra_hosts나 호스트 파일로 해결할 것.
// (예전 코드에서 baseUrl로 박으면 IP에 직접 붙어서 TLS/라우팅 실패함)
void dnsMappingRaw;

const ai = new GoogleGenAI({
  vertexai: true,
  project: projectId,
  location,
  googleAuthOptions: { credentials },
});

export const VERTEX_MODEL = Bun.env.VERTEX_MODEL || "gemini-3.1-flash-lite";

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
