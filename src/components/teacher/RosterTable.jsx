import React from "react";
import Link from "next/link";
import { LifeBuoy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressMeter from "@/components/common/ProgressMeter";
import { StatusPill } from "@/components/common/StateBlocks";

const TONES = ["navy", "plum", "leaf"];

/** Class roster with each learner's progress across the class courses. */
export default function RosterTable({ roster, courses, onRemove }) {
  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1.4fr_repeat(2,1fr)_auto] gap-4 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-inkMuted lg:grid">
        <span>Student</span>
        {courses.slice(0, 2).map((course) => (
          <span key={course.id}>{course.title}</span>
        ))}
        <span className="text-right">Action</span>
      </div>

      <ul className="space-y-3">
        {roster.map((row) => (
          <li
            key={row.student.id}
            className="lg-card grid gap-4 p-4 lg:grid-cols-[1.4fr_repeat(2,1fr)_auto] lg:items-center"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy-100 text-xs font-bold text-navy-700">
                {row.student.initials}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-ink">{row.student.name}</p>
                <p className="text-xs font-semibold text-inkMuted">Last active {row.student.lastActive}</p>
                {row.help ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-coral-600">
                    <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
                    {row.help}
                  </p>
                ) : null}
              </div>
            </div>

            {row.courses.slice(0, 2).map((course, index) => (
              <ProgressMeter
                key={course.courseId}
                value={course.progress}
                label={`${course.completedActivities}/${course.totalActivities} activities`}
                tone={TONES[index % TONES.length]}
                pattern={index % 2 === 0 ? "dots" : "stripes"}
                compact
              />
            ))}

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <StatusPill tone={row.avgProgress >= 0.8 ? "leaf" : row.avgProgress >= 0.5 ? "sun" : "coral"}>
                {Math.round(row.avgProgress * 100)}% overall
              </StatusPill>
              <Link
                href={`/teacher/classes/${row.student.classId}/students/${row.student.id}`}
                className="text-sm font-bold text-navy-600 hover:underline"
              >
                View
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-coral-600"
                onClick={() => onRemove(row.student)}
                aria-label={`Remove ${row.student.name} from class`}
                title="Remove from class"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
