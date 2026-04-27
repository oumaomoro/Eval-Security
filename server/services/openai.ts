import memoize from "memoizee";
import { IntelligenceGateway } from "./IntelligenceGateway.js";

// Cache Intelligence responses 60 min to reduce latency and cost
export const cachedCompletion = memoize(
  (params: any) => IntelligenceGateway.createCompletion(params),
  { promise: true, maxAge: 3600000, normalizer: (args: any[]) => JSON.stringify(args) }
);
