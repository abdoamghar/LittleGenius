const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const RESPONSE_CACHE_TTL = 5 * 60_000;
const RESPONSE_CACHE_LIMIT = 100;
const responseCache = new Map();
const pendingGets = new Map();
let cacheVersion = 0;

export function clearApiCache() {
  cacheVersion += 1;
  responseCache.clear();
  pendingGets.clear();
}

function copyResponse(data) {
  if (data == null) return data;
  if (typeof structuredClone === "function") return structuredClone(data);
  return JSON.parse(JSON.stringify(data));
}

async function fetchJson(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `The server returned ${response.status}.`);
  }
  return data;
}

export async function request(path, options = {}) {
  if (!baseUrl) throw new Error("The backend API URL is not configured.");

  const { skipCache = false, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const shouldCache = method === "GET" && !skipCache;

  // Writes invalidate every cached read so related pages stay in sync.
  if (method !== "GET") clearApiCache();

  if (!shouldCache) return fetchJson(path, fetchOptions);

  const cached = responseCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return copyResponse(cached.data);
  if (cached) responseCache.delete(path);

  const pending = pendingGets.get(path);
  if (pending) return copyResponse(await pending);

  const startedAtVersion = cacheVersion;
  const requestPromise = fetchJson(path, fetchOptions);
  pendingGets.set(path, requestPromise);
  try {
    const data = await requestPromise;
    if (startedAtVersion === cacheVersion) {
      responseCache.set(path, { data, expiresAt: Date.now() + RESPONSE_CACHE_TTL });
      if (responseCache.size > RESPONSE_CACHE_LIMIT) {
        responseCache.delete(responseCache.keys().next().value);
      }
    }
    return copyResponse(data);
  } finally {
    if (pendingGets.get(path) === requestPromise) pendingGets.delete(path);
  }
}

function frontendUser(user) {
  if (!user) return null;
  return {
    ...user,
    id: user.id || user._id,
    full_name: user.full_name || user.name,
    role: user.role === "teacher" ? "admin" : "user",
    studentId: user.role === "student" ? user.id || user._id : undefined,
  };
}

export const backendAuth = {
  async currentUser() {
    const data = await request("/api/auth/me", { skipCache: true });
    return frontendUser(data?.user);
  },

  async login(email, password, role) {
    const path = role === "teacher" ? "/api/teachers/login" : "/api/students/login";
    const data = await request(path, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    clearApiCache();
    return frontendUser(data?.user);
  },

  async register(details) {
    const teacher = details.role === "teacher";
    const path = teacher ? "/api/teachers/register" : "/api/students/register";
    const body = {
      name: details.name,
      email: details.email,
      password: details.password,
      ...(teacher ? { phone: details.phone } : { dateOfBirth: details.dateOfBirth, classCode: details.classCode }),
    };
    const data = await request(path, { method: "POST", body: JSON.stringify(body) });
    clearApiCache();
    return frontendUser(data?.user);
  },

  async updateProfile(details, role) {
    const isTeacher = ["admin", "teacher"].includes(role) ||
      (!role && (details.subject !== undefined || details.school !== undefined));
    const path = isTeacher ? "/api/teachers/profile" : "/api/students/profile";
    const data = await request(path, {
      method: "PUT",
      body: JSON.stringify({
        name: details.full_name ?? details.name,
        phone: details.phone,
        bio: details.bio,
        avatar: details.avatar,
        subject: details.subject,
        school: details.school,
        dateOfBirth: details.dateOfBirth,
      }),
    });
    return frontendUser(data?.user || data);
  },

  async logout(role) {
    const path = role === "admin" ? "/api/teachers/logout" : "/api/students/logout";
    try {
      await request(path, { method: "POST" });
    } finally {
      clearApiCache();
    }
  },

  async createStudent(details) {
    const data = await request(`/api/classes/${details.classId}/students`, {
      method: "POST",
      body: JSON.stringify({ name: details.name, email: details.email, password: details.password, dateOfBirth: details.dateOfBirth }),
    });
    const student = data?.student || {};
    return { student: { ...student, id: student.id || student._id, full_name: student.full_name || student.name, role: "user" }, password: details.password };
  },
};

