import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

// Tells MCP clients where our authorization, token, and registration endpoints are.
export const GET = oAuthDiscoveryMetadata(auth);
