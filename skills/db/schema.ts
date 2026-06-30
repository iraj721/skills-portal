import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ============================================
// ENUMS
// ============================================
export const userRoleEnum = pgEnum("user_role", ["student", "instructor", "admin"])
export const courseStatusEnum = pgEnum("course_status", ["draft", "pending", "published", "archived"])
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "completed", "dropped"])
export const submissionStatusEnum = pgEnum("submission_status", ["submitted", "graded", "resubmit"])
export const organizationStatusEnum = pgEnum("organization_status", ["pending", "approved", "rejected"])
export const videoTypeEnum = pgEnum("video_type", ["youtube", "vimeo", "upload"])
export const levelEnum = pgEnum("level", ["beginner", "intermediate", "advanced"])
export const batchStatusEnum = pgEnum("batch_status", ["upcoming", "open", "closed", "completed"])

// NEW ENUMS
export const quizTypeEnum = pgEnum("quiz_type", ["mcq", "true_false", "multiple_select"])
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late"])

// ============================================
// TABLES
// ============================================

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).unique(),
  password: varchar("password", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("student").notNull(),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  education: varchar("education", { length: 255 }),
  bio: text("bio"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Categories Table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Batches Table
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  batchNumber: integer("batch_number").notNull(),
  status: batchStatusEnum("status").default("upcoming").notNull(),
  maxCoursesPerStudent: integer("max_courses_per_student").default(3).notNull(),
  freelancingCompulsory: boolean("freelancing_compulsory").default(true).notNull(),
  enrollmentOpenDate: timestamp("enrollment_open_date").notNull(),
  enrollmentCloseDate: timestamp("enrollment_close_date").notNull(),
  batchStartDate: timestamp("batch_start_date"),
  batchEndDate: timestamp("batch_end_date"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Batch Courses Table
export const batchCourses = pgTable("batch_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => batches.id, { onDelete: "cascade" }).notNull(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  isFreelancing: boolean("is_freelancing").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueBatchCourse: uniqueIndex("unique_batch_course").on(table.batchId, table.courseId),
}))

// Courses Table
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  thumbnailUrl: text("thumbnail_url"),
  categoryId: uuid("category_id").references(() => categories.id),
  instructorId: uuid("instructor_id").references(() => users.id).notNull(),
  status: courseStatusEnum("status").default("draft").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  isFree: boolean("is_free").default(true).notNull(),
  durationHours: integer("duration_hours"),
  level: levelEnum("level"),
  language: varchar("language", { length: 50 }).default("Urdu"),
  requirements: jsonb("requirements").$type<string[]>(),
  whatYouLearn: jsonb("what_you_learn").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("courses_status_idx").on(table.status),
  instructorIdx: index("courses_instructor_idx").on(table.instructorId),
  categoryIdx: index("courses_category_idx").on(table.categoryId),
  slugIdx: index("courses_slug_idx").on(table.slug),
}))

// Modules Table
export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  courseIdx: index("modules_course_idx").on(table.courseId),
}))

// Lessons Table
export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").references(() => modules.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  videoType: videoTypeEnum("video_type"),
  durationMinutes: integer("duration_minutes"),
  isFreePreview: boolean("is_free_preview").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  moduleIdx: index("lessons_module_idx").on(table.moduleId),
}))

// Enrollments Table
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  batchId: uuid("batch_id").references(() => batches.id),
  status: enrollmentStatusEnum("status").default("active").notNull(),
  progressPercent: integer("progress_percent").default(0),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
}, (table) => ({
  uniqueEnrollment: uniqueIndex("unique_enrollment").on(table.studentId, table.courseId),
  studentIdx: index("enrollments_student_idx").on(table.studentId),
  courseIdx: index("enrollments_course_idx").on(table.courseId),
  batchIdx: index("enrollments_batch_idx").on(table.batchId),
  statusIdx: index("enrollments_status_idx").on(table.status),
}))

// Assignments Table (UPDATED - added weekNumber)
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  moduleId: uuid("module_id").references(() => modules.id),
  weekNumber: integer("week_number"), // NEW
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  dueDate: timestamp("due_date"),
  totalMarks: integer("total_marks").default(100),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  courseIdx: index("assignments_course_idx").on(table.courseId),
}))

// Submissions Table
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id").references(() => assignments.id, { onDelete: "cascade" }).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  content: text("content"),
  attachmentUrl: text("attachment_url"),
  marksObtained: integer("marks_obtained"),
  feedback: text("feedback"),
  status: submissionStatusEnum("status").default("submitted").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  gradedAt: timestamp("graded_at"),
  gradedBy: uuid("graded_by").references(() => users.id),
}, (table) => ({
  assignmentIdx: index("submissions_assignment_idx").on(table.assignmentId),
  studentIdx: index("submissions_student_idx").on(table.studentId),
}))

// Progress Table
export const progress = pgTable("progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  lessonId: uuid("lesson_id").references(() => lessons.id).notNull(),
  isCompleted: boolean("is_completed").default(false),
  watchedPercent: integer("watched_percent").default(0),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  uniqueProgress: uniqueIndex("unique_progress").on(table.studentId, table.lessonId),
  studentIdx: index("progress_student_idx").on(table.studentId),
  lessonIdx: index("progress_lesson_idx").on(table.lessonId),
}))

// NEW: Quizzes Table
export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  moduleId: uuid("module_id").references(() => modules.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  timeLimitMinutes: integer("time_limit_minutes").default(15),
  passingMarks: integer("passing_marks").default(50),
  totalMarks: integer("total_marks").default(100),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  courseWeekIdx: index("quizzes_course_week_idx").on(table.courseId, table.weekNumber),
}))

// NEW: Quiz Questions Table
export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  questionType: quizTypeEnum("question_type").default("mcq").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswers: jsonb("correct_answers").$type<number[]>().notNull(),
  explanation: text("explanation"),
  marks: integer("marks").default(10),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  quizIdx: index("quiz_questions_quiz_idx").on(table.quizId),
}))

// NEW: Quiz Attempts Table
export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  answers: jsonb("answers").$type<Record<number, number[]>>().notNull(),
  score: integer("score").default(0),
  totalMarks: integer("total_marks").default(0),
  percentage: integer("percentage").default(0),
  isPassed: boolean("is_passed").default(false),
  timeTakenSeconds: integer("time_taken_seconds"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  uniqueAttempt: uniqueIndex("unique_quiz_attempt").on(table.quizId, table.studentId),
  studentIdx: index("quiz_attempts_student_idx").on(table.studentId),
}))

// NEW: Weekly Unlocks Table
export const weeklyUnlocks = pgTable("weekly_unlocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  weekNumber: integer("week_number").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  unlockDeadline: timestamp("unlock_deadline"),
  lessonsUnlocked: integer("lessons_unlocked").default(2),
  lessonsCompleted: integer("lessons_completed").default(0),
  assignmentCompleted: boolean("assignment_completed").default(false),
  quizCompleted: boolean("quiz_completed").default(false),
  attendanceMarked: boolean("attendance_marked").default(false),
  attendanceStatus: attendanceStatusEnum("attendance_status"),
}, (table) => ({
  uniqueWeek: uniqueIndex("unique_weekly_unlock").on(table.enrollmentId, table.weekNumber),
  enrollmentIdx: index("weekly_unlocks_enrollment_idx").on(table.enrollmentId),
}))

// NEW: Attendance Table
export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  weekNumber: integer("week_number").notNull(),
  lessonsWatched: integer("lessons_watched").default(0),
  totalLessonsRequired: integer("total_lessons_required").default(2),
  assignmentSubmitted: boolean("assignment_submitted").default(false),
  quizSubmitted: boolean("quiz_submitted").default(false),
  status: attendanceStatusEnum("status").default("absent").notNull(),
  markedAt: timestamp("marked_at").defaultNow().notNull(),
  markedBy: uuid("marked_by").references(() => users.id),
  notes: text("notes"),
}, (table) => ({
  uniqueAttendance: uniqueIndex("unique_attendance").on(table.enrollmentId, table.weekNumber),
  courseWeekIdx: index("attendance_course_week_idx").on(table.courseId, table.weekNumber),
  studentIdx: index("attendance_student_idx").on(table.studentId),
}))

// Certificates Table
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  certificateNumber: varchar("certificate_number", { length: 100 }).notNull().unique(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  pdfUrl: text("pdf_url"),
  isRevoked: boolean("is_revoked").default(false),
}, (table) => ({
  studentIdx: index("certificates_student_idx").on(table.studentId),
  courseIdx: index("certificates_course_idx").on(table.courseId),
}))

// Settings Table
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  keyIdx: index("settings_key_idx").on(table.key),
}))

// Organizations Table
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  website: text("website"),
  logoUrl: text("logo_url"),
  description: text("description"),
  status: organizationStatusEnum("status").default("pending").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("organizations_status_idx").on(table.status),
}))

// Instructor Profiles Table
export const instructorProfiles = pgTable("instructor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  expertise: jsonb("expertise").$type<string[]>(),
  experienceYears: integer("experience_years"),
  totalStudents: integer("total_students").default(0),
  totalCourses: integer("total_courses").default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  isVerified: boolean("is_verified").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("instructor_profiles_user_idx").on(table.userId),
  orgIdx: index("instructor_profiles_org_idx").on(table.organizationId),
}))

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("general"),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  readIdx: index("notifications_read_idx").on(table.isRead),
}))

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  instructorProfile: one(instructorProfiles, { fields: [users.id], references: [instructorProfiles.userId] }),
  courses: many(courses),
  enrollments: many(enrollments),
  submissions: many(submissions),
  quizAttempts: many(quizAttempts),
  attendance: many(attendance),
  notifications: many(notifications),
}))

export const instructorProfilesRelations = relations(instructorProfiles, ({ one }) => ({
  user: one(users, { fields: [instructorProfiles.userId], references: [users.id] }),
  organization: one(organizations, { fields: [instructorProfiles.organizationId], references: [organizations.id] }),
}))

export const batchesRelations = relations(batches, ({ many }) => ({
  batchCourses: many(batchCourses),
  enrollments: many(enrollments),
}))

export const batchCoursesRelations = relations(batchCourses, ({ one }) => ({
  batch: one(batches, { fields: [batchCourses.batchId], references: [batches.id] }),
  course: one(courses, { fields: [batchCourses.courseId], references: [courses.id] }),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  category: one(categories, { fields: [courses.categoryId], references: [categories.id] }),
  modules: many(modules),
  enrollments: many(enrollments),
  assignments: many(assignments),
  batchCourses: many(batchCourses),
  quizzes: many(quizzes),
}))

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
  assignments: many(assignments),
}))

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  progress: many(progress),
}))

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(users, { fields: [enrollments.studentId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  batch: one(batches, { fields: [enrollments.batchId], references: [batches.id] }),
  certificates: many(certificates),
  weeklyUnlocks: many(weeklyUnlocks),
  attendance: many(attendance),
}))

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  module: one(modules, { fields: [assignments.moduleId], references: [modules.id] }),
  submissions: many(submissions),
}))

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, { fields: [submissions.assignmentId], references: [assignments.id] }),
  student: one(users, { fields: [submissions.studentId], references: [users.id] }),
}))

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, { fields: [quizzes.courseId], references: [courses.id] }),
  module: one(modules, { fields: [quizzes.moduleId], references: [modules.id] }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}))

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
}))

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  student: one(users, { fields: [quizAttempts.studentId], references: [users.id] }),
}))

export const weeklyUnlocksRelations = relations(weeklyUnlocks, ({ one }) => ({
  enrollment: one(enrollments, { fields: [weeklyUnlocks.enrollmentId], references: [enrollments.id] }),
  course: one(courses, { fields: [weeklyUnlocks.courseId], references: [courses.id] }),
  student: one(users, { fields: [weeklyUnlocks.studentId], references: [users.id] }),
}))

export const attendanceRelations = relations(attendance, ({ one }) => ({
  enrollment: one(enrollments, { fields: [attendance.enrollmentId], references: [enrollments.id] }),
  course: one(courses, { fields: [attendance.courseId], references: [courses.id] }),
  student: one(users, { fields: [attendance.studentId], references: [users.id] }),
  markedByUser: one(users, { fields: [attendance.markedBy], references: [users.id] }),
}))

export const certificatesRelations = relations(certificates, ({ one }) => ({
  enrollment: one(enrollments, { fields: [certificates.enrollmentId], references: [enrollments.id] }),
  student: one(users, { fields: [certificates.studentId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}))

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdByUser: one(users, { fields: [organizations.createdBy], references: [users.id] }),
  instructorProfiles: many(instructorProfiles),
}))

export const progressRelations = relations(progress, ({ one }) => ({
  student: one(users, { fields: [progress.studentId], references: [users.id] }),
  lesson: one(lessons, { fields: [progress.lessonId], references: [lessons.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))