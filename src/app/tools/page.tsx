"use client";

import Link from "next/link";
import { useState } from "react";

type Base = 2 | 8 | 10 | 16;

function convertBase(value: string, from: Base, to: Base): string {
  try {
    const num = parseInt(value, from);
    if (isNaN(num)) return "无效输入";
    if (!isFinite(num)) return "数值溢出";
    return num.toString(to).toUpperCase();
  } catch {
    return "转换错误";
  }
}

function bitwiseOp(a: string, b: string, op: string, base: Base): string {
  try {
    const numA = parseInt(a, base);
    const numB = parseInt(b, base);
    if (isNaN(numA) || isNaN(numB)) return "无效输入";
    let result: number;
    switch (op) {
      case "AND": result = numA & numB; break;
      case "OR": result = numA | numB; break;
      case "XOR": result = numA ^ numB; break;
      case "NOT": result = ~numA; break;
      case "SHL": result = numA << numB; break;
      case "SHR": result = numA >> numB; break;
      case "LSHIFT": result = numA << numB; break;
      case "RSHIFT": result = numA >>> numB; break;
      default: return "未知操作";
    }
    return result.toString(base).toUpperCase();
  } catch {
    return "计算错误";
  }
}

export default function ToolsPage() {
  const [convFrom, setConvFrom] = useState<Base>(10);
  const [convTo, setConvTo] = useState<Base>(2);
  const [convValue, setConvValue] = useState("");

  const [bitA, setBitA] = useState("");
  const [bitB, setBitB] = useState("");
  const [bitOp, setBitOp] = useState("AND");
  const [bitBase, setBitBase] = useState<Base>(2);

  const convResult = convertBase(convValue, convFrom, convTo);
  const bitResult = bitwiseOp(bitA, bitB, bitOp, bitBase);

  const quickConvert = (val: string) => {
    setConvValue(val);
  };

  const bases: { value: Base; label: string }[] = [
    { value: 2, label: "BIN (2)" },
    { value: 8, label: "OCT (8)" },
    { value: 10, label: "DEC (10)" },
    { value: 16, label: "HEX (16)" },
  ];

  const ops = [
    { value: "AND", label: "AND (&)" },
    { value: "OR", label: "OR (|)" },
    { value: "XOR", label: "XOR (^)" },
    { value: "NOT", label: "NOT (~)" },
    { value: "SHL", label: "SHL (<<)" },
    { value: "SHR", label: "SHR (>>)" },
  ];

  const getBaseResult = (value: string, from: Base) => {
    try {
      const num = parseInt(value, from);
      if (isNaN(num)) return { bin: "-", oct: "-", dec: "-", hex: "-" };
      return {
        bin: num.toString(2).toUpperCase(),
        oct: num.toString(8).toUpperCase(),
        dec: num.toString(10),
        hex: num.toString(16).toUpperCase(),
      };
    } catch {
      return { bin: "-", oct: "-", dec: "-", hex: "-" };
    }
  };

  const convAll = getBaseResult(convValue, convFrom);

  const baseToKey = (v: Base) => v === 2 ? "bin" as const : v === 8 ? "oct" as const : v === 10 ? "dec" as const : "hex" as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          <span className="neon-text">⚡</span> 二进制工具箱
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
          &gt; ACM必备 | 进制转换 & 位运算
        </p>
        <div className="mt-2 h-[1px] bg-gradient-to-r from-neon-pink via-neon-yellow to-neon-blue opacity-50" />
      </div>

      <Link href="/blog-search-lab" className="cyber-card mb-6 block p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="page-kicker mb-2">Semantic Search</div>
            <h2 className="text-xl font-display font-semibold" style={{ color: "var(--owl-text)" }}>
              语义搜索实验室
            </h2>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--owl-textSecondary)" }}>
              用自然语言查博客片段，适合找算法学习、题目复盘和学习笔记里的相关内容。
            </p>
          </div>
          <span className="cyber-btn w-fit">打开搜索</span>
        </div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Base Converter */}
        <div className="cyber-card neon-border p-6">
          <h2 className="text-xl font-display font-bold mb-4 text-neon-pink">
            进制转换
          </h2>
          <div className="space-y-4">
            {/* From Base */}
            <div>
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 block">
                源进制
              </label>
              <div className="flex gap-2">
                {bases.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setConvFrom(b.value)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono transition-all border ${
                      convFrom === b.value
                        ? "bg-neon-pink/10 text-neon-pink border-neon-pink/30"
                        : "bg-gray-50 dark:bg-cyber-darker text-gray-500 border-transparent hover:border-neon-pink/20"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div>
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 block">
                输入值
              </label>
              <input
                type="text"
                value={convValue}
                onChange={(e) => setConvValue(e.target.value.replace(/[^0-9a-fA-F-]/g, ""))}
                placeholder={`输入 ${convFrom} 进制数...`}
                className="cyber-input font-mono"
              />
            </div>

            {/* Quick values */}
            <div>
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 block">
                快速输入
              </label>
              <div className="flex flex-wrap gap-1">
                {[0, 1, 42, 127, 255, 256, 1024, 65535, 2147483647].map((v) => (
                  <button
                    key={v}
                    onClick={() => quickConvert(String(v))}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-cyber-surface text-gray-500 hover:text-neon-pink hover:bg-neon-pink/10 transition-all"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="bg-gray-50 dark:bg-cyber-darker rounded-lg p-4 space-y-2">
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 block">
                转换结果
              </label>
              {bases.map((b) => (
                <div key={b.value} className="flex items-center gap-2">
                  <span className={`text-xs font-mono w-16 ${convTo === b.value ? "text-neon-pink" : "text-gray-400"}`}>
                    {b.label}
                  </span>
                  <code className={`flex-1 font-mono text-sm px-2 py-1 rounded ${
                    convTo === b.value
                      ? "bg-neon-pink/10 text-neon-pink border border-neon-pink/20"
                      : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {convAll[baseToKey(b.value)]}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bitwise Operations */}
        <div className="cyber-card neon-border-blue p-6">
          <h2 className="text-xl font-display font-bold mb-4 text-neon-blue">
            位运算
          </h2>
          <div className="space-y-4">
            {/* Base for bitwise */}
            <div>
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 block">
                运算进制
              </label>
              <div className="flex gap-2">
                {bases.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBitBase(b.value)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono transition-all border ${
                      bitBase === b.value
                        ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30"
                        : "bg-gray-50 dark:bg-cyber-darker text-gray-500 border-transparent hover:border-neon-blue/20"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input A */}
            <div>
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 block">
                操作数 A
              </label>
              <input
                type="text"
                value={bitA}
                onChange={(e) => setBitA(e.target.value.replace(/[^0-9a-fA-F-]/g, ""))}
                placeholder={`输入 ${bitBase} 进制数...`}
                className="cyber-input font-mono"
              />
            </div>

            {/* Operation */}
            <div>
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 block">
                运算
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ops.map((op) => (
                  <button
                    key={op.value}
                    onClick={() => setBitOp(op.value)}
                    className={`py-1.5 rounded text-xs font-mono transition-all border ${
                      bitOp === op.value
                        ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30"
                        : "bg-gray-50 dark:bg-cyber-darker text-gray-500 border-transparent hover:border-neon-blue/20"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input B (hidden for NOT) */}
            {bitOp !== "NOT" && (
              <div>
                <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 block">
                  操作数 B
                </label>
                <input
                  type="text"
                  value={bitB}
                  onChange={(e) => setBitB(e.target.value.replace(/[^0-9a-fA-F-]/g, ""))}
                  placeholder={`输入 ${bitBase} 进制数...`}
                  className="cyber-input font-mono"
                />
              </div>
            )}

            {/* Result */}
            <div className="bg-gray-50 dark:bg-cyber-darker rounded-lg p-4">
              <label className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 block">
                运算结果
              </label>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-neon-blue mb-2 break-all">
                  {bitResult}
                </div>
                <div className="text-xs font-mono text-gray-400">
                  {bitA || "0"} {bitOp} {bitOp !== "NOT" ? (bitB || "0") : ""}
                  {" = "}
                  {bitResult}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Table */}
      <div className="cyber-card neon-border-green p-6 mt-6">
        <h2 className="text-xl font-display font-bold mb-4 text-neon-green">
          常用位运算技巧
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-cyber-border">
                <th className="text-left py-2 px-3 font-mono text-gray-400">操作</th>
                <th className="text-left py-2 px-3 font-mono text-gray-400">表达式</th>
                <th className="text-left py-2 px-3 font-mono text-gray-400">说明</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-b border-gray-100 dark:border-cyber-border/50">
                <td className="py-2 px-3 text-neon-green">判断奇偶</td>
                <td className="py-2 px-3 text-gray-300">n & 1</td>
                <td className="py-2 px-3 text-gray-500">结果为1则奇数</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-cyber-border/50">
                <td className="py-2 px-3 text-neon-green">交换两数</td>
                <td className="py-2 px-3 text-gray-300">a ^= b; b ^= a; a ^= b</td>
                <td className="py-2 px-3 text-gray-500">不用临时变量</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-cyber-border/50">
                <td className="py-2 px-3 text-neon-green">取最低位</td>
                <td className="py-2 px-3 text-gray-300">n & (-n)</td>
                <td className="py-2 px-3 text-gray-500">lowbit操作</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-cyber-border/50">
                <td className="py-2 px-3 text-neon-green">置位</td>
                <td className="py-2 px-3 text-gray-300">n | (1 &lt;&lt; k)</td>
                <td className="py-2 px-3 text-gray-500">将第k位置1</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-cyber-border/50">
                <td className="py-2 px-3 text-neon-green">清位</td>
                <td className="py-2 px-3 text-gray-300">n & ~(1 &lt;&lt; k)</td>
                <td className="py-2 px-3 text-gray-500">将第k位清0</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-cyber-border/50">
                <td className="py-2 px-3 text-neon-green">翻转</td>
                <td className="py-2 px-3 text-gray-300">n ^ (1 &lt;&lt; k)</td>
                <td className="py-2 px-3 text-gray-500">翻转第k位</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-cyber-border/50">
                <td className="py-2 px-3 text-neon-green">统计1个数</td>
                <td className="py-2 px-3 text-gray-300">__builtin_popcount(n)</td>
                <td className="py-2 px-3 text-gray-500">GCC内置函数</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-neon-green">最高位1</td>
                <td className="py-2 px-3 text-gray-300">31 - __builtin_clz(n)</td>
                <td className="py-2 px-3 text-gray-500">n的二进制位数</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
