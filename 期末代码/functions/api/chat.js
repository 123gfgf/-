export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const message = (body.message || '').trim().slice(0, 2000);
  if (!message) return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const system = (
    '你是王占帅的个人AI助手。请围绕戏剧与影视以及新媒体创作相关问题，进行专业、准确且有发散思维的回答；' +
    '可结合研究方法、田野调查、民族影像、短视频/微综艺创作、镜头语言、剪辑与声音设计、产业与传播等主题提出结构化建议或步骤；' +
    '回答要求：直接作答、中文、结构清晰，不做冗长寒暄。'
  );
  const payload = {
    model: env.DEEPSEEK_MODEL || 'deepseek-chat',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: message }
    ],
    temperature: 0.85,
    top_p: 0.9,
    max_tokens: 800
  };
  const url = env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const key = env.DEEPSEEK_API_KEY || env.EEK_API_KEY;
  if (!key) {
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    return new Response(JSON.stringify({ error: 'no_key' }), { status: 500, headers });
  }
  let data = {};
  let res;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(payload) });
  } catch (e) {
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    return new Response(JSON.stringify({ error: 'network_error' }), { status: 502, headers });
  }
  if (!res.ok) {
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    const detail = await res.text().catch(() => '');
    return new Response(JSON.stringify({ error: 'bad_response', detail }), { status: res.status, headers });
  }
  data = await res.json().catch(() => ({}));
  const reply = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  return new Response(JSON.stringify({ reply }), { status: 200, headers });
}
