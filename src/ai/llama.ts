export async function llamaHandler(
  request: Request,
  env: any,
): Promise<Response> {
  try {
    // --- プロンプト抽出 ---
    let userPrompt: string | null = null;

    if (request.method === "POST") {
      const body = await request.clone().json();
      userPrompt = body.prompt || null;
    } else {
      const url = new URL(request.url);
      userPrompt = url.searchParams.get("q");
    }

    if (!userPrompt) {
      return new Response("Missing prompt", { status: 400 });
    }

    const acceptLang = (request.headers.get("accept-language") || "").toLowerCase();

    let systemPrompt = "You are a helpful assistant.";

    if (acceptLang.startsWith("ja")) {
      systemPrompt = "あなたは日本語で会話するアシスタントです。";
    } else if (acceptLang.startsWith("en")) {
      systemPrompt = "You are an assistant that responds in English.";
    } else if (acceptLang.startsWith("es")) {
      systemPrompt = "Eres un asistente que responde en español.";
    } else if (acceptLang.startsWith("de")) {
      systemPrompt = "Du bist ein Assistent, der auf Deutsch antwortet.";
    } else if (acceptLang.startsWith("it")) {
      systemPrompt = "Sei un assistente che risponde in italiano.";
    } else if (acceptLang.startsWith("fr")) {
      systemPrompt = "Vous êtes un assistant qui répond en français.";
    }

    // --- AI呼び出し ---
    const chat = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };

    const response = await env.AI.run(
      "@cf/meta/llama-3-8b-instruct",
      chat
    );

    return Response.json(response);
  } catch (err: any) {
    return new Response(
      `Llama Worker error: ${(err && err.message) || String(err)}`,
      { status: 500 }
    );
  }
}