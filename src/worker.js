const MAX_INDEX = 99999; // 用于标记在文本框中只传入一个出站代理，而非多个出站代理

export default {
	async fetch(request) {
		const { method } = request;

		if (method === 'GET') {
			return new Response(htmlContent, {
				headers: {
					'content-type': 'text/html;charset=UTF-8',
				},
			});
		} else if (method === 'POST' && new URL(request.url).pathname === '/convert') {
			try {
				let { left, right } = await request.json();
				let host_port_array = [];

				if (left) {
					try {
						const regex = /([^\r\n]*)\r?\n|([^\r\n]+)$/g;
						let match;
						while ((match = regex.exec(left)) !== null) {
							const line = match[1] ?? match[2];
							const line_trim = line.trim();
							if (!line_trim) continue;

							const result = safeParseHostPort(line_trim);
							if (result?.host) host_port_array.push(result);
						}
					} catch (e) {
						console.error(`Error parsing "${input}":`, e.message);
					}
				}

				const jsonData = JSON.parse(right);
				const outbounds = jsonData.outbounds || [];
				let index = 0;

				if (outbounds.length == 0) {
					const nekolink = buildNekoLinks(jsonData, host_port_array, MAX_INDEX, 1);

					return new Response(nekolink, {
						headers: { 'content-type': 'text/plain;charset=UTF-8' },
						status: 200,
					});
				} else {
					const unwantedTypeSet = new Set(['direct', 'block', 'urltest', 'dns', 'selector', 'tor', '']);
					const filteredData = outbounds.filter((item) => !unwantedTypeSet.has(item.type || ''));
					let index_length = filteredData.length;

					let nekolinks = [];

					for (const outbound of filteredData) {
						index++;
						const base64 = buildNekoLinks(outbound, host_port_array, index, index_length);
						nekolinks.push(base64);
					}
					let joinStr = nekolinks.join('\n');

					return new Response(joinStr, {
						headers: { 'content-type': 'text/plain;charset=UTF-8' },
						status: 200,
					});
				}
			} catch (e) {
				return new Response('Invalid JSON', { status: 400 });
			}
		} else {
			return new Response('Method Not Allowed', { status: 405 });
		}
	},
};

function buildNekoLinks(jsonData, host_port_array, index, index_length) {
	const paddingLength_i = Math.ceil(Math.log10(host_port_array.length)) || 1;
	const paddingLength_index = Math.ceil(Math.log10(index_length)) || 1;
	const index_str = `【${String(index).padStart(paddingLength_index, '0')}】`;

	let results = [];

	if (host_port_array.length > 0) {
		let i = 0;
		host_port_array.forEach((item) => {
			let deepCopy = structuredClone(jsonData);
			if (item?.host) {
				i++;

				let name_str = `${String(deepCopy.type).replace(/\b\w/g, (c) => c.toUpperCase())} - Neko Links`;
				let i_str = String(i).padStart(paddingLength_i, '0');

				if (index === MAX_INDEX) {
					deepCopy.tag = `【0】-${i_str} ${name_str}`;
				} else {
					deepCopy.tag = `${index_str}-${i_str} ${name_str}`;
				}
				deepCopy.server = item.host;
				deepCopy.server_port = item.port;

				results.push(nekorayJSON(deepCopy));
			}
		});
	} else {
		let name_str = `${String(jsonData.type).replace(/\b\w/g, (c) => c.toUpperCase())} - Neko Links`;

		if (index === MAX_INDEX) {
			jsonData.tag = name_str;
		} else {
			jsonData.tag = `${index_str} ${name_str}`;
		}

		results.push(nekorayJSON(jsonData));
	}

	return results.join('\n');
}

function nekorayJSON(jsonData) {
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
	const result = 'nekoray://custom#' + base64Encode(compactJson);

	return result;
}

// base64编码
function base64Encode(str) {
	const encoder = new TextEncoder();
	const uint8Array = encoder.encode(str);

	let binary = '';
	const chunkSize = 0x8000;
	for (let i = 0; i < uint8Array.length; i += chunkSize) {
		binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}

function parseHostPortWithErrorHandling(input) {
	const defaultPorts = [443, 2053, 2083, 2087, 2096, 8443];

	const ipv6WithPortRegex = /^\[([a-fA-F0-9:]+)\]:(\d{1,5})/;
	const hostPortRegex = /^([a-zA-Z0-9.-]+):(\d{1,5})/;
	const hostCommaPortRegex = /^([a-zA-Z0-9.-]+),(\d{1,5})/;
	const hostOnlyRegex = /^([a-zA-Z0-9.-]+)$/;
	const ipv6OnlyRegex = /^([a-fA-F0-9:]+)$/;

	// [IPv6]:port
	let match = input.match(ipv6WithPortRegex);
	if (match) {
		const host = match[1];
		const port = parseInt(match[2], 10);
		if (port >= 80 && port <= 65535) {
			return { host, port };
		} else {
			return { host, port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)] };
		}
	}

	// host:port
	match = input.match(hostPortRegex);
	if (match) {
		const host = match[1];
		const port = parseInt(match[2], 10);
		if (port >= 80 && port <= 65535) {
			return { host, port };
		} else {
			return { host, port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)] };
		}
	}

	// host,port
	match = input.match(hostCommaPortRegex);
	if (match) {
		const host = match[1];
		const port = parseInt(match[2], 10);
		if (port >= 80 && port <= 65535) {
			return { host, port };
		} else {
			return { host, port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)] };
		}
	}

	// raw IPv6 (no port)
	match = input.match(ipv6OnlyRegex);
	if (match && input.includes(':')) {
		return {
			host: input,
			port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)],
		};
	}

	// host only
	match = input.match(hostOnlyRegex);
	if (match) {
		return {
			host: match[1],
			port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)],
		};
	}

	return null;
}

function safeParseHostPort(input) {
	try {
		const result = parseHostPortWithErrorHandling(input);

		if (!result) return { error: 'invalid format', raw: input };

		const validHost = (() => {
			// IPv6 检查（已匹配原始形式，允许冒号）
			if (result.host.includes(':')) {
				return /^[a-fA-F0-9:\[\]]+$/.test(result.host);
			}
			// IPv4 或域名检查（不允许下划线）
			return /^[a-zA-Z0-9.-]+$/.test(result.host);
		})();

		const validPort = Number.isInteger(result.port) && result.port >= 80 && result.port <= 65535;

		if (validHost && validPort) {
			return result;
		}

		return { error: 'invalid format', raw: input };
	} catch (e) {
		return { error: 'parsing failed', raw: input };
	}
}

const htmlContent = `<!DOCTYPE html>
<html>

<head>
	<meta charset="UTF-8">
	<title>Neko Links在线制作工具</title>
	<style>
		body {
			font-family: sans-serif;
			padding: 2em;
			display: flex;
			justify-content: center;
		}

		.container {
			display: flex;
			gap: 2em;
		}

		.footer {
			text-align: center;
			margin-top: 15px;
		}

		.left-box {
			width: 300px;
		}

		.right-box {
			width: 700px;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
		}

		textarea {
			width: 100%;
			height: 100%;
			resize: none;
			padding: 0.5em;
			box-sizing: border-box;
		}

		.input-area,
		.output-area {
			height: 45%;
		}

		.buttons {
			text-align: center;
			margin: 1em 0;
		}

		button {
			margin-right: 1em;
			padding: 0.5em 1em;
		}

		h2 {
			text-align: center;
			margin-bottom: 1em;
		}
	</style>
</head>

<body>

	<div id="box">
		<h2>Singbox配置转换为Neko Links</h2>
		<div class="container" style="height: 600px;">
			<div class="left-box">
				<textarea id="leftInput"
					placeholder="(可选)这里输入CF IP、反代IP和反代域名\n格式：\n  domain\n  domain:port\n  [ipv6]:port\n  ipv4:port\n  ip(ipv4/ipv6)\n  ip,port,字段3,字段4..(cvs数据)\n  ipv4:port,字段2,字段3..(csv数据)\n  [ipv6]:port,字段2,字段3..(csv数据)"></textarea>
			</div>
			<div class="right-box">
				<div class="input-area">
					<textarea id="input" placeholder="粘贴 Singbox JSON 配置数据"></textarea>
				</div>
				<div class="buttons">
					<button id="convertBtn">转换为Neko Links</button>
					<button id="copyBtn">复制生成的Neko Links</button>
				</div>
				<div class="output-area">
					<textarea id="output" readonly placeholder="输出结果显示在这里"></textarea>
				</div>
			</div>
		</div>
		<div class="footer">
			NekoBox工具：
			<a href="https://github.com/MatsuriDayo/nekoray" target="_blank">@MatsuriDayo</a>（存档版本）
			<a href="https://github.com/Mahdi-zarei/nekoray" target="_blank">@Mahdi-zarei</a>（v4.2.7之后的版本不支持外部核心，只支持singbox内核）
		</div>
	</div>


	<script>
		document.getElementById('convertBtn').addEventListener('click', async () => {
			const leftVal = document.getElementById('leftInput').value.trim();
			const rightVal = document.getElementById('input').value.trim();

			if (!rightVal) {
				alert('Singbox JSON 配置数据不能为空');
				return;
			}

			// 构造请求体：如果 leftVal 不空，就一起发；否则只发 right
			const payload = leftVal
				? { left: leftVal, right: rightVal }
				: { right: rightVal };

			try {
				const response = await fetch('/convert', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (!response.ok) throw new Error('转换失败');
				const result = await response.text();
				document.getElementById('output').value = result;
			} catch (err) {
				alert(err.message);
			}
		});

		document.getElementById('copyBtn').addEventListener('click', () => {
			const output = document.getElementById('output');
			output.select();
			document.execCommand('copy');
		});
	</script>
</body>

</html>`;
