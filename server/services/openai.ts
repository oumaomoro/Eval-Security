import memoize from "memoizee";
import { AIGateway } from "./AIGateway.js";

// Cache AI responses 60 min to reduce latency and cost
export const cachedCompletion = memoize(
  (params: any) => AIGateway.createCompletion(params),
  { promise: true, maxAge: 3600000, normalizer: (args: any[]) => JSON.stringify(args) }
);
