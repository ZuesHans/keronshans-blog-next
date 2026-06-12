export function toUrlSafeId(filename: string): string {
  const name = filename.replace(/\.md$/, "");
  const knownNames: Record<string, string> = {
    Diary: "diary",
    Trick: "trick",
    adhoc: "adhoc",
    "Constructive Algorithms": "constructive-algo",
    "三国杀武将": "sanguosha",
    对拍写法: "duipai-write",
    期望DP: "expected-dp",
    实现合集: "impl-collection",
    优化算法: "optimize-algo",
    单调栈单调队列: "monotone-stack-queue",
    二进制: "binary",
    计算几何: "computational-geometry",
    数据结构笔记本: "ds-notebook",
    数据结构: "data-structure",
    图论算法: "graph-algo",
    图论与搜索: "graph-search",
    奇思妙想小题目: "creative-problems",
    动态规划: "dynamic-programming",
    基础算法与杂: "basic-algo-misc",
    基础算法: "basic-algo",
    前缀和与差分: "prefix-sum-diff",
    数学: "math",
    贪心: "greedy",
    题目多解: "multi-solution",
    优化: "optimization",
    牛客寒假营典题: "nowcoder-winter-camp",
  };

  for (const [label, slug] of Object.entries(knownNames)) {
    if (name.includes(label)) {
      const prefix = name.split(label)[0].toLowerCase().replace(/[^a-z0-9-]/g, "");
      return `${prefix ? `${prefix}-` : ""}${slug}`;
    }
  }

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return `post-${Math.abs(hash).toString(36)}`;
}
