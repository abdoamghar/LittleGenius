import React from "react";
import Link from "next/link";
import { ClipboardList, FileEdit, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/common/StateBlocks";

const TYPE_LABEL = { quiz: "Quiz", match: "Matching", fill: "Fill in the blanks" };

/** Course editor outline: chapters, lessons and the activities inside each lesson. */
export default function CourseOutline({ chapters, onChange, disabled, onDraftActivity, onDeleteActivity, onInsertDemo }) {
  const patchChapter = (chapterId, patch) =>
    onChange(chapters.map((c) => (c.id === chapterId ? { ...c, ...patch } : c)));

  const patchLesson = (chapterId, lessonId, patch) =>
    onChange(
      chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, lessons: chapter.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) }
          : chapter
      )
    );

  return (
    <div className="space-y-5">
      {chapters.map((chapter, chapterIndex) => (
        <section key={chapter.id} className="lg-card space-y-4 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`chapter-${chapter.id}`}>Chapter {chapterIndex + 1} title</Label>
              <Input
                id={`chapter-${chapter.id}`}
                value={chapter.title}
                disabled={disabled}
                onChange={(e) => patchChapter(chapter.id, { title: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-coral-600"
              disabled={disabled || chapters.length === 1}
              title="Removing this chapter and saving will delete its lessons, activities, and saved results."
              onClick={() => onChange(chapters.filter((c) => c.id !== chapter.id))}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove chapter
            </Button>
          </div>

          <div className="space-y-3">
            {chapter.lessons.map((lesson, lessonIndex) => {
              const examples = Array.isArray(lesson.examples)
                ? lesson.examples.map((example) => typeof example === "string" ? example : example?.text || example?.title || "")
                : [];
              const keyWords = Array.isArray(lesson.keyWords)
                ? lesson.keyWords.map((entry) => typeof entry === "string"
                  ? { word: entry, hint: "", definition: "" }
                  : { ...entry, word: entry?.word || "", hint: entry?.hint || entry?.definition || "", definition: entry?.definition || entry?.hint || "" })
                : [];

              return (
              <article key={lesson.id} className="space-y-4 rounded-3xl border border-border bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">
                    Lesson {lessonIndex + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-coral-600"
                    disabled={disabled || chapter.lessons.length === 1}
                    title="Removing this lesson and saving will delete its activities and saved results."
                    onClick={() =>
                      patchChapter(chapter.id, { lessons: chapter.lessons.filter((l) => l.id !== lesson.id) })
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`lesson-title-${lesson.id}`}>Lesson title</Label>
                    <Input
                      id={`lesson-title-${lesson.id}`}
                      value={lesson.title}
                      disabled={disabled}
                      onChange={(e) => patchLesson(chapter.id, lesson.id, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`lesson-minutes-${lesson.id}`}>Reading time (minutes)</Label>
                    <Input
                      id={`lesson-minutes-${lesson.id}`}
                      type="number"
                      min={1}
                      value={lesson.minutes}
                      disabled={disabled}
                      onChange={(e) => patchLesson(chapter.id, lesson.id, { minutes: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor={`lesson-summary-${lesson.id}`}>Lesson summary</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={disabled}
                      onClick={() => onInsertDemo(chapter.id, lesson.id)}
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Fill Family Members demo
                    </Button>
                  </div>
                  <Textarea
                    id={`lesson-summary-${lesson.id}`}
                    rows={2}
                    value={lesson.summary}
                    disabled={disabled}
                    onChange={(e) => patchLesson(chapter.id, lesson.id, { summary: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`lesson-examples-${lesson.id}`}>Examples (one per line)</Label>
                  <Textarea
                    id={`lesson-examples-${lesson.id}`}
                    rows={3}
                    placeholder="For example: A sunflower bends its leaves toward bright light."
                    value={examples.join("\n")}
                    disabled={disabled}
                    onChange={(event) => patchLesson(chapter.id, lesson.id, {
                      examples: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean),
                    })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`lesson-big-idea-${lesson.id}`}>The big idea</Label>
                  <Textarea
                    id={`lesson-big-idea-${lesson.id}`}
                    rows={2}
                    placeholder="Write the one main idea students should remember."
                    value={lesson.keyIdea || ""}
                    disabled={disabled}
                    onChange={(event) => patchLesson(chapter.id, lesson.id, { keyIdea: event.target.value })}
                  />
                </div>

                <section className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label="Words to know">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-ink">Words to know</h3>
                      <p className="text-xs text-inkMuted">Add useful words and a short, child-friendly meaning.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={disabled}
                      onClick={() => patchLesson(chapter.id, lesson.id, {
                        keyWords: [...keyWords, { word: "", hint: "", definition: "" }],
                      })}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add a word
                    </Button>
                  </div>
                  {keyWords.length ? (
                    <div className="space-y-2">
                      {keyWords.map((entry, index) => (
                        <div key={`${lesson.id}-word-${index}`} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                          <Input
                            value={entry.word}
                            disabled={disabled}
                            placeholder="Word"
                            aria-label={`Vocabulary word ${index + 1}`}
                            onChange={(event) => patchLesson(chapter.id, lesson.id, {
                              keyWords: keyWords.map((word, wordIndex) => wordIndex === index
                                ? { ...word, word: event.target.value }
                                : word),
                            })}
                          />
                          <Input
                            value={entry.hint}
                            disabled={disabled}
                            placeholder="Meaning for students"
                            aria-label={`Meaning for vocabulary word ${index + 1}`}
                            onChange={(event) => patchLesson(chapter.id, lesson.id, {
                              keyWords: keyWords.map((word, wordIndex) => wordIndex === index
                                ? { ...word, hint: event.target.value, definition: event.target.value }
                                : word),
                            })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-coral-600"
                            disabled={disabled}
                            aria-label={`Remove vocabulary word ${index + 1}`}
                            onClick={() => patchLesson(chapter.id, lesson.id, {
                              keyWords: keyWords.filter((_, wordIndex) => wordIndex !== index),
                            })}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-cream px-3 py-2 text-sm text-inkMuted">No vocabulary added yet.</p>
                  )}
                </section>

                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-navy-500">
                    <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                    Activities in this lesson
                  </p>
                  {lesson.activities?.length ? (
                    <ul className="space-y-2">
                      {lesson.activities.map((activity) => (
                        <li
                          key={activity.id}
                          className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5"
                        >
                          <span className="flex-1 font-semibold text-ink">{activity.title}</span>
                          <span className="text-xs font-semibold text-inkMuted">
                            {TYPE_LABEL[activity.type]} · {activity.questionCount} questions
                          </span>
                          {activity.status === "approved" ? (
                            <StatusPill tone="leaf">Approved {activity.approvedOn || ""}</StatusPill>
                          ) : (
                            <>
                              <StatusPill tone="sun">Waiting for review</StatusPill>
                              <Link
                                href={`/teacher/activities/${activity.id}/review`}
                                className="text-xs font-bold text-navy-600 hover:underline"
                              >
                                Review
                              </Link>
                            </>
                          )}
                          {activity.origin === "ai" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-plum-600">
                              <Wand2 className="h-3 w-3" aria-hidden="true" />
                              AI drafted
                            </span>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-coral-600"
                            disabled={disabled}
                            onClick={() => onDeleteActivity(activity)}
                            aria-label={`Delete ${activity.title}`}
                            title="Delete activity"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-2xl bg-cream px-3 py-2.5 text-sm text-inkMuted">
                      No activities yet. Draft one from the lesson text — it stays hidden until you approve it.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={disabled}
                    onClick={() => onDraftActivity(lesson)}
                  >
                    <Wand2 className="h-4 w-4" aria-hidden="true" />
                    Draft an activity with AI
                  </Button>
                </div>
              </article>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={disabled}
              onClick={() =>
                patchChapter(chapter.id, {
                  lessons: [
                    ...chapter.lessons,
                    {
                      id: `${chapter.id}-l${chapter.lessons.length + 1}-${Date.now().toString().slice(-4)}`,
                      title: "New lesson",
                      minutes: 7,
                      summary: "",
                      intro: "",
                      paragraphs: [],
                      examples: [],
                      keyIdea: "",
                      keyWords: [],
                      art: null,
                      diagram: null,
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add lesson to this chapter
            </Button>
          </div>
        </section>
      ))}

      <Button
        type="button"
        variant="outline"
        className="gap-2"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...chapters,
            {
              id: `ch-${Date.now()}`,
              title: `Chapter ${chapters.length + 1}`,
              lessons: [
                {
                  id: `l-${Date.now()}-1`,
                  title: "New lesson",
                  minutes: 7,
                  summary: "",
                  intro: "",
                  paragraphs: [],
                  examples: [],
                  keyIdea: "",
                  keyWords: [],
                  art: null,
                  diagram: null,
                },
              ],
            },
          ])
        }
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add a chapter
      </Button>
      <p className="flex items-center gap-2 text-xs font-semibold text-inkMuted">
        <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />
        Changes stay here until saved. Removing a lesson or chapter and saving deletes its activities and results.
      </p>
    </div>
  );
}
