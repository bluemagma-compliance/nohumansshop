import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

// Points MCP clients at the authorization server protecting this resource (our MCP).
export const GET = oAuthProtectedResourceMetadata(auth);
