import type { Context, Request } from "koa";

interface KoaRequest<RequestBody = unknown> extends Request {
  body?: RequestBody;
}

export interface KoaContext<RequestBody = unknown, ResponseBody = unknown>
  extends Context {
  request: KoaRequest<RequestBody>;
  body: ResponseBody;
}

export interface KoaResponseContext<ResponseBody>
  extends KoaContext<unknown, ResponseBody> {}
