var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
var MAX_INDEX = 99999;
var worker_default = {
  async fetch(request) {
    const { method } = request;
    if (method === "GET") {
      return new Response(htmlContent, {
        headers: {
          "content-type": "text/html;charset=UTF-8"
        }
      });
    } else if (method === "POST" && new URL(request.url).pathname === "/convert") {
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
            headers: { "content-type": "text/plain;charset=UTF-8" },
            status: 200
          });
        } else {
          const unwantedTypeSet = /* @__PURE__ */ new Set(["direct", "block", "urltest", "dns", "selector", "tor", ""]);
          const filteredData = outbounds.filter((item) => !unwantedTypeSet.has(item.type || ""));
          let index_length = filteredData.length;
          let nekolinks = [];
          for (const outbound of filteredData) {
            index++;
            const base64 = buildNekoLinks(outbound, host_port_array, index, index_length);
            nekolinks.push(base64);
          }
          let joinStr = nekolinks.join("\n");
          return new Response(joinStr, {
            headers: { "content-type": "text/plain;charset=UTF-8" },
            status: 200
          });
        }
      } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
      }
    } else {
      return new Response("Method Not Allowed", { status: 405 });
    }
  }
};
function buildNekoLinks(jsonData, host_port_array, index, index_length) {
  const paddingLength_i = Math.ceil(Math.log10(host_port_array.length)) || 1;
  const paddingLength_index = Math.ceil(Math.log10(index_length)) || 1;
  const index_str = `\u3010${String(index).padStart(paddingLength_index, "0")}\u3011`;
  let results = [];
  if (host_port_array.length > 0) {
    let i = 0;
    host_port_array.forEach((item) => {
      let deepCopy = structuredClone(jsonData);
      if (item?.host) {
        i++;
        let name_str = `${String(deepCopy.type).replace(/\b\w/g, (c) => c.toUpperCase())} - Neko Links`;
        let i_str = String(i).padStart(paddingLength_i, "0");
        if (index === MAX_INDEX) {
          deepCopy.tag = `\u30100\u3011-${i_str} ${name_str}`;
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
  return results.join("\n");
}
__name(buildNekoLinks, "buildNekoLinks");
function nekorayJSON(jsonData) {
  const jsonString = JSON.stringify(jsonData, null, 2);
  const final = {
    _v: 0,
    addr: "127.0.0.1",
    brutal_speed: 0,
    c_cfg: "",
    c_out: "",
    core: "internal",
    cs: jsonString,
    cs_suffix: "",
    enable_brutal: false,
    mapping_port: 0,
    mux: 0,
    name: jsonData.tag,
    port: 1080,
    socks_port: 0
  };
  const compactJson = JSON.stringify(final);
  const result = "nekoray://custom#" + base64Encode(compactJson);
  return result;
}
__name(nekorayJSON, "nekorayJSON");
function base64Encode(str) {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  let binary = "";
  const chunkSize = 32768;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
__name(base64Encode, "base64Encode");
function parseHostPortWithErrorHandling(input2) {
  const defaultPorts = [443, 2053, 2083, 2087, 2096, 8443];
  const ipv6WithPortRegex = /^\[([a-fA-F0-9:]+)\]:(\d{1,5})/;
  const hostPortRegex = /^([a-zA-Z0-9.-]+):(\d{1,5})/;
  const hostCommaPortRegex = /^([a-zA-Z0-9.-]+),(\d{1,5})/;
  const hostOnlyRegex = /^([a-zA-Z0-9.-]+)$/;
  const ipv6OnlyRegex = /^([a-fA-F0-9:]+)$/;
  let match = input2.match(ipv6WithPortRegex);
  if (match) {
    const host = match[1];
    const port = parseInt(match[2], 10);
    if (port >= 80 && port <= 65535) {
      return { host, port };
    } else {
      return { host, port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)] };
    }
  }
  match = input2.match(hostPortRegex);
  if (match) {
    const host = match[1];
    const port = parseInt(match[2], 10);
    if (port >= 80 && port <= 65535) {
      return { host, port };
    } else {
      return { host, port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)] };
    }
  }
  match = input2.match(hostCommaPortRegex);
  if (match) {
    const host = match[1];
    const port = parseInt(match[2], 10);
    if (port >= 80 && port <= 65535) {
      return { host, port };
    } else {
      return { host, port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)] };
    }
  }
  match = input2.match(ipv6OnlyRegex);
  if (match && input2.includes(":")) {
    return {
      host: input2,
      port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)]
    };
  }
  match = input2.match(hostOnlyRegex);
  if (match) {
    return {
      host: match[1],
      port: defaultPorts[Math.floor(Math.random() * defaultPorts.length)]
    };
  }
  return null;
}
__name(parseHostPortWithErrorHandling, "parseHostPortWithErrorHandling");
function safeParseHostPort(input2) {
  try {
    const result = parseHostPortWithErrorHandling(input2);
    if (!result) return { error: "invalid format", raw: input2 };
    const validHost = (() => {
      if (result.host.includes(":")) {
        return /^[a-fA-F0-9:\[\]]+$/.test(result.host);
      }
      return /^[a-zA-Z0-9.-]+$/.test(result.host);
    })();
    const validPort = Number.isInteger(result.port) && result.port >= 80 && result.port <= 65535;
    if (validHost && validPort) {
      return result;
    }
    return { error: "invalid format", raw: input2 };
  } catch (e) {
    return { error: "parsing failed", raw: input2 };
  }
}
__name(safeParseHostPort, "safeParseHostPort");
var htmlContent = `<!DOCTYPE html>
<html>

<head>
	<meta charset="UTF-8">
	<title>Neko Links\u5728\u7EBF\u5236\u4F5C\u5DE5\u5177</title>
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
		<h2>Singbox\u914D\u7F6E\u8F6C\u6362\u4E3ANeko Links</h2>
		<div class="container" style="height: 600px;">
			<div class="left-box">
				<textarea id="leftInput"
					placeholder="(\u53EF\u9009)\u8FD9\u91CC\u8F93\u5165CF IP\u3001\u53CD\u4EE3IP\u548C\u53CD\u4EE3\u57DF\u540D
\u683C\u5F0F\uFF1A
  domain
  domain:port
  [ipv6]:port
  ipv4:port
  ip(ipv4/ipv6)
  ip,port,\u5B57\u6BB53,\u5B57\u6BB54..(cvs\u6570\u636E)
  ipv4:port,\u5B57\u6BB52,\u5B57\u6BB53..(csv\u6570\u636E)
  [ipv6]:port,\u5B57\u6BB52,\u5B57\u6BB53..(csv\u6570\u636E)"></textarea>
			</div>
			<div class="right-box">
				<div class="input-area">
					<textarea id="input" placeholder="\u7C98\u8D34 Singbox JSON \u914D\u7F6E\u6570\u636E"></textarea>
				</div>
				<div class="buttons">
					<button id="convertBtn">\u8F6C\u6362\u4E3ANeko Links</button>
					<button id="copyBtn">\u590D\u5236\u751F\u6210\u7684Neko Links</button>
				</div>
				<div class="output-area">
					<textarea id="output" readonly placeholder="\u8F93\u51FA\u7ED3\u679C\u663E\u793A\u5728\u8FD9\u91CC"></textarea>
				</div>
			</div>
		</div>
		<div class="footer">
			NekoBox\u5DE5\u5177\uFF1A
			<a href="https://github.com/MatsuriDayo/nekoray" target="_blank">@MatsuriDayo</a>\uFF08\u5B58\u6863\u7248\u672C\uFF09
			<a href="https://github.com/Mahdi-zarei/nekoray" target="_blank">@Mahdi-zarei</a>\uFF08v4.2.7\u4E4B\u540E\u7684\u7248\u672C\u4E0D\u652F\u6301\u5916\u90E8\u6838\u5FC3\uFF0C\u53EA\u652F\u6301singbox\u5185\u6838\uFF09
		</div>
	</div>


	<script>
		document.getElementById('convertBtn').addEventListener('click', async () => {
			const leftVal = document.getElementById('leftInput').value.trim();
			const rightVal = document.getElementById('input').value.trim();

			if (!rightVal) {
				alert('Singbox JSON \u914D\u7F6E\u6570\u636E\u4E0D\u80FD\u4E3A\u7A7A');
				return;
			}

			// \u6784\u9020\u8BF7\u6C42\u4F53\uFF1A\u5982\u679C leftVal \u4E0D\u7A7A\uFF0C\u5C31\u4E00\u8D77\u53D1\uFF1B\u5426\u5219\u53EA\u53D1 right
			const payload = leftVal
				? { left: leftVal, right: rightVal }
				: { right: rightVal };

			try {
				const response = await fetch('/convert', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (!response.ok) throw new Error('\u8F6C\u6362\u5931\u8D25');
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
	<\/script>
</body>

</html>`;
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
