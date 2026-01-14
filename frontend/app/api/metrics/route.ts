export function GET() {
  const body = "# Placeholder metrics\napp_up 1\n";
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; version=0.0.4" },
  });
}
