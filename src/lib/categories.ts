export const CATEGORY_GROUPS = [
  {
    name: "算法板子",
    description: "可复用的模板、套路和知识点速查。",
    accent: "var(--neon-accent)",
  },
  {
    name: "题解复盘",
    description: "比赛题解、错题复盘和解法整理。",
    accent: "var(--neon-green)",
  },
  {
    name: "学习笔记",
    description: "CS 学习、工程实践和课程记录。",
    accent: "var(--neon-purple)",
  },
  {
    name: "专题训练",
    description: "围绕某个主题持续收束的题目集合。",
    accent: "var(--neon-pink)",
  },
  {
    name: "碎碎念",
    description: "日常、记录和正在长出来的想法。",
    accent: "var(--neon-yellow)",
  },
] as const;

export function getCategoryColorClass(category: string): string {
  switch (category) {
    case "算法板子":
      return "category-template";
    case "题解复盘":
      return "category-solution";
    case "学习笔记":
      return "category-note";
    case "专题训练":
      return "category-topic";
    case "碎碎念":
      return "category-diary";
    default:
      return "";
  }
}
