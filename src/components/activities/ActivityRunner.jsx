import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import QuizActivity from "@/components/activities/QuizActivity";
import MatchActivity from "@/components/activities/MatchActivity";
import FillActivity from "@/components/activities/FillActivity";
import FeedbackPanel from "@/components/activities/FeedbackPanel";

const TYPE_LABEL = { quiz: "Multiple choice", match: "Matching", fill: "Fill in the blanks" };

/** Runs any of the three activity types one step at a time. */
export default function ActivityRunner({ activity, onSubmit, submitting }) {
  const items = useMemo(
    () => (activity.type === "quiz" ? activity.questions.map((q) => ({ id: q.id })) : [{ id: "set" }]),
    [activity]
  );
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [pickedId, setPickedId] = useState(null);
  const [activeBlank, setActiveBlank] = useState(null);
  const [results, setResults] = useState({});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const stepKey = items[step].id;
  const result = results[stepKey] || null;
  const locked = Boolean(result);

  const blankCount = activity.type === "fill" ? activity.parts.filter((p) => p.blankId).length : 0;
  const answered =
    activity.type === "quiz"
      ? typeof answers[stepKey] === "number"
      : activity.type === "match"
      ? Object.keys(answers).length === activity.leftItems.length
      : Object.keys(answers).length === blankCount;

  const handlePick = (id) => {
    const isLeft = (value) => activity.leftItems.some((l) => l.id === value);
    const isRight = (value) => activity.rightItems.some((r) => r.id === value);

    if (!pickedId) {
      setPickedId(id);
      return;
    }
    if (pickedId === id) {
      setPickedId(null);
      return;
    }

    const pickedSide = isLeft(pickedId) ? "left" : isRight(pickedId) ? "right" : null;
    const tappedSide = isLeft(id) ? "left" : isRight(id) ? "right" : null;

    if (pickedSide && tappedSide && pickedSide !== tappedSide) {
      const leftId = pickedSide === "left" ? pickedId : id;
      const rightOption = activity.rightItems.find((r) => r.id === (pickedSide === "left" ? id : pickedId));
      setAnswers((prev) => {
        const stripped = Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== rightOption.value));
        return { ...stripped, [leftId]: rightOption.value };
      });
      setPickedId(null);
      return;
    }
    setPickedId(id);
  };

  const handleWord = (word) => {
    if (!activeBlank) return;
    setAnswers((prev) => ({ ...prev, [activeBlank]: word }));
    const nextEmpty = activity.parts.find(
      (p) => p.blankId && !answers[p.blankId] && p.blankId !== activeBlank
    );
    setActiveBlank(nextEmpty ? nextEmpty.blankId : null);
  };

  const check = async () => {
    setError("");
    setChecking(true);
    try {
      const payload =
        activity.type === "quiz"
          ? { questionId: stepKey, optionIndex: answers[stepKey] }
          : activity.type === "match"
          ? { pairs: answers }
          : { blanks: answers };
      const res = await api.checkAnswer(activity.id, payload);
      setResults((prev) => ({ ...prev, [stepKey]: res }));
    } catch (e) {
      setError(e.message || "We could not check that answer.");
    } finally {
      setChecking(false);
    }
  };

  const goNext = () => {
    if (step < items.length - 1) {
      setStep(step + 1);
      setPickedId(null);
      setActiveBlank(null);
      return;
    }
    onSubmit(answers);
  };

  const retryStep = () => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[stepKey];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-paper px-4 py-3">
        <span className="rounded-full bg-navy-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          {TYPE_LABEL[activity.type]}
        </span>
        <p className="text-sm font-semibold text-inkMuted">{activity.instructions}</p>
        <p className="ml-auto text-sm font-bold text-inkMuted">
          Step {step + 1} of {items.length}
        </p>
      </div>

      <div className="lg-card animate-lg-rise p-5 md:p-7">
        {activity.type === "quiz" ? (
          <QuizActivity
            question={activity.questions[step]}
            index={step}
            total={items.length}
            selected={answers[stepKey]}
            onSelect={(index) => setAnswers((prev) => ({ ...prev, [stepKey]: index }))}
            result={result}
            locked={locked || submitting}
          />
        ) : null}

        {activity.type === "match" ? (
          <MatchActivity
            leftItems={activity.leftItems}
            rightItems={activity.rightItems}
            matches={answers}
            pickedId={pickedId}
            onPick={handlePick}
            locked={locked || submitting}
            result={result}
            onUnmatch={(pairId) =>
              setAnswers((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== pairId)))
            }
          />
        ) : null}

        {activity.type === "fill" ? (
          <FillActivity
            parts={activity.parts}
            wordBank={activity.wordBank}
            values={answers}
            activeBlank={activeBlank}
            onBlankClick={(id) => setActiveBlank(id === activeBlank ? null : id)}
            onWordClick={handleWord}
            result={result}
            locked={locked || submitting}
          />
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
          {error}
        </p>
      ) : null}

      <FeedbackPanel result={result} onRetryStep={retryStep} />

      <div className="flex flex-wrap items-center gap-3">
        {step > 0 ? (
          <Button variant="outline" className="gap-2" onClick={() => setStep(step - 1)} disabled={submitting}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back a step
          </Button>
        ) : null}

        {!result ? (
          <Button size="lg" className="gap-2" onClick={check} disabled={!answered || checking || submitting}>
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Check my answer
              </>
            )}
          </Button>
        ) : (
          <Button size="lg" className="gap-2" onClick={goNext} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending your answers…
              </>
            ) : step < items.length - 1 ? (
              <>
                Next step
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                Finish activity
              </>
            )}
          </Button>
        )}
        {!answered && !result ? (
          <p className="text-sm font-semibold text-inkMuted">
            {activity.type === "quiz"
              ? "Choose an answer to check it."
              : activity.type === "match"
              ? "Pair every word with its meaning to check it."
              : "Fill in every gap to check it."}
          </p>
        ) : null}
      </div>
    </div>
  );
}