export async function GET() {
  const apiKey = process.env.E2B_API_KEY;
  const templateID = process.env.E2B_TEMPLATE_ID;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key missing" }), {
      status: 500,
    });
  }

  try {
    const response = await fetch("https://api.e2b.dev/sandboxes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ templateID: templateID }),
    });
    if (response.status === 201) {
      return new Response(
        JSON.stringify({ status: "operational", code: response.status }),
        {
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          status: "down",
          code: response.status,
          error: await response.text(),
        }),
        {
          status: 500,
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to connect to E2B API" }),
      { status: 500 }
    );
  }
}
