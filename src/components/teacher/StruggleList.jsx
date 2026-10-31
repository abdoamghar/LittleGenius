import React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Check, TrendingUp } from "lucide-react";
import ProgressMeter from "@/components/common/ProgressMeter";
import { StatusPill } from "@/components/common/StateBlocks";

const LEVELS = {
  "needs-support": { label: "Needs support", tone: "coral", icon: AlertTriangle, pattern: "dots" },
  "getting-there": { label: "Getting there", tone: "sun", icon: TrendingUp, pattern: "stripes" },
  strong: { label: "Strong", tone: "leaf", icon: Check, pattern: "none" },
};

/** Lessons where a class is finding the work hard, with the evidence in words. */
export default function StruggleList({ struggles }) {
  if (!struggles?.length) {
    return (
      <p className="rounded-3xl bg-cream px-4 py-4 text-sm text-inkMuted">
        No activity results to summarise yet. As students submit activities, the lessons that need a second
        look will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {struggles.map((row) => {
        const level = LEVELS[row.level];
        const Icon = level.icon;
        return (
          <li key={row.id} className="lg-card space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-ink">{row.lessonTitle}</p>
                <p className="text-xs font-semibold text-inkMuted">
                  {row.courseTitle} · {row.activityTitle} · {row.className}
                </p>
              </div>
              <StatusPill tone={level.tone} icon={Icon}>
                {level.label}
              </StatusPill>
            </div>
            <ProgressMeter
              value={row.avgScore}
              label={`Average score · ${row.submitted} of ${row.classSize} students have reached this`}
              tone={row.level === "needs-support" ? "coral" : row.level === "getting-there" ? "sun" : "leaf"}
              pattern={level.pattern}
              compact
            />
            <Link
              href={`/teacher/progress?class=${row.classId}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-600 hover:underline"
            >
              See which students are stuck
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}