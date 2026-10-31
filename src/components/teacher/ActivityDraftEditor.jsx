import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * Editable review of a drafted activity. Every generated question, answer and
 * explanation stays editable before a teacher approves it.
 */
export default function ActivityDraftEditor({ activity, onChange, disabled }) {
  if (activity.type === "quiz") {
    const questions = activity.questions || [];
    const patchQuestion = (index, patch) =>
      onChange({
        questions: questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
      });
    return (
      <div className="space-y-4">
        {questions.map((question, index) => (
          <fieldset key={question.id} className="rounded-3xl border border-border bg-paper p-4">
            <legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-navy-500">
              Question {index + 1}
            </legend>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`prompt-${question.id}`}>Question</Label>
                <Input
                  id={`prompt-${question.id}`}
                  value={question.prompt}
                  disabled={disabled}
                  onChange={(e) => patchQuestion(index, { prompt: e.target.value })}
                />
              </div>

              <RadioGroup
                value={String(question.correctIndex)}
                onValueChange={(value) => patchQuestion(index, { correctIndex: Number(value) })}
                disabled={disabled}
                aria-label={`Which answer is correct for question ${index + 1}`}
                className="space-y-2"
              >
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={String(optionIndex)}
                      id={`q${question.id}-opt${optionIndex}`}
                      aria-label={`Mark option ${optionIndex + 1} as correct`}
                    />
                    <Input
                      value={option}
                      disabled={disabled}
                      aria-label={`Option ${optionIndex + 1}`}
                      onChange={(e) =>
                        patchQuestion(index, {
                          options: question.options.map((o, i) => (i === optionIndex ? e.target.value : o)),
                        })
                      }
                    />
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs font-semibold text-inkMuted">
                The circle marks the correct answer. Students never see it before they check.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor={`explain-${question.id}`}>Explanation shown after answering</Label>
                <Textarea
                  id={`explain-${question.id}`}
                  rows={2}
                  value={question.explanation}
                  disabled={disabled}
                  onChange={(e) => patchQuestion(index, { explanation: e.target.value })}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-coral-600"
                disabled={disabled || questions.length === 1}
                onClick={() => onChange({ questions: questions.filter((_, i) => i !== index) })}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove question
              </Button>
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={disabled}
          onClick={() =>
            onChange({
              questions: [
                ...questions,
                {
                  id: `q${questions.length + 1}-${Date.now().toString().slice(-4)}`,
                  prompt: "",
                  options: ["", "", "", ""],
                  correctIndex: 0,
                  explanation: "",
                },
              ],
            })
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a question
        </Button>
      </div>
    );
  }

  if (activity.type === "match") {
    const pairs = activity.pairs || [];
    return (
      <div className="space-y-3">
        {pairs.map((pair, index) => (
          <div key={pair.id} className="grid gap-2 rounded-3xl border border-border bg-paper p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`left-${pair.id}`}>Word or picture {index + 1}</Label>
              <Input
                id={`left-${pair.id}`}
                value={pair.left}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ pairs: pairs.map((p, i) => (i === index ? { ...p, left: e.target.value } : p)) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`right-${pair.id}`}>What it means</Label>
              <Input
                id={`right-${pair.id}`}
                value={pair.right}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ pairs: pairs.map((p, i) => (i === index ? { ...p, right: e.target.value } : p)) })
                }
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={disabled}
          onClick={() =>
            onChange({
              pairs: [...pairs, { id: `p${pairs.length + 1}-${Date.now().toString().slice(-4)}`, left: "", right: "" }],
            })
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a pair
        </Button>
      </div>
    );
  }

  const parts = activity.parts || [];
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Passage with answers filled in</Label>
        <p className="rounded-3xl border border-border bg-paper p-4 text-lg leading-loose text-ink">
          {parts.map((part, index) =>
            part.blankId ? (
              <span key={index} className="mx-1 inline-flex align-middle">
                <Input
                  className="h-9 w-36"
                  value={part.answer}
                  disabled={disabled}
                  aria-label={`Answer for gap ${index + 1}`}
                  onChange={(e) =>
                    onChange({ parts: parts.map((p, i) => (i === index ? { ...p, answer: e.target.value } : p)) })
                  }
                />
              </span>
            ) : (
              <span key={index}>{part.text}</span>
            )
          )}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="word-bank">Word bank (separate words with a comma)</Label>
        <Input
          id="word-bank"
          value={(activity.wordBank || []).join(", ")}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              wordBank: e.target.value
                .split(",")
                .map((w) => w.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </div>
  );
}