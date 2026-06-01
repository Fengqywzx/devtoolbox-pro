#!/usr/bin/env python3
万子轩的对话历史摘要工具
用法:
  python history_summary.py           # 列出所有会话摘要
  python history_summary.py --search 关键词  # 搜索会话
  python history_summary.py --recent 5        # 最近N次会话
  python history_summary.py --full 2026-05-25_22-12_xxx.md  # 查看完整会话
"""

import os
import re
import sys
from datetime import datetime
from pathlib import Path

CONVERSATIONS_DIR = Path.home() / ".claude" / "conversations"


def parse_conversation(filepath: Path) -> dict | None:
    """解析单个对话文件，提取元数据和关键信息"""
    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception:
        return None

    info = {
        "filename": filepath.name,
        "title": filepath.stem,
        "datetime": None,
        "rounds": 0,
        "topics": [],
        "keywords": [],
        "line_count": len(content.splitlines()),
    }

    # 提取日期时间
    dt_match = re.search(r"\*\*日期时间：\*\*\s*(.+?)$", content, re.MULTILINE)
    if dt_match:
        try:
            info["datetime"] = datetime.strptime(
                dt_match.group(1).strip(), "%Y-%m-%d %H:%M"
            )
        except ValueError:
            pass

    # 提取主题
    topic_match = re.search(r"\*\*主题：\*\*\s*(.+?)$", content, re.MULTILINE)
    if topic_match:
        info["title"] = topic_match.group(1).strip()

    # 统计对话轮次
    info["rounds"] = len(re.findall(r"^## 第.+轮$", content, re.MULTILINE))

    # 提取用户提问关键词
    user_lines = re.findall(r"\*\*用户：\*\*\s*(.+?)$", content, re.MULTILINE)
    info["topics"] = [line[:80] for line in user_lines]

    # 领域检测
    domain_keywords = {
        "计算机": ["代码", "程序", "算法", "编程", "API", "MCP", "Python", "Node",
                  "npm", "git", "CLI", "终端", "命令", "服务器", "数据库", "SQL"],
        "哲学": ["马克思", "黑格尔", "辩证", "唯物", "唯心", "哲学", "资本论",
                "矛盾论", "实践论", "意识形态", "历史唯物"],
        "数学/物理": ["数学", "物理", "方程", "计算", "模拟", "电路", "电子"],
        "工具配置": ["配置", "设置", "安装", "权限", "skill", "MCP", "hooks"],
    }
    found_domains = set()
    full_text = content.lower()
    for domain, kws in domain_keywords.items():
        if any(kw.lower() in full_text for kw in kws):
            found_domains.add(domain)
    info["domains"] = list(found_domains) if found_domains else ["综合"]

    return info


def list_all_sessions(search: str | None = None, recent: int | None = None):
    """列出所有会话，支持搜索和限制数量"""
    if not CONVERSATIONS_DIR.exists():
        print("📭 暂无历史对话记录。")
        return

    files = sorted(
        CONVERSATIONS_DIR.glob("*.md"),
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )

    if not files:
        print("📭 暂无历史对话记录。")
        return

    sessions = []
    for f in files:
        info = parse_conversation(f)
        if info:
            sessions.append(info)

    # 搜索过滤
    if search:
        search_lower = search.lower()
        sessions = [
            s
            for s in sessions
            if search_lower in s["filename"].lower()
            or any(search_lower in t.lower() for t in s["topics"])
        ]
        if not sessions:
            print(f"🔍 未找到包含「{search}」的对话记录。")
            return

    # 数量限制
    if recent and recent > 0:
        sessions = sessions[:recent]

    # 格式化输出
    print(f"\n📜 万子轩的历史对话档案（共 {len(sessions)} 次会话）")
    print("━" * 60)

    for i, s in enumerate(sessions, 1):
        dt_str = (
            s["datetime"].strftime("%Y-%m-%d %H:%M")
            if s["datetime"]
            else "未知时间"
        )
        domains_str = " | ".join(s["domains"])
        print(f"\n📅 {dt_str} | {s['title']}")
        print(f"   ├ 对话轮次：{s['rounds']} 轮")
        print(f"   ├ 涉及领域：{domains_str}")
        if s["topics"]:
            print(f"   └ 讨论要点：")
            for t in s["topics"][:5]:
                print(f"      · {t}")
            if len(s["topics"]) > 5:
                print(f"      · ... 还有 {len(s['topics']) - 5} 个话题")

    print("\n" + "━" * 60)
    print("💡 输入 |历史 搜索词 可以筛选 | |历史 最近N 查看最近N次")


def show_full_session(filename: str):
    """显示完整会话内容"""
    filepath = CONVERSATIONS_DIR / filename
    if not filepath.exists():
        # 尝试模糊匹配
        matches = list(CONVERSATIONS_DIR.glob(f"*{filename}*"))
        if matches:
            filepath = matches[0]
        else:
            print(f"❌ 未找到对话文件：{filename}")
            return

    content = filepath.read_text(encoding="utf-8")
    print(f"\n{'=' * 60}")
    print(content)
    print(f"{'=' * 60}")


def main():
    args = sys.argv[1:]

    if not args:
        list_all_sessions()
    elif "--search" in args:
        idx = args.index("--search")
        query = args[idx + 1] if idx + 1 < len(args) else ""
        list_all_sessions(search=query)
    elif "--recent" in args:
        idx = args.index("--recent")
        n = int(args[idx + 1]) if idx + 1 < len(args) else 5
        list_all_sessions(recent=n)
    elif "--full" in args:
        idx = args.index("--full")
        filename = args[idx + 1] if idx + 1 < len(args) else ""
        show_full_session(filename)
    elif "--help" in args or "-h" in args:
        print(__doc__)
    else:
        # 默认当作搜索词处理
        list_all_sessions(search=args[0])


if __name__ == "__main__":
    main()
