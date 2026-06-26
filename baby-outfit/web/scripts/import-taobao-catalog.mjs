/**
 * Batch import Taobao/Tmall product URLs into product_catalog.
 *
 * Usage:
 *   node scripts/import-taobao-catalog.mjs [url...]
 *   node scripts/import-taobao-catalog.mjs --file urls.txt
 *
 * Requires web/.env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   ONEBOUND_API_KEY, ONEBOUND_API_SECRET
 *
 * Optional for applying migration 007:
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(join(WEB_ROOT, ".env.local"));

const DEFAULT_URLS = [
  "https://detail.tmall.com/item.htm?ali_refid=a3_430582_1006%3A2727998142%3AH%3Ao%2BKk%2FBLJPIkEwTUwrNLNomO5GLLNjjz1%3A8a62adbcdea44260d30f95a6cc619ebc&ali_trackid=318_8a62adbcdea44260d30f95a6cc619ebc&id=1039101767566&mi_id=00008_yP8cFCZPCIIatiZUX-AOEb__eR9fgJmyFHaBdRFpk&mm_sceneid=0_0_10086465445_0&skuId=6060439105433&spm=a21n57.1.hoverItem.1&utparam=%7B%22aplus_abtest%22%3A%227b4a1d57214823b076bccf45a24b85d4%22%7D&xxc=ad_ztc",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A1103653660%3AH%3AcqWESW6o4fI%2B%2FluCXhxp122HAwr4XMbu%3Af8ae917dab03db0b31e58da9598beda0&ali_trackid=318_f8ae917dab03db0b31e58da9598beda0&id=1028494390337&mi_id=0000fo2F2fCryKwbSeF9iqvd0B1P8LLe_FgKIpM2RA0uz2E&mm_sceneid=0_0_28394426_0&skuId=6063045981407&spm=a21n57.1.hoverItem.2&utparam=%7B%22aplus_abtest%22%3A%2231faef191a589bb7281ce999f862e940%22%7D&xxc=ad_ztc",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A2670537808%3AH%3AB9Dm6BRc%2FLE7sp2vs6OuS9r4F0vxqXbL%3A9f844ffeda4c859086c79df088364404&ali_trackid=282_9f844ffeda4c859086c79df088364404&fpChannel=101&fpChannelSig=33acae26fef22f09a80fe61718c82d7a10f90abf&id=1027710255661&mi_id=0000cMjm_emZ8z9lmZC63uulZIZmQPfuBBgsu4KOEKSlPVA&mm_sceneid=1_0_9294018866_0&skuId=6206335283576&spm=a21n57.1.hoverItem.3&utparam=%7B%22aplus_abtest%22%3A%22af94ae30089fc3015c096909669f0237%22%7D&xxc=ad_ztc",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A1286990123%3AH%3ASx9TKxhDzXH3EZoGytFSew%3D%3D%3Af302ee056d887dd21fae9be211616a6d&ali_trackid=318_f302ee056d887dd21fae9be211616a6d&id=772060398604&mi_id=0000VaRE9kFKt8z2-lgdpIvqKRaoTxaTLYvGWqAZKRqYgPE&mm_sceneid=0_0_1066370063_0&skuId=5963839438255&spm=a21n57.1.hoverItem.4&utparam=%7B%22aplus_abtest%22%3A%224ad1914b5842d5cb202369b8ed597315%22%7D&xxc=ad_ztc",
  "https://item.taobao.com/item.htm?abbucket=2&id=788591773621&mi_id=0000b1gCLgLcE3vv1RN7FnoglMrk1sV9Vn5qVgBTj-dYcII&ns=1&skuId=5383308245630&spm=a21n57.1.hoverItem.9&utparam=%7B%22aplus_abtest%22%3A%22ac64a48a3d14c571562c8b68417a164f%22%7D&xxc=taobaoSearch",
  "https://detail.tmall.com/item.htm?abbucket=2&id=773916496583&mi_id=0000l1LpBgJEiSVdtPrmmZlglS0VqOflkXw3sDnTmZwqt5Q&ns=1&skuId=5297589649755&spm=a21n57.1.hoverItem.34&utparam=%7B%22aplus_abtest%22%3A%2211087bf0a5504cfdb829335fccbe280a%22%7D&xxc=taobaoSearch",
  "https://detail.tmall.com/item.htm?abbucket=2&id=908797644458&mi_id=0000hFzRZnr8aDhVYQCGUNuKCIUrkqSQPfHK9HtH_G67BFw&ns=1&priceTId=214780be17804955430931212e10b4&skuId=5936848463719&spm=a21n57.1.hoverItem.26&utparam=%7B%22aplus_abtest%22%3A%227f069b5ce0f7950235cac43f030e1fca%22%7D&xxc=taobaoSearch",
  "https://detail.tmall.com/item.htm?abbucket=2&fpChannel=101&fpChannelSig=c9043abee3e0beb214ebb2f5bd0186bc88a90d55&id=988075965420&mi_id=0000MmVVpaS4VRmfeUACgK2DdeRVH3X9qmiItGy1sIyMo_E&ns=1&priceTId=214780be17804955738294152e10b4&skuId=5951817840899&spm=a21n57.1.hoverItem.4&utparam=%7B%22aplus_abtest%22%3A%22e68f3a51ce7d2c1346058fadaffc854f%22%7D&xxc=taobaoSearch",
  "https://item.taobao.com/item.htm?abbucket=2&id=956921892869&mi_id=000053aLSe6Xt0xu2qVsBYqYSguz-WAY8ownNE3zf9b7A5k&ns=1&priceTId=214780be17804955738294152e10b4&skuId=6047558555410&spm=a21n57.1.hoverItem.11&utparam=%7B%22aplus_abtest%22%3A%22d4bc7dae5d32ad0a49ce0f0267a23f09%22%7D&xxc=taobaoSearch",
  "https://item.taobao.com/item.htm?abbucket=2&id=841358401496&mi_id=0000B5eAE7nD81U7xmkiiLPjNRjdkYvNxPAJF6LiTQrYbYM&ns=1&priceTId=214780be17804955738294152e10b4&skuId=5779219527680&spm=a21n57.1.hoverItem.16&utparam=%7B%22aplus_abtest%22%3A%22a60e1a5136a451515012ae2ff5f63b06%22%7D&xxc=taobaoSearch",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A2727998142%3AH%3AVeR2rNzSPLWY8psqOtbzKg%3D%3D%3A219cb02e35038324f666a33b8f16443b&ali_trackid=318_219cb02e35038324f666a33b8f16443b&id=1038884598182&mi_id=0000muYNRzY0ZjmvNszu9wMCJ7MvSaweKHhIkiUJ3QMovNQ&mm_sceneid=0_0_10086465445_0&priceTId=214780be17804956129117649e10b4&skuId=6223296059895&spm=a21n57.1.hoverItem.2&utparam=%7B%22aplus_abtest%22%3A%22da899f0e3fb9782d4d6560a2b61eb57a%22%7D&xxc=ad_ztc",
  "https://item.taobao.com/item.htm?ali_refid=a3_420434_1006%3A1122428552%3AH%3AzL0WENlGnbpRxaqa8%2BPHGnJ7LT82%2BTCN%3Adcff5ac1b104629ceb94d1f19ccd1f7a&ali_trackid=318_dcff5ac1b104629ceb94d1f19ccd1f7a&id=1027910076208&mi_id=00004c7pDJJdlliL8zFB1-zgrmTMghX6nrydbMLfzKJB1eg&mm_sceneid=0_0_114837582_0&priceTId=214780be17804956129117649e10b4&skuId=6037216160631&spm=a21n57.1.hoverItem.9&utparam=%7B%22aplus_abtest%22%3A%223686ee50dc1f6d23e4f83e5ce25c27c0%22%7D&xxc=ad_ztc",
  "https://detail.tmall.com/item.htm?abbucket=2&id=777513828109&mi_id=0000jpJGE59c_F4FFW6aVno-GrF7W-9y7FnAbUDAxNmyYoE&ns=1&priceTId=214780be17804956129117649e10b4&skuId=6261963790931&spm=a21n57.1.hoverItem.14&utparam=%7B%22aplus_abtest%22%3A%2241feff94c47f4db2773de4732a44d1ba%22%7D&xxc=taobaoSearch",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A1683357342%3AH%3AGjyx%2Ba9woTQTXO1PU49yHG2HAwr4XMbu%3A15766680f1d81431a57c9a5b53837dc6&ali_trackid=318_15766680f1d81431a57c9a5b53837dc6&id=764596539465&mi_id=0000NVZaircWHQwvyfuos6mmhaOQFVckpdKp_YcJVLAvRrw&mm_sceneid=0_0_4377194004_0&priceTId=214780be17804956547073069e10b4&skuId=5432814151577&spm=a21n57.1.hoverItem.4&utparam=%7B%22aplus_abtest%22%3A%2293b87f757d1a5eff672f5523ee21178%22%7D&xxc=ad_ztc",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A1104369700%3AH%3Ah1UrqlMwhWxS3N7ISZDXaDPRXyeQTR7s%3A4f5e6eac1db9579249ede1a6fa874a1b&ali_trackid=282_4f5e6eac1db9579249ede1a6fa874a1b&id=880344902961&mi_id=00006G_cfmHtP_-tKfF3Uh724DsykrwRY5N09O2otoZw6OQ&mm_sceneid=1_0_31617368_0&priceTId=214780be17804956547073069e10b4&skuId=5889501419891&spm=a21n57.1.hoverItem.27&utparam=%7B%22aplus_abtest%22%3A%229c3d3d5c856cedf491c827208d5be7bc%22%7D&xxc=ad_ztc",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A1110402794%3AH%3ANxeYVzsHg88UMC%2BZu2Q68m2HAwr4XMbu%3A4f2ce9746ac9db9d6607232d395dd926&ali_trackid=318_4f2ce9746ac9db9d6607232d395dd926&id=777808688349&mi_id=0000ocITf9S4XqIXMHipTVaHrdHhd9YGAMR67_229uBFBz0&mm_sceneid=0_0_109070575_0&priceTId=214780be17804956926076010e10b4&skuId=5484932266414&spm=a21n57.1.hoverItem.4&utparam=%7B%22aplus_abtest%22%3A%224cafda181af77033dbf634c3cc60494a%22%7D&xxc=ad_ztc",
  "https://detail.tmall.com/item.htm?ali_refid=a3_420434_1006%3A1122578360%3AH%3AKw%2BARvxIqKazhMWGbFFGCg%3D%3D%3A9333184f4f5162a9bebc9f477b4e04e6&ali_trackid=282_9333184f4f5162a9bebc9f477b4e04e6&id=599995577790&mi_id=0000-HWZo8apU1QCs064ZYXVb9MI4-e68Nwx_CUHIPzUcMQ&mm_sceneid=1_0_113422452_0&priceTId=214780be17804956926076010e10b4&skuId=6142817158618&spm=a21n57.1.hoverItem.5&utparam=%7B%22aplus_abtest%22%3A%2247b8365d32f10e3ab9e9bb6669b63cd5%22%7D&xxc=ad_ztc",
];

function extractItemId(url) {
  try {
    const id = new URL(url).searchParams.get("id");
    if (id && /^\d{8,20}$/.test(id)) return id;
  } catch {
    const match = url.match(/[?&]id=(\d{8,20})/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("tmall")) return "tmall";
    if (host.includes("taobao")) return "taobao";
  } catch {
    /* ignore */
  }
  return "unknown";
}

function extractSkuId(url) {
  try {
    return new URL(url).searchParams.get("skuId")?.trim() || "";
  } catch {
    const match = url.match(/[?&]skuId=(\d+)/i);
    return match?.[1] ?? "";
  }
}

function propsToMaterialHint(item) {
  const parts = [];
  if (Array.isArray(item.props)) {
    for (const p of item.props) {
      if (p.name && p.value) parts.push(`${p.name}:${p.value}`);
    }
  }
  if (item.props_name) parts.push(item.props_name);
  return parts.join(" ").trim() || null;
}

function inferCategory(title) {
  const rules = [
    [/睡袋/, "sleep_sack"],
    [/睡衣|家居服/, "pajamas"],
    [/包屁衣|和尚服/, "bodysuit_short"],
    [/连脚爬服|连脚.*爬服/, "footed_romper"],
    [/连体|连身|哈衣|爬服/, "bodysuit_long"],
    [/羽绒服/, "outer_down"],
    [/棉服/, "outer_cotton"],
    [/雨衣|防晒衣|防晒服|冲锋衣/, "outer_rain_uv"],
    [/外套|夹克|大衣|风衣/, "outer_shell"],
    [/羽绒裤|棉裤/, "pants_padded"],
    [/短裤/, "pants_short"],
    [/裤子|长裤|打底裤|PP裤|裤$/, "pants_long"],
    [/卫衣|抓绒/, "fleece_top"],
    [/毛衣|针织|开衫/, "sweater"],
    [/马甲|背心/, "vest"],
    [/打底|内衣|内搭|秋衣/, "base_top"],
    [/帽|胎帽/, "hat"],
    [/袜/, "socks"],
    [/手套/, "gloves"],
    [/围巾|围嘴|口水巾|围脖/, "scarf"],
  ];
  for (const [pattern, code] of rules) {
    if (pattern.test(title)) return code;
  }
  return "bodysuit_long";
}

function inferThickness(title) {
  if (/加厚|厚款|冬季|保暖|羽绒|棉服|夹棉|厚棉/.test(title)) return "thick";
  if (/薄款|单层|夏季|清爽|透气|薄棉|纱布/.test(title)) return "thin";
  return "medium";
}

function inferSizeLabel(title) {
  const cm = title.match(/(\d{2,3})\s*(?:cm|CM|厘米|码)/);
  if (cm) return `${cm[1]}cm`;
  const month = title.match(/(\d{1,2})\s*[-~到至]\s*(\d{1,2})\s*(?:个月|M|月)/i);
  if (month) return `${month[1]}-${month[2]}M`;
  const singleMonth = title.match(/(\d{1,2})\s*(?:个月|M|月)/i);
  if (singleMonth) return `${singleMonth[1]}M`;
  return null;
}

function normalizeSkus(skus) {
  if (!skus) return [];
  if (Array.isArray(skus)) return skus;
  if (typeof skus === "object" && skus.sku) {
    return Array.isArray(skus.sku) ? skus.sku : [skus.sku];
  }
  return [skus];
}

async function fetchOneboundItem(numIid) {
  const key = process.env.ONEBOUND_API_KEY?.trim();
  const secret = process.env.ONEBOUND_API_SECRET?.trim();
  if (!key || !secret) throw new Error("缺少 ONEBOUND_API_KEY / ONEBOUND_API_SECRET");

  const params = new URLSearchParams({
    key,
    secret,
    num_iid: numIid,
    is_promotion: "1",
    lang: "cn",
    cache: "yes",
  });

  const res = await fetch(`https://api-gw.onebound.cn/taobao/item_get/?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`OneBound HTTP ${res.status}`);
  const data = await res.json();
  if (data.error?.trim()) throw new Error(`OneBound: ${data.error}`);
  if (!data.item?.title?.trim()) throw new Error("OneBound 未返回商品标题");
  return data.item;
}

async function fetchHtmlItem(numIid) {
  const ua =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const urls = [
    `https://item.taobao.com/item.htm?id=${numIid}`,
    `https://detail.m.tmall.com/item.htm?id=${numIid}`,
    `https://detail.tmall.com/item.htm?id=${numIid}`,
  ];
  for (const pageUrl of urls) {
    try {
      const res = await fetch(pageUrl, {
        headers: { "User-Agent": ua, Accept: "text/html" },
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      if (html.length < 8000) continue;
      const title =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
        html.match(/"title"\s*:\s*"((?:\\.|[^"\\]){4,200})"/)?.[1];
      if (!title || title.length < 4) continue;
      const pic =
        html.match(/"(?:picUrl|pic_url)"\s*:\s*"(https?:\/\/[^"]+)"/i)?.[1] ??
        html.match(/(https?:\/\/img\.alicdn\.com\/[^"'\s]+)/i)?.[1];
      const price = html.match(/"price"\s*:\s*"?([\d.]+)"?/i)?.[1];
      return {
        num_iid: numIid,
        title: title.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        ),
        pic_url: pic ?? null,
        price: price ?? null,
        promotion_price: price ?? null,
      };
    } catch {
      /* try next */
    }
  }
  return null;
}

async function fetchProductItem(numIid, sourceUrl) {
  try {
    const item = await fetchOneboundItem(numIid);
    return { ...item, _parse_source: "onebound" };
  } catch (err) {
    const htmlItem = await fetchHtmlItem(numIid);
    if (htmlItem) return { ...htmlItem, _parse_source: "html", _warnings: [] };
    return buildUrlOnlyItem(sourceUrl, numIid, err.message);
  }
}

function mapToPayload(sourceUrl, item) {
  const itemId = extractItemId(sourceUrl) ?? String(item.num_iid ?? "");
  const title = item.title?.trim() || `淘宝商品 ${itemId}`;
  const price = item.promotion_price ?? item.price;
  const priceText = price != null && price !== "" && price !== -1 ? `¥${price}` : null;

  return {
    platform: detectPlatform(sourceUrl),
    item_id: itemId,
    sku_id: extractSkuId(sourceUrl),
    source_url: sourceUrl,
    canonical_url: `https://item.taobao.com/item.htm?id=${itemId}`,
    title,
    short_desc: item.desc_short ?? null,
    brand: item.brand ?? null,
    brand_id: item.brandId != null ? String(item.brandId) : null,
    category_id: item.cid != null ? String(item.cid) : null,
    root_category_id: item.rootCatId != null ? String(item.rootCatId) : null,
    price: item.price != null ? String(item.price) : null,
    promotion_price: item.promotion_price != null ? String(item.promotion_price) : null,
    original_price: item.orginal_price != null ? String(item.orginal_price) : null,
    price_text: priceText,
    pic_url: item.pic_url?.startsWith("//") ? `https:${item.pic_url}` : item.pic_url ?? null,
    item_imgs: item.item_imgs ?? [],
    desc_img: item.desc_img ?? [],
    video: item.video ?? null,
    stock_num: item.num != null ? String(item.num) : null,
    min_num: item.min_num != null ? String(item.min_num) : null,
    total_sold: item.total_sold != null ? String(item.total_sold) : null,
    shop_id:
      item.shop_id != null
        ? String(item.shop_id)
        : item.seller_info?.sid != null
          ? String(item.seller_info.sid)
          : null,
    shop_name: item.seller_info?.shop_name ?? item.seller_info?.title ?? null,
    seller_id:
      item.seller_id != null
        ? String(item.seller_id)
        : item.seller_info?.user_num_id != null
          ? String(item.seller_info.user_num_id)
          : null,
    seller_nick: item.nick ?? item.seller_info?.nick ?? null,
    shop_type: item.seller_info?.shop_type ?? null,
    is_tmall:
      item.tmall === true ||
      item.tmall === "true" ||
      item.seller_info?.shop_type === "B" ||
      detectPlatform(sourceUrl) === "tmall",
    props: item.props ?? [],
    props_name: item.props_name ?? null,
    props_list: item.props_list ?? {},
    property_alias: item.property_alias ?? null,
    skus: normalizeSkus(item.skus),
    location: item.location ?? null,
    post_fee: item.post_fee != null ? String(item.post_fee) : null,
    express_fee: item.express_fee != null ? String(item.express_fee) : null,
    inferred_category: inferCategory(title),
    inferred_thickness: inferThickness(title),
    inferred_size_label: inferSizeLabel(title),
    material_hint: propsToMaterialHint(item) ?? title,
    raw_payload: item,
    fetched_at: new Date().toISOString(),
    parse_source: item._parse_source ?? "onebound",
    warnings: item._warnings ?? [],
  };
}

function buildUrlOnlyItem(sourceUrl, itemId, warning) {
  return {
    num_iid: itemId,
    title: `待解析商品 ${itemId}`,
    _parse_source: "url_only",
    _warnings: [warning],
  };
}

async function applyMigrationIfNeeded() {
  const dbUrl = process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) return false;

  let pg;
  try {
    pg = (await import("pg")).default;
  } catch {
    console.warn("未安装 pg，跳过自动迁移。请手动在 Supabase SQL Editor 运行 007_product_catalog.sql");
    return false;
  }

  const sqlPath = join(WEB_ROOT, "..", "supabase", "migrations", "007_product_catalog.sql");
  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("已应用 migration 007_product_catalog.sql");
    return true;
  } finally {
    await client.end();
  }
}

async function ensureRpcReady(supabase) {
  const { error } = await supabase.rpc("upsert_product_catalog", {
    p_row: {
      platform: "unknown",
      item_id: "__probe__",
      sku_id: "",
      source_url: "https://probe.local",
      title: "__probe__",
      raw_payload: {},
    },
  });
  if (!error) {
    await supabase
      .from("product_catalog")
      .delete()
      .eq("item_id", "__probe__");
    return true;
  }
  if (error.message.includes("Could not find the function")) return false;
  if (error.message.includes("relation") && error.message.includes("does not exist")) return false;
  return true;
}

async function signInDemoUser(supabase) {
  const email = process.env.IMPORT_DEMO_EMAIL?.trim() || "demo_user_1@baby-outfit.dev";
  const password = process.env.IMPORT_DEMO_PASSWORD?.trim() || "password123";
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`Demo 登录失败: ${error?.message ?? "unknown"}`);
  }
  return data.user.id;
}

async function upsertViaParseJobs(supabase, userId, payload) {
  const { data: existing, error: selectError } = await supabase
    .from("url_parse_jobs")
    .select("id, result")
    .eq("user_id", userId)
    .eq("source_url", payload.source_url)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (
    existing?.result?.parse_source &&
    existing.result.parse_source !== "url_only" &&
    payload.parse_source === "url_only"
  ) {
    return existing.id;
  }

  const row = {
    user_id: userId,
    source_url: payload.source_url,
    status: "success",
    result: payload,
    completed_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from("url_parse_jobs").update(row).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  }

  const { data, error } = await supabase.from("url_parse_jobs").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

function parseArgs(argv) {
  const urls = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) {
      const content = readFileSync(argv[i + 1], "utf8");
      urls.push(
        ...content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("http"))
      );
      i++;
    } else if (argv[i].startsWith("http")) {
      urls.push(argv[i]);
    }
  }
  return urls.length ? urls : DEFAULT_URLS;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const urls = parseArgs(process.argv.slice(2));
  console.log(`准备导入 ${urls.length} 个商品链接…`);

  await applyMigrationIfNeeded();

  const supabase = createClient(supabaseUrl, supabaseKey);
  const rpcReady = await ensureRpcReady(supabase);
  let demoUserId = null;
  if (!rpcReady) {
    console.warn("product_catalog 尚未就绪，将写入 url_parse_jobs（demo 用户）。");
    demoUserId = await signInDemoUser(supabase);
  }

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const itemId = extractItemId(url);
    process.stdout.write(`[${i + 1}/${urls.length}] ${itemId ?? url.slice(0, 40)}… `);
    try {
      if (!itemId) throw new Error("无法解析 item id");
      const item = await fetchProductItem(itemId, url);
      const payload = mapToPayload(url, item);
      let recordId;
      if (rpcReady) {
        const { data, error } = await supabase.rpc("upsert_product_catalog", { p_row: payload });
        if (error) throw new Error(error.message);
        recordId = data;
      } else {
        recordId = await upsertViaParseJobs(supabase, demoUserId, payload);
      }
      const flag = payload.parse_source === "url_only" ? " (仅链接)" : "";
      console.log(`✓ ${payload.title.slice(0, 40)}${flag} (${recordId})`);
      results.push({
        url,
        ok: true,
        id: recordId,
        title: payload.title,
        target: rpcReady ? "product_catalog" : "url_parse_jobs",
        parse_source: payload.parse_source,
      });
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.log(`✗ ${err.message}`);
      results.push({ url, ok: false, error: err.message });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(`\n完成：${ok}/${results.length} 成功${rpcReady ? "" : "（写入 url_parse_jobs，请运行 migration 007 后重导至 product_catalog）"}`);
  if (ok < results.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
