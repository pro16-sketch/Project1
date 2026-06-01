
async function testGemini() {
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash"];
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=AIzaSyDI2JEx-X_RMpR2a7mrA1wLxifwibq-BkU`;
    console.log("--- Testing Model:", model, "---");
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
      });
      const data = await res.json();
      console.log("Status:", res.status);
      if (res.status === 200) {
        console.log("SUCCESS!");
        break;
      } else {
        console.log("Message:", data.error?.message || "No error message");
      }
    } catch (e) {
      console.error("Error:", e);
    }
  }
}

testGemini();
