import React from "react";
import Link from "next/link";
import { AlertTriangle, Check, TrendingUp } from "lucide-react";
import ProgressMeter from "@/components/common/ProgressMeter";
import { StatusPill } from "@/components/common/StateBlocks";

const LEVELS = {
  "needs-support": { label: "Needs support", tone: "coral", icon: AlertTriangle, pattern: "dots" },
  "getting-there": { label: "Getting there", tone: "sun", icon: TrendingUp, pattern: "stripes" },
  strong: { label: "Strong", tone: "leaf", icon: Check, pattern: "none" },
};

/** Class × course completion, labelled in words and marked with a pattern. */
export default function ProgressMatrix({ classes }) {
  return (
    <div className="space-y-5">
      {classes.map((entry) => (
        <section key={entry.kelas.id} className="lg-card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl font-bold text-ink">
              {entry.kelas.name} <span className="text-inkMuted">· {entry.kelas.nickname}</span>
            </h3>
            <Link
              href={`/teacher/classes/${entry.kelas.id}`}
              className="text-sm font-bold text-navy-600 hover:underline"
            >
              Open class
            </Link>
          </div>

          {entry.courseStats.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {entry.courseStats.map((stat, index) => {
                const level = LEVELS[stat.atRisk > 1 ? "needs-support" : stat.completion >= 0.75 ? "strong" : "getting-there"];
                const Icon = level.icon;
                return (
                  <li key={stat.course.id} className="space-y-2 rounded-3xl bg-paper p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-ink">{stat.course.title}</p>
                      <StatusPill tone={level.tone} icon={Icon}>
                        {level.label}
                      </StatusPill>
                    </div>
                    <ProgressMeter
                      value={stat.completion}
                      label={`${stat.studentCount} students enrolled`}
                      tone={["navy", "plum", "leaf"][index % 3]}
                      pattern={level.pattern}
                      compact
                    />
                    <p className="text-xs font-semibold text-inkMuted">
                      {stat.atRisk === 0
                        ? "Nobody below 40% completion."
                        : `${stat.atRisk} ${stat.atRisk === 1 ? "student is" : "students are"} below 40% completion.`}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl bg-cream px-3 py-2.5 text-sm text-inkMuted">
              No courses assigned to this class yet.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}