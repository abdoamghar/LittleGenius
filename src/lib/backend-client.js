const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export async function request(path, options = {}) {
  if (!baseUrl) throw new Error("The backend API URL is not configured.");

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
    const data = await request("/api/auth/me");
    return frontendUser(data?.user);
  },

  async login(email, password, role) {
    const path = role === "teacher" ? "/api/teachers/login" : "/api/students/login";
    const data = await request(path, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
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
    return frontendUser(data?.user);
  },

  async updateProfile(details, role) {
    const path = role === "admin" ? "/api/teachers/profile" : "/api/students/profile";
    const data = await request(path, {
      method: "PUT",
      body: JSON.stringify({ name: details.full_name, phone: details.phone, bio: details.bio, avatar: details.avatar }),
    });
    return frontendUser(data?.user || data);
  },

  async logout(role) {
    const path = role === "admin" ? "/api/teachers/logout" : "/api/students/logout";
    await request(path, { method: "POST" });
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

