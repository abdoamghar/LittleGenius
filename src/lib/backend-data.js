import { request } from "@/lib/backend-client";

const idOf = (value) => (typeof value === "object" && value ? value._id || value.id : value);
const statusToUi = (status) => (status === "published" ? "approved" : status);
const typeToApi = (type) => ({ quiz: "mcq", match: "matching", fill: "fill_in_the_blanks" })[type] || type;
const typeToUi = (type) => ({ mcq: "quiz", matching: "match", fill_in_the_blanks: "fill" })[type] || type;
const jsonContent = (value) => {
  if (typeof value !== "string") return value || {};
  try { return JSON.parse(value); } catch { return { intro: value, paragraphs: [] }; }
};
const ageLevel = (band = "") => (/10.?12/.test(band) ? "intermediate" : "beginner");

function mapCourse(raw) {
  return {
    ...raw,
    id: idOf(raw),
    subject: raw.subject || "Science",
    art: raw.art || "plantScience",
    ageBand: raw.ageBand || "Ages 8–10",
    summary: raw.summary || raw.description || "",
    outcomes: raw.outcomes || [],
    status: raw.status || "draft",
    teacherName: raw.teacher?.name || "Your teacher",
    updated: raw.updatedAt ? new Date(raw.updatedAt).toLocaleDateString() : "Recently",
  };
}

function mapActivity(raw, context = {}, student = false) {
  const content = raw.content || {};
  const type = typeToUi(raw.type);
  const base = {
    id: idOf(raw),
    courseId: context.courseId || idOf(raw.course),
    lessonId: context.lessonId || idOf(raw.section),
    courseTitle: context.courseTitle || "",
    lessonTitle: context.lessonTitle || "",
    title: raw.title,
    instructions: raw.instructions || "Try each part, then check your answers.",
    type,
    status: statusToUi(raw.status),
    origin: raw.isAiGenerated ? "ai" : "teacher",
    art: raw.art || context.art || "plantScience",
    explanation: raw.explanation || "",
  };
  if (type === "quiz") {
    const questions = Array.isArray(content.questions) ? content.questions : [content];
    return { ...base, questions: questions.map((q, index) => {
      const options = q.options || [];
      const correctAnswer = q.correctAnswer ?? q.answer ?? options[q.correctIndex];
      const correctIndex = Number.isInteger(q.correctIndex)
        ? q.correctIndex
        : options.findIndex((option) => String(option).trim().toLowerCase() === String(correctAnswer ?? "").trim().toLowerCase());
      return {
        id: String(q.id ?? `q${index + 1}`),
        prompt: q.prompt || q.question || "",
        options,
        ...(student ? {} : { correctIndex, correctAnswer }),
        explanation: q.explanation || "",
      };
    }) };
  }
  if (type === "match") {
    const pairs = content.pairs || [];
    if (student && content.rightOptions) {
      return {
        ...base,
        leftItems: pairs.map((pair, index) => ({ id: String(pair.id ?? index), text: pair.left })),
        rightItems: content.rightOptions.map((text, index) => ({ id: `option-${index}`, value: text, text })),
      };
    }
    return { ...base, pairs: pairs.map((pair, index) => ({ id: String(pair.id ?? index), left: pair.left, right: pair.right })) };
  }
  const parts = content.parts || [];
  return {
    ...base,
    wordBank: content.wordBank || [],
    parts: parts.map((part) => part.blankId || part.id
      ? { blankId: String(part.blankId || part.id), ...(student ? {} : { answer: part.answer || part.correctAnswer || "" }) }
      : { text: part.text || "" }),
  };
}

async function getCourseTree(courseId, student = false) {
  const rawCourse = await request(`/api/courses/${courseId}`);
  const course = mapCourse(rawCourse);
  const chapters = await request(`/api/chapters/course/${courseId}`);
  course.chapters = await Promise.all(chapters.map(async (rawChapter) => {
    const chapterId = idOf(rawChapter);
    const sections = await request(`/api/sections/chapter/${chapterId}`);
    const lessons = await Promise.all(sections.map(async (section) => {
      const lessonId = idOf(section);
      const lesson = { ...jsonContent(section.content), id: lessonId, title: section.title, chapterId, chapterTitle: rawChapter.title };
      const activities = await request(`/api/activities/section/${lessonId}`);
      lesson.activities = activities.map((item) => mapActivity(item, { courseId, courseTitle: course.title, lessonId, lessonTitle: lesson.title, art: lesson.art || course.art }, student));
      return lesson;
    }));
    return { ...rawChapter, id: chapterId, lessons };
  }));
  return course;
}

function progressFor(course, completedIds = []) {
  const lessons = course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ ...lesson, chapterTitle: chapter.title })));
  const activities = lessons.flatMap((lesson) => lesson.activities || []).filter((activity) => activity.status === "approved");
  const completed = new Set(completedIds);
  let passedCurrent = false;
  const lessonStates = lessons.map((lesson, index) => {
    const lessonActivities = (lesson.activities || []).filter((a) => a.status === "approved");
    const done = lessonActivities.length > 0 && lessonActivities.every((a) => completed.has(a.id));
    const state = done ? "complete" : !passedCurrent ? (passedCurrent = true, "current") : "upcoming";
    return { ...lesson, index, total: lessons.length, state };
  });
  const completedActivities = activities.filter((activity) => completed.has(activity.id)).length;
  const completedLessons = lessonStates.filter((lesson) => lesson.state === "complete").length;
  const progress = activities.length ? completedActivities / activities.length : (lessons.length ? completedLessons / lessons.length : 0);
  const nextLesson = lessonStates.find((lesson) => lesson.state !== "complete") || null;
  const nextActivity = (nextLesson?.activities || []).find((activity) => !completed.has(activity.id)) || null;
  return {
    course,
    lessons: lessonStates,
    progress,
    completedLessons,
    totalLessons: lessons.length,
    completedActivities,
    totalActivities: activities.length,
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
    nextActivity: nextActivity ? { id: nextActivity.id, type: nextActivity.type, title: nextActivity.title } : null,
    finished: lessons.length > 0 && lessonStates.every((lesson) => lesson.state === "complete"),
  };
}

async function completedForCourse(courseId) {
  const result = await request(`/api/students/progress/${courseId}/completed`);
  return [...new Set((result.details || []).map((item) => idOf(item.activity)))];
}

async function myAttempts() {
  const data = await request("/api/students/my-activities");
  return data.history || [];
}

async function studentProfile() {
  return request("/api/students/profile");
}

async function myStudentCourses() {
  const rawCourses = await request("/api/courses");
  return Promise.all(rawCourses.map(async (raw) => {
    const course = await getCourseTree(idOf(raw), true);
    const completed = await completedForCourse(course.id);
    return progressFor(course, completed);
  }));
}

function mappedClass(raw) {
  const classes = idOf(raw);
  return {
    ...raw,
    id: classes,
    nickname: raw.nickname || "",
    grade: raw.gradeLevel || "",
    room: raw.room || "",
    studentIds: (raw.students || []).map(idOf),
    courseIds: (raw.assignedCourses || []).map(idOf),
  };
}

function totalFor(activity) {
  if (activity.type === "quiz") return activity.questions?.length || 0;
  if (activity.type === "match") return activity.pairs?.length || activity.leftItems?.length || 0;
  return activity.parts?.filter((part) => part.blankId).length || 0;
}

function mappedAttempt(result) {
  if (!result) return null;
  return {
    score: result.correctAnswers ?? Math.round((result.score || 0) * (result.totalQuestions || 0) / 100),
    total: result.totalQuestions || 0,
    completedAt: result.completedAt ? new Date(result.completedAt).toLocaleDateString() : "Recently",
    answers: result.studentAnswers || {},
    perItem: (result.perItem || []).map((item) => ({ ...item, itemId: item.id || item.itemId })),
  };
}

export const backendData = {
  async getStudentHome() {
    const [student, courses] = await Promise.all([studentProfile(), myStudentCourses()]);
    const klass = student.enrolledClasses?.[0];
    const totals = courses.reduce((value, entry) => ({
      completedActivities: value.completedActivities + entry.completedActivities,
      totalActivities: value.totalActivities + entry.totalActivities,
    }), { completedActivities: 0, totalActivities: 0 });
    const today = courses.find((entry) => entry.nextActivity) || courses.find((entry) => entry.nextLesson) || null;
    return {
      student: { ...student, id: idOf(student) },
      className: klass ? `${klass.name}${klass.nickname ? ` · ${klass.nickname}` : ""}` : "No class yet",
      teacherName: klass?.teacher?.name || "your teacher",
      courses,
      today,
      totals,
    };
  },

  async getStudentCourses() { return myStudentCourses(); },

  async getCourseForStudent(courseId) {
    const [course, completed] = await Promise.all([getCourseTree(courseId, true), completedForCourse(courseId)]);
    const summary = progressFor(course, completed);
    const resume = summary.nextLesson || summary.lessons.at(-1) || null;
    return { ...summary, enrolled: true, resumeLessonId: resume?.id || null, teacherName: course.teacherName };
  },

  async getLessonForStudent(lessonId) {
    const courses = await myStudentCourses();
    for (const entry of courses) {
      const course = entry.course;
      const lessons = course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ ...lesson, chapterTitle: chapter.title })));
      const index = lessons.findIndex((lesson) => lesson.id === lessonId);
      if (index < 0) continue;
      const current = lessons[index];
      const lessonStates = entry.lessons;
      const activities = current.activities || [];
      const attempts = await myAttempts();
      const attempt = attempts.find((row) => idOf(row.activity) === activities[0]?.id);
      return {
        lesson: current,
        chapterTitle: current.chapterTitle,
        course: { id: course.id, title: course.title, subject: course.subject, art: course.art },
        position: { index: index + 1, total: lessons.length },
        prevLessonId: index > 0 ? lessons[index - 1].id : null,
        nextLessonId: index < lessons.length - 1 ? lessons[index + 1].id : null,
        activity: activities[0] ? { id: activities[0].id, type: activities[0].type, title: activities[0].title } : null,
        attempt: mappedAttempt(attempt),
        path: lessonStates.map((lesson) => ({ id: lesson.id, title: lesson.title, state: lesson.state })),
      };
    }
    throw new Error("That lesson is not assigned to your account.");
  },

  async getActivityForStudent(activityId) {
    const raw = await request(`/api/activities/${activityId}`);
    const courses = await request("/api/courses");
    for (const item of courses) {
      const course = await getCourseTree(idOf(item), true);
      for (const chapter of course.chapters) {
        const lesson = chapter.lessons.find((entry) => entry.activities?.some((a) => a.id === activityId));
        if (lesson) return mapActivity(raw, { courseId: course.id, courseTitle: course.title, lessonId: lesson.id, lessonTitle: lesson.title, art: lesson.art || course.art }, true);
      }
    }
    throw new Error("That activity is not assigned to your account.");
  },

  async checkAnswer(activityId, payload) {
    let answers;
    if (payload.questionId) answers = { [payload.questionId]: payload.optionIndex };
    else answers = payload.pairs || payload.blanks || {};
    const data = await request(`/api/activities/${activityId}/check`, { method: "POST", body: JSON.stringify({ answers }) });
    const results = (data.results || []).map((row) => ({ ...row, itemId: row.id }));
    return { correct: data.correctAnswers === data.totalQuestions, score: data.correctAnswers, total: data.totalQuestions, answer: results.map((row) => row.answer).join(", "), explanation: results.map((row) => row.explanation).filter(Boolean).join(" "), results };
  },

  async submitActivity(activityId, answers) {
    const data = await request(`/api/activities/${activityId}/submit`, { method: "POST", body: JSON.stringify({ answers }) });
    return { attempt: mappedAttempt(data), courseProgress: null };
  },

  async getAttempt(activityId) {
    const [history, activity] = await Promise.all([myAttempts(), request(`/api/activities/${activityId}`).catch(() => null)]);
    const rawAttempt = history.find((row) => idOf(row.activity) === activityId) || null;
    if (!activity) throw new Error("That activity is not available.");
    const attempts = await request("/api/courses");
    let context = {};
    for (const item of attempts) {
      const course = await getCourseTree(idOf(item), true);
      for (const chapter of course.chapters) {
        const lesson = chapter.lessons.find((entry) => entry.activities?.some((a) => a.id === activityId));
        if (lesson) context = { courseId: course.id, courseTitle: course.title, lessonId: lesson.id, lessonTitle: lesson.title, art: course.art };
      }
    }
    const mapped = mapActivity(activity, context, false);
    return { activity: { id: mapped.id, title: mapped.title, type: mapped.type, lessonId: mapped.lessonId, courseId: mapped.courseId }, lessonTitle: context.lessonTitle || "", course: { id: context.courseId, title: context.courseTitle, art: context.art }, attempt: mappedAttempt(rawAttempt), studentName: (await studentProfile()).name, nextLessonId: null, nextActivity: null, courseProgress: null };
  },

  async getStudentProgress() {
    const [student, courses, history] = await Promise.all([studentProfile(), myStudentCourses(), myAttempts()]);
    const klass = student.enrolledClasses?.[0];
    const totals = courses.reduce((value, entry) => ({ completed: value.completed + entry.completedActivities, total: value.total + entry.totalActivities, lessonsDone: value.lessonsDone + entry.completedLessons, lessonsTotal: value.lessonsTotal + entry.totalLessons }), { completed: 0, total: 0, lessonsDone: 0, lessonsTotal: 0 });
    return { student, className: klass?.name || "No class yet", courses: courses.map((entry) => ({ ...entry, activities: entry.course.chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.activities || [])).map((activity) => ({ ...activity, attempt: mappedAttempt(history.find((row) => idOf(row.activity) === activity.id)) })) })), totals };
  },

  async listTeacherCourses() {
    const rows = await request("/api/courses");
    return Promise.all(rows.map(async (raw) => {
      const course = await getCourseTree(idOf(raw));
      const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
      const activities = lessons.flatMap((lesson) => lesson.activities || []);
      const classes = await request("/api/classes");
      const assigned = classes.filter((klass) => (klass.assignedCourses || []).some((item) => idOf(item) === course.id));
      const approvedActivityIds = activities
        .filter((activity) => activity.status === "approved")
        .map((activity) => activity.id);
      const progressByClass = await Promise.all(assigned.map(async (klass) => {
        const studentIds = (klass.students || []).map(idOf);
        if (!studentIds.length) return [];
        const result = await request(`/api/classes/${idOf(klass)}/progress`);
        const records = result.progress || [];
        return studentIds.map((studentId) => {
          const completed = new Set(records
            .filter((record) => idOf(record.student) === studentId && idOf(record.course) === course.id)
            .map((record) => idOf(record.activity)));
          const completedCount = approvedActivityIds.filter((activityId) => completed.has(activityId)).length;
          return approvedActivityIds.length ? completedCount / approvedActivityIds.length : 0;
        });
      }));
      const studentProgress = progressByClass.flat();
      const avgProgress = studentProgress.length
        ? studentProgress.reduce((sum, progress) => sum + progress, 0) / studentProgress.length
        : 0;
      return {
        course,
        lessonCount: lessons.length,
        activityCount: approvedActivityIds.length,
        draftCount: activities.filter((activity) => activity.status === "pending_review").length,
        classes: assigned.map((klass) => ({ id: idOf(klass), name: klass.name, nickname: klass.nickname || "" })),
        studentCount: assigned.reduce((count, klass) => count + (klass.students?.length || 0), 0),
        avgProgress,
      };
    }));
  },

  async listClasses() {
    const rows = await request("/api/classes");
    return Promise.all(rows.map(async (raw) => {
      const klass = mappedClass(raw); const students = raw.students || [];
      const detail = await this.getClass(idOf(raw));
      return { kelas: klass, studentCount: students.length, courseCount: (raw.assignedCourses || []).length, avgProgress: detail.avgProgress, needingHelp: detail.roster.filter((row) => row.help).length };
    }));
  },

  async createClass(payload) {
    const raw = await request("/api/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mappedClass(raw);
  },

  async getClass(classId) {
    const rows = await request("/api/classes");
    const raw = rows.find((row) => idOf(row) === classId);
    if (!raw) throw new Error("That class is not available.");
    const progressData = await request(`/api/classes/${classId}/progress`);
    const records = progressData.progress || [];
    const kelas = mappedClass(raw);
    const trees = await Promise.all((raw.assignedCourses || []).map((c) => getCourseTree(idOf(c))));
    const courses = trees.map((course) => mapCourse({ ...course, teacher: raw.teacher }));
    const roster = (raw.students || []).map((student) => {
      const sid=idOf(student); const studentRows=records.filter((row)=>idOf(row.student)===sid);
      const courseRows=courses.map((course)=>{
        const activities=(trees.find((item)=>item.id===course.id)?.chapters.flatMap((chapter)=>chapter.lessons.flatMap((lesson)=>lesson.activities||[]))||[]).filter((activity)=>activity.status==="approved");
        const completeIds=new Set(studentRows.filter((row)=>idOf(row.course)===course.id).map((row)=>idOf(row.activity)));
        const completedActivities=activities.filter((activity)=>completeIds.has(activity.id)).length;
        return {courseId:course.id,title:course.title,progress:activities.length?completedActivities/activities.length:0,completedActivities,totalActivities:activities.length};
      });
      const avgProgress=courseRows.length?courseRows.reduce((sum,row)=>sum+row.progress,0)/courseRows.length:0;
      const recent=studentRows.map((row)=>new Date(row.completedAt).getTime()).filter(Number.isFinite).sort((a,b)=>b-a)[0];
      return {student:{...student,id:sid,classId,initials:student.name?.split(/\s+/).slice(0,2).map((part)=>part[0]).join("").toUpperCase(),lastActive:recent?new Date(recent).toLocaleDateString():"Not started"},courses:courseRows,avgProgress,help:avgProgress<0.4&&studentRows.length?"Progress is below 40% across assigned courses":null};
    });
    const avgProgress=roster.length?roster.reduce((sum,row)=>sum+row.avgProgress,0)/roster.length:0;
    return { kelas, courses, roster, avgProgress };
  },

  async getClassStudent(classId, studentId) {
    const data = await this.getClass(classId);
    const row = data.roster.find((entry) => entry.student.id === studentId);
    if (!row) throw new Error("That learner is not in this class.");
    const courses=await Promise.all(data.courses.map(async(course)=>{
      const tree=await getCourseTree(course.id); const activityRows=await request(`/api/classes/${classId}/progress`);
      const records=(activityRows.progress||[]).filter((item)=>idOf(item.student)===studentId&&idOf(item.course)===course.id);
      const done=new Set(records.map((item)=>idOf(item.activity)));
      const lessons=tree.chapters.flatMap((chapter)=>chapter.lessons.map((lesson)=>({...lesson,chapterTitle:chapter.title}))).map((lesson)=>{const activities=(lesson.activities||[]).map((activity)=>({...activity,attempt:mappedAttempt(records.find((item)=>idOf(item.activity)===activity.id))}));return {...lesson,state:activities.length&&activities.every((item)=>done.has(item.id))?"complete":done.size?"current":"upcoming",activities};});
      const activities=lessons.flatMap((lesson)=>lesson.activities||[]);
      const completedActivities=activities.filter((activity)=>done.has(activity.id)).length;
      return {course:tree,progress:activities.length?completedActivities/activities.length:0,completedLessons:lessons.filter((lesson)=>lesson.state==="complete").length,totalLessons:lessons.length,completedActivities,totalActivities:activities.length,lessons:lessons.map((lesson)=>({id:lesson.id,title:lesson.title,state:lesson.state,activities:lesson.activities.map((activity)=>({id:activity.id,title:activity.title,type:activity.type}))})),activities:activities.map((activity)=>({id:activity.id,title:activity.title,type:activity.type,total:totalFor(activity),attempt:activity.attempt}))};
    }));
    return { student: row.student, kelas: data.kelas, courses, help: row.help, avgProgress: row.avgProgress };
  },

  async getTeacherDashboard() {
    const [classRows, courses, drafts, profile] = await Promise.all([request("/api/classes"), this.listTeacherCourses(), this.listDrafts(), request("/api/teachers/profile")]);
    const classDetails = await Promise.all(classRows.map((row) => this.getClass(idOf(row))));
    const classes = classRows.map((raw, index) => ({
      kelas: mappedClass(raw),
      studentCount: (raw.students || []).length,
      courseCount: (raw.assignedCourses || []).length,
      avgProgress: classDetails[index].avgProgress,
      needingHelp: classDetails[index].roster.filter((row) => row.help).length,
    }));
    const needsHelp = classDetails.flatMap((detail) => detail.roster
      .filter((row) => row.help)
      .map((row) => ({
        student: row.student,
        className: detail.kelas.nickname ? `${detail.kelas.name} · ${detail.kelas.nickname}` : detail.kelas.name,
        reason: row.help,
        progress: row.avgProgress,
      })));
    const activityRows = await Promise.all(classes.map(async (entry) => {
      const data = await request(`/api/classes/${entry.kelas.id}/progress`);
      return (data.progress || []).map((record) => {
        const completedAt = new Date(record.completedAt);
        const score = Number(record.score || 0);
        const activityTitle = record.activity?.title || "a learning activity";
        const courseTitle = record.course?.title;
        return {
          id: idOf(record),
          timestamp: completedAt.getTime(),
          kind: score < 50 ? "help" : "complete",
          who: record.student?.name || "A student",
          text: score < 50
            ? `scored ${score}% on “${activityTitle}”${courseTitle ? ` in ${courseTitle}` : ""}`
            : `completed “${activityTitle}”${courseTitle ? ` in ${courseTitle}` : ""}`,
          when: Number.isNaN(completedAt.getTime()) ? "Recently" : completedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
        };
      });
    }));
    const events = activityRows.flat().sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
    const studentCount = classes.reduce((sum, row) => sum + row.studentCount, 0);
    return { teacher: profile, classes, events, needsHelp, pendingDrafts: drafts.pending, counts: { classes: classes.length, students: studentCount, courses: courses.length, published: courses.filter((row) => row.course.status === "published").length, drafts: drafts.pending.length } };
  },

  async getCourseEditor(courseId) {
    const [course, classRows] = await Promise.all([getCourseTree(courseId), request("/api/classes")]);
    const assigned = new Set((course.assignedClasses || []).map(idOf));
    return { course, classes: classRows.map((row) => ({ id: idOf(row), name: row.name, nickname: row.nickname || "", assigned: assigned.has(idOf(row)) })) };
  },

  async createCourse(payload) {
    const ageBand = payload.ageBand || "Ages 8–10";
    const raw = await request("/api/courses", { method: "POST", body: JSON.stringify({ title: payload.title, description: payload.summary || payload.title, summary: payload.summary || "", subject: payload.subject || "Science", art: payload.subject === "Maths" ? "fractions" : payload.subject === "Reading" ? "reading" : "plantScience", ageBand, outcomes: [], level: ageLevel(ageBand) }) });
    const chapter = await request("/api/chapters", { method: "POST", body: JSON.stringify({ title: "Chapter 1", description: "First chapter", course: idOf(raw), order: 0 }) });
    const lesson = { minutes: 7, summary: "", intro: "", paragraphs: [], examples: [], keyIdea: "", keyWords: [], art: payload.subject === "Maths" ? "fractions" : payload.subject === "Reading" ? "reading" : "plantScience", diagram: null };
    await request("/api/sections", { method: "POST", body: JSON.stringify({ title: "New lesson", content: JSON.stringify(lesson), chapter: idOf(chapter), order: 0 }) });
    return getCourseTree(idOf(raw));
  },

  async saveCourseDraft(courseId, patch) {
    const current = await getCourseTree(courseId);
    const band = patch.ageBand || current.ageBand;
    const updated = await request(`/api/courses/${courseId}`, { method: "PUT", body: JSON.stringify({ title: patch.title, description: patch.summary, summary: patch.summary, subject: patch.subject, ageBand: band, outcomes: patch.outcomes, level: ageLevel(band) }) });
    for (const [chapterIndex, chapter] of (patch.chapters || []).entries()) {
      const chapterBody = { title: chapter.title, description: chapter.description || chapter.title, course: courseId, order: chapterIndex };
      let savedChapter;
      if (/^[a-f\d]{24}$/i.test(chapter.id)) savedChapter = await request(`/api/chapters/${chapter.id}`, { method: "PUT", body: JSON.stringify(chapterBody) });
      else savedChapter = await request("/api/chapters", { method: "POST", body: JSON.stringify(chapterBody) });
      for (const [lessonIndex, lesson] of (chapter.lessons || []).entries()) {
        const lessonContent = Object.fromEntries(Object.entries(lesson).filter(([key]) => !["id", "chapterId", "chapterTitle", "activities"].includes(key)));
        const { id } = lesson;
        const body = { title: lesson.title, content: JSON.stringify(lessonContent), chapter: idOf(savedChapter) || chapter.id, order: lessonIndex };
        if (/^[a-f\d]{24}$/i.test(id)) await request(`/api/sections/${id}`, { method: "PUT", body: JSON.stringify(body) });
        else await request("/api/sections", { method: "POST", body: JSON.stringify(body) });
      }
    }
    return { ...mapCourse(updated), chapters: patch.chapters || current.chapters };
  },

  async publishCourse(courseId) {
    const course = await getCourseTree(courseId);
    const activities = course.chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.activities || []));
    if (!activities.some((activity) => activity.status === "approved")) throw new Error("Add at least one approved activity before publishing.");
    return request(`/api/courses/${courseId}`, { method: "PUT", body: JSON.stringify({ status: "published" }) });
  },

  async assignCourse(courseId, classIds) {
    if (!classIds.length) throw new Error("Choose at least one class to assign.");
    for (const classId of classIds) await request(`/api/classes/${classId}/assign-course`, { method: "POST", body: JSON.stringify({ courseId }) });
    return classIds;
  },

  async listDrafts() {
    const courses = await request("/api/courses"); const items=[];
    for (const raw of courses) {
      const course=await getCourseTree(idOf(raw));
      for(const chapter of course.chapters) for(const lesson of chapter.lessons) for(const activity of lesson.activities||[]) if(activity.origin==="ai") items.push({id:activity.id,title:activity.title,type:activity.type,status:activity.status,draftedFrom:`Lesson text: ${lesson.title}`,draftedOn:"Recently",approvedOn:activity.status==="approved"?"Approved":null,courseId:course.id,courseTitle:course.title,lessonTitle:lesson.title,questionCount:totalFor(activity)});
    }
    return { pending: items.filter((item)=>item.status==="pending_review"), approved: items.filter((item)=>item.status==="approved") };
  },

  async getDraftForReview(activityId) {
    const raw=await request(`/api/activities/${activityId}`);
    const courses=await request("/api/courses");
    for(const item of courses){const course=await getCourseTree(idOf(item));for(const chapter of course.chapters){const lesson=chapter.lessons.find((entry)=>entry.activities?.some((a)=>a.id===activityId));if(lesson)return {activity:lesson.activities.find((a)=>a.id===activityId),courseTitle:course.title,lessonTitle:lesson.title,lessonId:lesson.id,courseId:course.id};}}
    return {activity:mapActivity(raw),courseTitle:"",lessonTitle:"",lessonId:idOf(raw.section),courseId:idOf(raw.course)};
  },

  async lessonsForDrafting() {
    const rows=await request("/api/courses"); const out=[];
    for(const raw of rows){const course=await getCourseTree(idOf(raw));out.push({id:course.id,title:course.title,subject:course.subject,lessons:course.chapters.flatMap((chapter)=>chapter.lessons.map((lesson)=>({id:lesson.id,title:lesson.title,summary:lesson.summary||"",keyIdea:lesson.keyIdea||"",keyWordCount:(lesson.keyWords||[]).length}))) });}
    return out;
  },

  async generateDraft({courseId,lessonId,type}) {
    const course=await getCourseTree(courseId); const lesson=course.chapters.flatMap((chapter)=>chapter.lessons).find((item)=>item.id===lessonId);
    if(!lesson) throw new Error("Choose a lesson first.");
    const exampleText=(lesson.examples||[]).map((example)=>typeof example==="string"?example:[example.title,example.text,example.explanation].filter(Boolean).join(": "));
    const keywordText=(lesson.keyWords||[]).map((entry)=>typeof entry==="string"?entry:[entry.word,entry.definition].filter(Boolean).join(": "));
    const lessonContent=[lesson.summary,lesson.intro,...(lesson.paragraphs||[]),...exampleText,lesson.keyIdea,...keywordText].filter((part)=>typeof part==="string"&&part.trim()).join("\n");
    const data=await request("/api/ai/activities",{method:"POST",body:JSON.stringify({sectionId:lessonId,lessonContent,type:typeToApi(type),difficulty:"easy",title:`${type === "quiz" ? "Check your understanding" : type === "match" ? "Match the key words" : "Fill in the missing words"}: ${lesson.title}`})});
    return mapActivity(data.activity,{courseId,courseTitle:course.title,lessonId,lessonTitle:lesson.title,art:lesson.art||course.art},false);
  },

  async updateDraft(activityId, patch) {
    const current=await request(`/api/activities/${activityId}`); const type=typeToUi(current.type);
    const content=type==="quiz"?{questions:(patch.questions||[]).map((q)=>({id:q.id,prompt:q.prompt,options:q.options,correctIndex:q.correctIndex,correctAnswer:q.options?.[q.correctIndex],explanation:q.explanation}))}:type==="match"?{pairs:patch.pairs||[]}: {wordBank:patch.wordBank||[],parts:(patch.parts||[]).map((p)=>p.blankId?{id:p.blankId,blankId:p.blankId,answer:p.answer,correctAnswer:p.answer}:{text:p.text})};
    const data=await request(`/api/activities/${activityId}`,{method:"PUT",body:JSON.stringify({title:patch.title,content})});
    return mapActivity(data,{},false);
  },

  async approveDraft(activityId) {
    const data=await request(`/api/activities/${activityId}`,{method:"PUT",body:JSON.stringify({status:"published"})}); return mapActivity(data,{},false);
  },

  async discardDraft(activityId) { return request(`/api/activities/${activityId}`,{method:"DELETE"}); },

  async getTeacherProgress() {
    const classes=await this.listClasses();
    const detailed=await Promise.all(classes.map(async(entry)=>{
      const data=await this.getClass(entry.kelas.id);
      const courseStats=data.courses.map((course)=>({course,completion:data.roster.length?data.roster.reduce((sum,student)=>sum+(student.courses.find((row)=>row.courseId===course.id)?.progress||0),0)/data.roster.length:0,studentCount:data.roster.length,atRisk:data.roster.filter((student)=>(student.courses.find((row)=>row.courseId===course.id)?.progress||0)<0.4).length}));
      return {...entry,courseStats,struggles:[]};
    }));
    return {classes:detailed,struggles:[]};
  },
};
