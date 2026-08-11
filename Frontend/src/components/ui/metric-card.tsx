"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";
import { AnimatedCounter } from "./animated-counter";

interface MetricCardProps {
  label: string;
  value: number;
  growth?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: React.ReactNode;
  iconBg?: string;
  delay?: number;
  dark?: boolean;
}

export function MetricCard({
  label,
  value,
  growth,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon,
  iconBg = "bg-blue-100",
  delay = 0,
  dark = false,
}: MetricCardProps) {
  const isPositive = (growth ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "rounded-3xl p-6",
        dark
          ? "bg-white/5 border border-white/10 text-white"
          : "bg-white border border-slate-100 shadow-soft"
      )}
    >
      <div className="flex items-start justify-between">
        <span className={clsx("inline-flex rounded-2xl p-3", iconBg)}>
          {icon}
        </span>
        {growth !== undefined && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>

      <p className={clsx("mt-5 text-3xl font-bold tracking-tight", dark ? "text-white" : "text-ink")}>
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
      </p>
      <p className={clsx("mt-1 text-sm", dark ? "text-white/60" : "text-slate-500")}>
        {label}
      </p>
    </motion.div>
  );
}
