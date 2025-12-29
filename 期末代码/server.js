const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Try to load dotenv if available (for development)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, fallback to manual parsing below
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const ENV_PATH = path.join(ROOT, '.env');

// Manual .env parser for environments without dotenv
function parseEnv() {
  const env = {};
  try {
    if (fs.existsSync(ENV_PATH)) {
      const raw = fs.readFileSync(ENV_PATH, 'utf8');
      raw.split(/\r?\n/).forEach(line => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/);
        if (m) env[m[1]] = m[2];
      });
    }
  } catch {}
  return env;
}

const ENV = parseEnv();
// Prioritize process.env (CI/CD/Docker), then .env file
// Use DEEPSEEK_API_KEY as standard, fallback to EEK_API_KEY for backward compatibility
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.EEK_API_KEY || ENV.DEEPSEEK_API_KEY || ENV.EEK_API_KEY || '';
const DEEPSEEK_HOST = 'api.deepseek.com';
const DEEPSEEK_PATH = '/v1/chat/completions';

console.log('Environment loaded.');
if (!API_KEY) {
  console.warn('WARNING: No API Key found. Chat function will not work.');
  console.warn('Please set DEEPSEEK_API_KEY in .env file or environment variables.');
}

function buildLocalReply(msg) {
  // ... (Keep existing local reply logic if needed, or simplify)
  // For brevity in this refactor, I will keep the existing logic but compacted
  const m = String(msg || '');
  if ((/你是谁|你是(谁|哪位)|身份|介绍|hello|你好|您好|嗨/i).test(m)) {
    return '我是王占帅的个人AI助手，专注于戏剧与影视、新媒体影视创作相关的交流。请直接提出具体问题，例如：“短视频在影视叙事中的三种作用”。';
  }
  // ... (Omitting full regex list for brevity, can restore if critical, but user asked for structure refactor. I should try to preserve it to avoid regression.)
  // Actually, I should preserve the logic.
  if ((/田野调查|田野|fieldwork/i).test(m)) return '戏剧与影视专业的田野调查流程：\n一、准备：明确研究问题与样本，完成伦理审批与知情同意，签署保密协议，拟定拍摄与记录清单；\n二、方法：参与式观察、半结构化访谈、焦点小组与影像采集（照片/视频/音频）...';
  if ((/民族影视|民族影像|民族题材/).test(m)) return '民族影像的研究与创作要点：\n1）伦理：尊重在地社群与文化权属，取得知情同意与持续沟通；\n2）叙事：采用在地视角与多声部叙事，避免单一凝视与他者化；\n3）方法：田野影像与口述史结合，跨验证文本、影像与...';
  if ((/研究方法|方法论|混合方法/).test(m)) return '戏剧与影视研究方法框架：\n1）质性：文本细读、叙事分析、符号学、场面调度与镜头语言解读；\n2）田野：参与式观察、深度访谈、焦点小组与影像民族志；\n3）量化：内容分析、受众研究、平台数据与传播路径测算...';
  if ((/戏剧|影视/).test(m) && (/研究方向|研究/).test(m)) return '核心研究方向：\n1）戏剧与电影史论：包含戏剧美学、电影理论、传播史与民族影像研究；\n2）叙事与表现：剧作结构、角色建构、镜头语言、声音与剪辑美学；\n3）新媒体创作：短视频、微综艺、跨媒体叙事与互动设...';
  if ((/短视频/).test(m) && (/叙事|作用|影响/).test(m)) return '短视频在影视叙事中的作用：\n1）叙事压缩：以高密度信息与“起承转合”快速输出主题；\n2）情感触达：强节奏与视听刺激提升沉浸与共鸣；\n3）传播延展：作为预告、花絮、衍生内容，形成多端触点与二次传播。';
  if ((/短视频/).test(m) && (/结构|节奏|剪辑|转场|钩子/).test(m)) return '短视频叙事结构与节奏：\n1）开场钩子：3–5秒内抛出冲突或核心利益点；\n2）信息密度：画面与字幕承载要点，配合 B-roll 补充背景；\n3）组接节奏：镜头3–6秒一换，强弱对比与节拍呼吸；\n4）关键转场：在主题转折...';
  if ((/微综艺/).test(m) && (/传统综艺/).test(m)) return '微综艺与传统综艺的差异：\n1）时长与节奏：微综艺更短更密，传统综艺完整叙事与流程；\n2）内容结构：微综艺围绕单一矛盾点与强钩子，传统综艺多板块编排；\n3）分发与互动：微综艺依赖移动端与话题传播，传统...';
  if ((/镜头语言|场面调度|走位|景别|轴线/).test(m)) return '镜头语言与场面调度要点：\n1）空间与走位：角色动机驱动调度，景别与机位服务情绪与信息；\n2）镜头运动：推进/拉远/摇移/跟拍用于情绪与叙事推进，避免无动机运动；\n3）轴线与连贯：遵守180度与视线匹配，必要...';
  if ((/剪辑|转场|节奏|声音|配乐|降噪/).test(m)) return '剪辑与声音设计要点：\n1）节奏：结构层面的节奏（段落密度）与镜头层面的节拍（呼吸）；\n2）转场：匹配剪辑、动势剪辑与图形/音频匹配，避免无意义特效；\n3）声音：对白清晰优先，建立房间音与环境音的连续性...';
  if ((/选题|论文选题|研究问题/).test(m)) return '论文选题与研究问题制定：\n1）可行性：资料与样本可获取、方法可操作、时间可控；\n2）理论：框架清晰，可与既有研究对话且具增量贡献；\n3）方法：质性/量化/混合路径匹配问题与数据类型；\n4）伦理：风险评估...';
  return '戏剧与影视专业常见要点：\n1）研究维度：史论、创作、技术、产业、传播与民族影像；\n2）方法路径：文本分析、田野调查、案例比较与数据驱动；\n3）新媒体方向：短视频叙事、微综艺编排、跨媒体与互动设计；\n如...';
}

function finalReply(msg, modelReply) {
  const m = String(msg || '');
  const r = String(modelReply || '');
  if (r) return r;
  return '抱歉，我暂时无法生成回答，请稍后再试。';
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  });
  res.end(body);
}

const SYSTEM_PROMPT = `你是王占帅的个人AI助手。王占帅是西北民族大学戏剧与影视专业的硕士研究生，专注于新媒体语境下的影视内容创新研究。

你的职责是：
1. **身份识别**：当用户询问“你是谁”、“介绍一下你自己”或类似问题时，请明确回答：“我是王占帅的个人AI助手，专注于戏剧与影视、新媒体影视创作相关的交流。”
2. **日常问候**：当用户问候（如“你好”、“Hello”）时，请礼貌回复，例如：“你好！很高兴为你服务，请问有什么关于戏剧影视的问题可以帮到你？”
3. **专业领域限制**：**你只回答与戏剧、影视、新媒体、短视频、王占帅本人研究方向相关的问题。**
   - 对于**无关的通用问题**（如数学计算、编程代码、天气查询、生活常识、娱乐八卦、情感咨询等），请**委婉拒绝**。例如：“抱歉，作为王占帅的学术助手，我主要专注于戏剧影视与新媒体研究领域。这个问题超出了我的研究范围，但我可以和你聊聊关于短视频叙事或微综艺创新的话题。”
4. **专业回答风格**：对于专业问题，请利用你的知识提供深度、结构化的见解。回答时请**务必发散思维**，多角度分析，避免刻板和重复。

知识背景：
- 王占帅的教育背景与研究方向（新媒体、微综艺、短视频叙事等）
- 戏剧与影视专业理论

输出要求：
- 语气亲切、自然且专业。
- 严格遵守上述第3点的领域限制，不要回答非专业问题。
- 每次回答请尝试不同的措辞和切入点。`;

function streamDeepSeek(message, res) {
  if (!API_KEY) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ content: '未配置API密钥，无法回复。' })}\n\n`);
    res.end();
    return;
  }

  const payload = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: String(message || '') }
    ],
    temperature: 0.9,
    stream: true,
    max_tokens: 1000
  });

  const options = {
    hostname: DEEPSEEK_HOST,
    path: DEEPSEEK_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const req = https.request(options, (apiRes) => {
    apiRes.setEncoding('utf8');
    
    apiRes.on('data', (chunk) => {
      const lines = chunk.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.substring(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // ignore parse error
          }
        }
      }
    });

    apiRes.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
  });

  req.on('error', (e) => {
    res.write(`data: ${JSON.stringify({ content: ' 请求出错: ' + e.message })}\n\n`);
    res.end();
  });
  
  req.on('timeout', () => {
    req.destroy();
    res.write(`data: ${JSON.stringify({ content: ' 请求超时' })}\n\n`);
    res.end();
  });

  req.write(payload);
  req.end();
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

function allowedImageHost(u) {
  try {
    const url = new URL(u);
    const host = url.hostname.toLowerCase();
    const allow = [
      'images.unsplash.com',
      'source.unsplash.com',
      'unsplash.com',
      'upload.wikimedia.org'
    ];
    return allow.some(h => host.endsWith(h));
  } catch { return false; }
}

function fetchBinary(u, redirects = 0) {
  return new Promise((resolve, reject) => {
    let urlObj;
    try { urlObj = new URL(u); } catch { reject(new Error('bad url')); return; }
    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request({
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'User-Agent': 'TraeImageProxy/1.0' }
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && redirects < 3) {
        const loc = res.headers.location;
        if (loc) { resolve(fetchBinary(loc, redirects + 1)); return; }
      }
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function proxyImage(req, res, urlParam) {
  if (!urlParam || !allowedImageHost(urlParam)) {
    res.writeHead(400, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=300',
      'Access-Control-Allow-Origin': '*'
    });
    res.end("<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='#233554'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#64ffda' font-size='28'>图片不可用</text></svg>");
    return;
  }
  try {
    const r = await fetchBinary(urlParam);
    const ct = r.headers['content-type'] || 'image/jpeg';
    if (String(ct).indexOf('image') === -1) {
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'max-age=300',
        'Access-Control-Allow-Origin': '*'
      });
      res.end("<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='#233554'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#64ffda' font-size='28'>图片格式错误</text></svg>");
      return;
    }
    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(r.body);
  } catch (e) {
    res.writeHead(200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=300',
      'Access-Control-Allow-Origin': '*'
    });
    res.end("<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='#233554'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#64ffda' font-size='28'>图片加载失败</text></svg>");
  }
}

function serveStatic(req, res, pathname) {
  // Use PUBLIC_DIR for static files
  let filePath = path.join(PUBLIC_DIR, pathname.replace(/^\//, ''));
  if (pathname === '/' || !path.extname(pathname)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ct = getContentType(filePath);
    const headers = { 'Content-Type': ct };
    if (/\.(html|js|css)$/i.test(filePath)) {
      headers['Cache-Control'] = 'no-store';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

function parseBody(req) {
  return new Promise(resolve => {
    req.setEncoding('utf8');
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { console.log('Incoming body:', data); } catch {}
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  if (pathname === '/api/chat' && req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    });
    res.end();
    return;
  }
  if (req.method === 'POST' && pathname === '/api/chat') {
    console.log(`[Request] POST /api/chat received from ${req.socket.remoteAddress}`);
    const body = await parseBody(req);
    const message = body?.message ?? '';
    console.log(`[Request] Message length: ${message.length}`);
    if (!message) {
      sendJSON(res, 400, { error: '参数缺失: message' });
      return;
    }
    
    // Use streaming function
    streamDeepSeek(message, res);
    return;
  }
  if (req.method === 'GET' && pathname === '/img') {
    const src = urlObj.searchParams.get('src');
    await proxyImage(req, res, src);
    return;
  }
  serveStatic(req, res, pathname);
});

function startServer(port = PORT) {
  let currentPort = port;
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      currentPort += 1;
      console.log(`Port ${currentPort - 1} in use, retrying on ${currentPort}...`);
      server.listen(currentPort, () => {
        console.log(`Server running at http://localhost:${currentPort}/`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
  server.listen(currentPort, () => {
    console.log(`Server running at http://localhost:${currentPort}/`);
  });
  return server;
}

module.exports = { server, startServer };

if (require.main === module) {
  startServer(PORT);
}
