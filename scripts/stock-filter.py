#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A股价值筛选脚本
=================
从东方财富接口获取全A股实时数据，筛选：
  - 市盈率(动态) < 30
  - 总市值 > 10亿元
  - 排除 ST、*ST 股票
  - 排除负市盈率（亏损股）

输出：stock/data/valuation.json

运行方式：
  python scripts/stock-filter.py

数据来源：东方财富网行情接口（公开免费）
  http://push2.eastmoney.com/api/qt/clist/get
"""

import json
import os
import sys
import time
import random
from datetime import datetime, timezone, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# ============================================================
# 配置
# ============================================================

# 东方财富接口基础地址（沪深A股全部）
# fs 参数说明：
#   m:0 t:6  → 深圳主板
#   m:0 t:80 → 创业板
#   m:1 t:2  → 上海主板
#   m:1 t:23 → 科创板
#   m:0 t:81 s:2048 → 北交所
EASTMONEY_BASE = (
    "http://push2.eastmoney.com/api/qt/clist/get"
    "?pn={page}&pz=100&po=1&np=1&fltt=2&invt=2"
    "&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048"
    "&fields=f2,f3,f4,f5,f6,f9,f12,f14,f15,f16,f17,f20,f100"
)

# 字段映射（东方财富字段编号 → 含义）
# f2: 最新价    f3: 涨跌幅    f4: 涨跌额
# f5: 成交量    f6: 成交额    f9: 市盈率(动态)
# f12: 代码     f14: 名称     f15: 最高
# f16: 最低     f17: 今开     f20: 总市值
# f100: 行业

# 筛选条件
PE_MIN = 2           # 市盈率下限（排除异常低值）
PE_MAX = 30          # 市盈率上限
MARKET_CAP_MIN = 10  # 市值下限（亿元）

# 输出路径
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "stock", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "valuation.json")

# 请求头（模拟真实浏览器，避免被拦截和 502）
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Referer": "https://quote.eastmoney.com/",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache",
}

# 备选 API 地址（主地址失败时切换）
EASTMONEY_HOSTS = [
    "http://push2.eastmoney.com",
    "http://push2delay.eastmoney.com",
    "http://80.push2.eastmoney.com",
]

# Cloudflare Worker 代理（解决 GitHub Actions 境外 IP 被东方财富封锁的问题）
# Worker 部署在 Cloudflare 全球边缘节点（含香港/东京），不会被拦截
PROXY_URL = "https://stock-sync.18209242713.workers.dev/proxy/eastmoney"
PROXY_KEY = "66171d8ad990b900999cfd2ba7f5931b80833e552e9d6549"


def _build_urls(page):
    """构造当前页的所有请求 URL：代理优先，直连备用"""
    query = EASTMONEY_BASE.format(page=page)
    # 从完整 URL 中提取路径+参数部分（去掉 http://push2.eastmoney.com 前缀）
    base_prefix = "http://push2.eastmoney.com"
    path_and_query = query[len(base_prefix):]  # /api/qt/clist/get?pn=...&pz=...

    urls = []

    # 第一优先级：Cloudflare Worker 代理（解决 GitHub Actions 境外 IP 被东方财富封锁）
    if PROXY_URL:
        proxy_url = f"{PROXY_URL}{path_and_query}&key={PROXY_KEY}"
        urls.append(("代理", proxy_url))

    # 备用：直连东方财富各节点
    for host in EASTMONEY_HOSTS:
        direct_url = query.replace("http://push2.eastmoney.com", host)
        urls.append((host.replace("http://", ""), direct_url))

    return urls


def fetch_stock_data():
    """
    从东方财富接口分页获取全A股数据。
    接口每次最多返回 100 条，需要分页循环获取全部约 5800+ 只股票。
    优先通过 Cloudflare Worker 代理（全球边缘节点），失败后回退直连。
    """
    print("正在从东方财富获取全A股数据（分页获取）...")

    all_stocks = []
    page = 1
    total = 0
    pages_needed = "?"
    max_retries = 5
    base_retry_wait = 3  # 基础等待秒数，每次重试指数增长

    print(f"  代理配置: PROXY_URL={'已配置' if PROXY_URL else '未配置'}, 重试{max_retries}次")
    print(f"  第1页URL优先级: {[label for label, _ in _build_urls(1)]}")

    while True:
        success = False
        last_error = None
        urls = _build_urls(page)

        for retry in range(max_retries):
            # 按优先级轮换：代理 → push2 → push2delay → 80.push2 → 循环
            label, url = urls[retry % len(urls)]

            try:
                req = Request(url, headers=HEADERS)
                with urlopen(req, timeout=45) as resp:
                    raw = resp.read().decode("utf-8")
                data = json.loads(raw)

                if not data or "data" not in data:
                    last_error = "返回数据为空"
                    wait = base_retry_wait * (2 ** retry) + random.uniform(0, 2)
                    print(f"  ⚠ 第 {page} 页第 {retry+1} 次数据为空 ({label})，{wait:.0f}s 后重试...")
                    time.sleep(wait)
                    continue

                success = True
                break

            except HTTPError as e:
                last_error = f"HTTP {e.code}"
                wait = base_retry_wait * (2 ** retry) + random.uniform(0, 3)
                print(f"  ⚠ 第 {page} 页第 {retry+1} 次: {last_error} ({label})，{wait:.0f}s 后重试...")
                time.sleep(wait)

            except Exception as e:
                last_error = str(e)[:60]
                wait = base_retry_wait * (2 ** retry) + random.uniform(0, 3)
                print(f"  ⚠ 第 {page} 页第 {retry+1} 次: {last_error} ({label})，{wait:.0f}s 后重试...")
                time.sleep(wait)

        if not success:
            print(f"  ❌ 第 {page} 页重试 {max_retries} 次仍失败（最后错误: {last_error}），跳过")
            if all_stocks:
                page += 1
                time.sleep(1)
                continue
            else:
                print("  ❌ 首页获取失败，无法继续")
                sys.exit(1)

        diff = data["data"].get("diff", []) or data["data"].get("list", [])
        if not diff:
            break

        # 记录总数（从第一页或任意返回 total 的页）
        if total == 0 and data["data"].get("total", 0) > 0:
            total = data["data"].get("total", 0)
            pages_needed = (total + 99) // 100
            print(f"  全A股共 {total} 只股票，需获取 {pages_needed} 页")

        all_stocks.extend(diff)

        if page % 15 == 0:
            print(f"  进度: {page}/{pages_needed} 页，已获取 {len(all_stocks)} 只...")

        if len(all_stocks) >= total > 0 or len(diff) < 100:
            break

        page += 1
        time.sleep(0.8)

    print(f"获取完成：共 {len(all_stocks)} 只股票数据")
    return all_stocks


def filter_stocks(stocks):
    """
    筛选符合条件的股票：
    - 市盈率 > 0 且 < 30（排除亏损股和负市盈率）
    - 总市值 > 10亿
    - 排除 ST、*ST 股票
    - 排除名称为空的股票
    """
    result = []

    for s in stocks:
        code = s.get("f12", "")
        name = s.get("f14", "")
        pe = s.get("f9")  # 市盈率(动态)
        market_cap = s.get("f20")  # 总市值（元）

        # 跳过无效数据
        if not code or not name:
            continue
        if pe is None or pe <= 0:
            continue  # 排除亏损或无市盈率
        if market_cap is None or market_cap <= 0:
            continue

        # 市值转亿元
        market_cap_yi = market_cap / 1e8

        # 筛选条件：2 < PE(TTM) < 30 且 市值 > 10亿
        if pe <= PE_MIN:
            continue  # 排除异常低市盈率
        if pe >= PE_MAX:
            continue
        if market_cap_yi <= MARKET_CAP_MIN:
            continue

        # 排除 ST 股票
        if "ST" in name or "st" in name:
            continue

        # 排除退市股
        if "退" in name:
            continue

        result.append({
            "code": code,
            "name": name,
            "price": round(s.get("f2", 0), 2),
            "change_pct": round(s.get("f3", 0), 2),
            "change_amt": round(s.get("f4", 0), 2),
            "volume": s.get("f5", 0),       # 成交量（手）
            "turnover": round(s.get("f6", 0) / 1e4, 0),  # 成交额（万元）
            "pe": round(pe, 2),             # 市盈率
            "market_cap": round(market_cap_yi, 2),  # 总市值（亿元）
            "industry": s.get("f100", ""),  # 行业
            "open": round(s.get("f17", 0), 2),
            "high": round(s.get("f15", 0), 2),
            "low": round(s.get("f16", 0), 2),
        })

    # 按市盈率从低到高排序
    result.sort(key=lambda x: x["pe"])

    print(f"筛选完成：{len(result)} 只股票符合条件（{PE_MIN} < PE(TTM) < {PE_MAX} 且 市值>{MARKET_CAP_MIN}亿）")
    return result


def generate_output(stocks):
    """生成 JSON 输出文件"""
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 北京时间
    tz_beijing = timezone(timedelta(hours=8))
    now = datetime.now(tz_beijing)

    output = {
        "update_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "update_timestamp": int(now.timestamp()),
        "filters": {
            "pe_min": PE_MIN,
            "pe_max": PE_MAX,
            "pe_type": "TTM",
            "market_cap_min_yi": MARKET_CAP_MIN,
            "exclude_st": True,
            "exclude_negative_pe": True,
        },
        "total": len(stocks),
        "stocks": stocks,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ 结果已写入: {OUTPUT_FILE}")
    print(f"   更新时间: {output['update_time']}")
    print(f"   符合条件: {output['total']} 只")

    # 打印前 10 只作为预览
    if stocks:
        print(f"\n{'代码':<8} {'名称':<10} {'市盈率':>8} {'市值(亿)':>10} {'涨跌幅':>8}")
        print("-" * 50)
        for s in stocks[:10]:
            print(f"{s['code']:<8} {s['name']:<10} {s['pe']:>8.2f} {s['market_cap']:>10.2f} {s['change_pct']:>+7.2f}%")


def main():
    print("=" * 60)
    print(f"A股价值筛选 — {PE_MIN} < PE(TTM) < {PE_MAX} 且 市值>{MARKET_CAP_MIN}亿")
    print(f"运行时间: {datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    stocks = fetch_stock_data()
    filtered = filter_stocks(stocks)
    generate_output(filtered)

    print("\n✅ 完成！")


if __name__ == "__main__":
    main()
