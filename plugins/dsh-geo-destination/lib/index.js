/**
 * 地理工具：destination — 地理坐标工具
 */

export const name = "dsh-geo-destination";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/tools/";
const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

const B32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const R = 6371;
const D2R = Math.PI / 180;

function pair(t, a) {
  const m = String(t).match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (m) return [Number(m[1]), Number(m[2])];
  const m2 = String(a || "").match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (m2) return [m2[1] === undefined ? 0 : Number(m2[1]), Number(m2[2])];
  throw new Error("坐标格式：经度,纬度 或 text=lat a=lng");
}
function hav(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * D2R, dLon = (lon2 - lon1) * D2R;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function geohashEncode(lat, lon, len) {
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180;
  let i = 0, ch = 0, out = "";
  while (out.length < len) {
    if (i % 2 === 0) { const mid = (lonMin + lonMax) / 2; if (lon >= mid) { ch = ch * 2 + 1; lonMin = mid; } else { ch = ch * 2; lonMax = mid; } }
    else { const mid = (latMin + latMax) / 2; if (lat >= mid) { ch = ch * 2 + 1; latMin = mid; } else { ch = ch * 2; latMax = mid; } }
    i++;
    if (i % 5 === 0) { out += B32[ch]; ch = 0; }
  }
  return out;
}
function geohashDecode(h) {
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180, even = true;
  for (const c of String(h).toLowerCase()) {
    const idx = B32.indexOf(c);
    if (idx < 0) throw new Error("非法 geohash");
    for (let i = 4; i >= 0; i--) {
      const bit = (idx >> i) & 1;
      if (even) { const mid = (lonMin + lonMax) / 2; if (bit) lonMin = mid; else lonMax = mid; }
      else { const mid = (latMin + latMax) / 2; if (bit) latMin = mid; else latMax = mid; }
      even = !even;
    }
  }
  return [(latMin + latMax) / 2, (lonMin + lonMax) / 2];
}

const OPS = {
  coord_validate: (t) => { const [x, y] = pair(t); return Math.abs(y) <= 90 && Math.abs(x) <= 180 ? "坐标有效（经度 " + x + "，纬度 " + y + "）" : "超出经纬度范围"; },
  dms_to_decimal: (t) => {
    const m = String(t).trim().match(/^(-?\d+)[°\s]+(\d+)['′\s]+([\d.]+)["″]?\s*([NSEW])?$/i);
    if (!m) throw new Error("格式如 39°54'26\"N");
    let d = Math.abs(Number(m[1])) + Number(m[2]) / 60 + Number(m[3]) / 3600;
    if (Number(m[1]) < 0 || /[SW]/i.test(m[4] || "")) d = -d;
    return String(Math.round(d * 1e6) / 1e6);
  },
  decimal_to_dms: (t) => {
    const d = Number(t); if (!Number.isFinite(d)) throw new Error("需要数字");
    const s = d < 0 ? -1 : 1; let x = Math.abs(d);
    let deg = Math.floor(x); x = (x - deg) * 60;
    let min = Math.floor(x); let sec = Math.round((x - min) * 60 * 1000) / 1000;
    if (sec >= 60) { sec = 0; min++; }
    if (min >= 60) { min = 0; deg++; }
    return (s < 0 ? "-" : "") + deg + "°" + min + "'" + sec + "\"";
  },
  haversine: (t, a) => { const [x1, y1] = pair(t, ""); const [x2, y2] = pair("", a); const km = hav(y1, x1, y2, x2); return "距离: " + (Math.round(km * 100) / 100) + " km（" + (Math.round(km * 0.621371 * 100) / 100) + " mi）"; },
  bearing: (t, a) => { const [x1, y1] = pair(t, ""); const [x2, y2] = pair("", a); const dLon = (x2 - x1) * D2R; const y = Math.sin(dLon) * Math.cos(y2 * D2R); const x = Math.cos(y1 * D2R) * Math.sin(y2 * D2R) - Math.sin(y1 * D2R) * Math.cos(y2 * D2R) * Math.cos(dLon); return "方位角: " + (Math.round((Math.atan2(y, x) / D2R + 360) % 360 * 10) / 10) + "°"; },
  midpoint: (t, a) => { const [x1, y1] = pair(t, ""); const [x2, y2] = pair("", a); return JSON.stringify({ lat: (y1 + y2) / 2, lng: (x1 + x2) / 2 }); },
  bbox: (t, a) => { const [x1, y1] = pair(t, ""); const [x2, y2] = pair("", a); return JSON.stringify({ minLat: Math.min(y1, y2), minLng: Math.min(x1, x2), maxLat: Math.max(y1, y2), maxLng: Math.max(x1, x2) }, null, 2); },
  geohash_encode: (t, a) => { const [x, y] = pair(t, "a"); const len = Math.min(12, Math.max(1, Number(a) || 9)); return geohashEncode(y, x, len); },
  geohash_decode: (t) => { const [lat, lng] = geohashDecode(String(t).trim()); return "纬度: " + (Math.round(lat * 1e6) / 1e6) + NL + "经度: " + (Math.round(lng * 1e6) / 1e6); },
  destination: (t, a) => { const [x, y] = pair(t, ""); const m = String(a).match(/(-?[\d.]+)\s*,\s*([\d.]+)/); if (!m) throw new Error("a=方位角,距离km"); const brg = Number(m[1]) * D2R, d = Number(m[2]) / R; const lat2 = Math.asin(Math.sin(y * D2R) * Math.cos(d) + Math.cos(y * D2R) * Math.sin(d) * Math.cos(brg)); const lon2 = x * D2R + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(y * D2R), Math.cos(d) - Math.sin(y * D2R) * Math.sin(lat2)); return JSON.stringify({ lat: Math.round(lat2 / D2R * 1e6) / 1e6, lng: Math.round(lon2 / D2R * 1e6) / 1e6 }); },
};

export function apply(ctx, config) {
  void config;
  ctx.tools.register({
    name: "destination",
    description: "destination",
    parameters: {
      text: { "type": "string", required: true, "description": "坐标" },
      a: { "type": "string", "description": "参数" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      const t = args && args.text != null ? String(args.text) : "";
      const a = args && args.a != null ? String(args.a) : "";
      try {
        const fn = OPS["destination"];
        if (!fn) throw new Error("未知操作");
        return { text: ["地理工具：destination", "=".repeat(52), String(fn(t, a)), "", "更多工具：" + SITE].join(NL) };
      } catch (e) {
        return { text: "处理失败: " + String((e && e.message) || e) };
      }
    },
  });
}