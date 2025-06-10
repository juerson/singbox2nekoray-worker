# singbox2nekoray-worker

这个用于部署到 Cloudflare Workers/Pages 的代码。

## 一、功能
将 `singbox` 的 `json` 配置转换为 `NekoBox` 的 `nekoray` 链接（不支持安卓端），只要是 `singbox` 支持的代理协议都支持。

## 二、支持协议
- http
- socks
- shadowsocks
- shadowtls
- anytls
- vless
- vmess
- trojan
- hysteria
- hysteria2
- wireguard
- tuic
- ...

## 二、支持输入的格式

- 从outbounds内复制出来的某个代理

```singbox
{
  "tag": "wireguard-out",
  "type": "wireguard",
  "server": "engage.cloudflareclient.com",
  "server_port": 2408,
  "private_key": "WJekNqVgXj9xTz+8s4uUxFSMXJN7uTo8djQH5+Tqums=",
  "peer_public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
  "reserved": [79, 137, 148],
  "mtu": 1280,
  "network": "udp",
  "local_address": [
    "172.16.0.2/32",
    "2606:4700:110:81d0:4fce:bb9a:c5bc:fd9b/128"
  ]
}
```

- 支持拥有outbounds字段的完整singbox配置

```singbox
{
  "log": {},
  "dns": {},
  "ntp": {},
  "certificate": {},
  "endpoints": [],
  "inbounds": [],
  "outbounds": [
    {
      "tag": "wireguard-out1",
      "type": "wireguard",
      "server": "engage.cloudflareclient.com",
      "server_port": 2408,
      "private_key": "WJekNqVgXj9xTz+8s4uUxFSMXJN7uTo8djQH5+Tqums=",
      "peer_public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
      "reserved": [79, 137, 148],
      "mtu": 1280,
      "network": "udp",
      "local_address": [
        "172.16.0.2/32",
        "2606:4700:110:81d0:4fce:bb9a:c5bc:fd9b/128"
      ]
    },
    {
      "tag": "wireguard-out2",
      "type": "wireguard",
      "server": "engage.cloudflareclient.com",
      "server_port": 2408,
      "private_key": "aJ2wqfkki3um7JnNAH2R6/OnAo2Td+pmxbRReh1v9GE=",
      "peer_public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
      "reserved": [162, 104, 222],
      "mtu": 1280,
      "network": "udp",
      "local_address": [
        "172.16.0.2/32",
        "2606:4700:110:8310:d937:2fb:c312:9498/128"
      ]
    }
  ],
  "route": {},
  "services": [],
  "experimental": {}
}
```

## 三、效果截图


<details>
<summary>点击展开</summary>
    <img src="images\1.png" />
</details>

<details>
<summary>点击展开</summary>
    <img src="images\2.png" />
</details>

<details>
<summary>点击展开</summary>
    <img src="images\3.png" />
</details>

<details>
<summary>点击展开</summary>
    <img src="images\4.png" />
</details>

<details>
<summary>点击展开</summary>
    <img src="images\5.png" />
</details>

## 四、NekoBox工具

[@MatsuriDayo](https://github.com/MatsuriDayo/nekoray) (2024年存档版本)
[@Mahdi-zarei](https://github.com/Mahdi-zarei/nekoray)（v4.2.7 之后的版本不支持外部核心，只支持 singbox 内核）

**注意：**批量黏贴到 NekoBox 时，一些节点可能丢失，貌似 NekoBox 的问题。

