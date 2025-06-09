export default {
	async fetch(request) {
		const { method } = request;

		if (method === 'GET') {
			return new Response(
				`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neko Links在线制作小工具</title>
  <style>
    body {
      font-family: sans-serif;
      padding: 2em;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 850px;
      width: 100%;
    }
    textarea {
      width: 800px;
      max-width: 100%;
    }
    button {
      margin-right: 1em;
      padding: 0.5em 1em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Singbox转换为Neko Links</h2>
    <textarea id="input" rows="15" placeholder="粘贴 Singbox JSON 数据"></textarea><br><br>
    <button id="convertBtn">转换为Neko Links</button>
    <button id="copyBtn">复制输出</button><br><br>
    <textarea id="output" rows="15" readonly placeholder="输出结果显示在这里"></textarea>
  </div>
  <script>
    document.getElementById('convertBtn').addEventListener('click', async () => {
      const input = document.getElementById('input').value;

      const response = await fetch('/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });

      if (response.ok) {
        const result = await response.text();
        document.getElementById('output').value = result;
      } else {
        alert('转换失败：输入格式可能有误');
      }
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
      const output = document.getElementById('output');
      output.select();
      document.execCommand('copy');
    });
  </script>
</body>
</html>`,
				{
					headers: {
						'content-type': 'text/html;charset=UTF-8',
					},
				}
			);
		} else if (method === 'POST' && new URL(request.url).pathname === '/convert') {
			try {
				const { input } = await request.json();

				const jsonData = JSON.parse(input);

				if (jsonData.tag && typeof jsonData.tag === 'string') {
					jsonData.tag = jsonData.tag.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, '').trim();
				}

				const jsonString = JSON.stringify(jsonData, null, 2);

				const final = {
					_v: 0,
					addr: '127.0.0.1',
					brutal_speed: 0,
					c_cfg: '',
					c_out: '',
					core: 'internal',
					cs: jsonString,
					cs_suffix: '',
					enable_brutal: false,
					mapping_port: 0,
					mux: 0,
					name: jsonData.tag,
					port: 1080,
					socks_port: 0,
				};
				const compactJson = JSON.stringify(final);

				const base64 =
					'nekoray://custom#' +
					btoa(new Uint8Array(new TextEncoder().encode(compactJson)).reduce((data, byte) => data + String.fromCharCode(byte), ''));

				return new Response(base64, {
					headers: { 'content-type': 'text/plain;charset=UTF-8' },
				});
			} catch (e) {
				return new Response('Invalid JSON', { status: 400 });
			}
		} else {
			return new Response('Method Not Allowed', { status: 405 });
		}
	},
};
