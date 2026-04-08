(async () => {
  try {
    console.log("Attempting to import server/index.js...");
    // Using .js extension as required by Node ESM
    await import("./server/index.js");
  } catch (err: any) {
    console.log("--- FULL ERROR ---");
    console.log("Name:", err.name);
    console.log("Code:", err.code);
    console.log("Message:", err.message);
    if (err.url) console.log("URL:", err.url);
    if (err.stack) console.log("Stack:", err.stack);
    console.log("--- END ERROR ---");
  }
})();
