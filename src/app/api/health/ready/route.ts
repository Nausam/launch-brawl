import { GET as healthGET } from "../route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  url.searchParams.set("check", "readiness");
  return healthGET(new Request(url, { headers: request.headers }));
}
