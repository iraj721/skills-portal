## Complete Learning Portal (LMS)

A comprehensive Learning Management System built for Pakistan Naujawan Party (PNP) to empower youth through skill development and online learning.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [Test Credentials](#test-credentials)
- [User Roles & Features](#user-roles--features)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Team Responsibilities](#team-responsibilities)
- [Deployment](#deployment)
- [License](#license)

---

## Project Overview

**Platform Name:** Naujawan Skills - Grow Pakistan Learning Portal

**Organization:** Pakistan Naujawan Party (PNP)

**Type:** Learning Management System (LMS) + Youth Development Portal

**Reference Platforms:** DigiSkills, Coursera, Udemy

---

## Features

### For Students
- Register/Login (Google OAuth + Email)
- Browse course catalog (search, filter by category/level)
- Enroll in free courses
- Watch video lessons (YouTube/Vimeo embed)
- Submit assignments and projects
- Track learning progress and attendance
- View grades and instructor feedback
- Download certificates upon completion
- Manage profile and settings

### For Instructors
- Access instructor dashboard (admin-created accounts)
- Create and manage courses (title, description, modules, lessons)
- Upload course content (videos, PDFs, assignments)
- View enrolled students and their progress
- Grade assignments and projects
- Track student attendance
- Generate certificates for completed students
- View course analytics (enrollments, completion rates)

### For Super Admin
- Platform dashboard with analytics
- Manage all users (students, instructors, admins)
- Approve/reject courses before publishing
- Approve/reject instructor applications
- Manage organizations/course providers
- View platform-wide reports and statistics
- Content moderation
- System configuration and settings

---

## Tech Stack

### Frontend
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components

### Backend
- **Next.js API Routes**
- **Drizzle ORM**
- **PostgreSQL** (via Supabase or local)
- **JWT Authentication**
- **bcrypt** for password hashing

### Third-Party Services
- **Google Login** (OAuth 2.0)
- **YouTube/Vimeo** (Video embedding)
- **Supabase** (Database + Auth + Storage)
- **Vercel** (Hosting/Deployment)
- **AWS S3 / Cloudflare R2** (File Storage)

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (local or Supabase)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/iraj721/skills-portal.git
cd skills-portal
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables** (see below)

4. **Run database migrations**

```bash
npm run db:migrate
# or
yarn db:migrate
```

5. **Start the development server**

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/naujawan_skills
# OR for Supabase
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# File Storage (Optional - for S3/R2)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=your-region
```

---

## Database Setup

### Schema Overview

The database includes the following tables:

| Table | Purpose |
|-------|---------|
| `users` | Students, instructors, admins |
| `courses` | Course information |
| `modules` | Course modules/chapters |
| `lessons` | Individual lessons |
| `assignments` | Course assignments |
| `submissions` | Student assignment submissions |
| `enrollments` | Student course enrollments |
| `certificates` | Generated certificates |
| `categories` | Course categories |
| `organizations` | Course providers |

### Running Migrations

Only the Tech Lead (Gul) should run migrations:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Studio (visual database editor)
npm run db:studio
```

---

## Running the Project

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## Test Credentials

Use these credentials to test different user roles:

| Role | Email | Password |
|------|-------|----------|
| **Student** | student@gmail.com | student |
| **Instructor** | instructor@gmail.com | instructor |
| **Admin** | admin@gmail.com | admin123 |

### How to Test

1. Open the application at `http://localhost:3000`
2. Click **"log In"**
3. Use any of the credentials above based on the role you want to test
4. Explore the features available for that role

---

## User Roles & Features

### Role 1: Student

**Registration:** Only students can self-register via the public registration page.

**Flow:**
1. Landing Page → Browse featured courses and categories
2. Registration/Login → Sign up with email or Google
3. Browse Courses → Search and filter courses
4. Course Detail → View course information
5. Enroll → Click "Enroll Now" for free courses
6. Start Learning → Watch videos, mark lessons complete
7. Submit Assignments → Complete and submit assignments
8. View Grades → Check marks and feedback
9. Complete Course → Get certificate at 100% progress

### Role 2: Instructor

**Registration:** Instructors are manually created by the Admin. They cannot self-register.

**Flow:**
1. Admin creates instructor account with specific username/password
2. Instructor logs in with provided credentials
3. Access Instructor Dashboard
4. Create Course → Add title, description, modules, lessons
5. Add Content → Upload videos or add YouTube/Vimeo links
6. Add Assignments → Set instructions, due dates, marks
7. Publish Course → Submit for admin review
8. Manage Students → View progress, grade submissions
9. Generate Certificates → Issue certificates to completed students

### Role 3: Super Admin

**Flow:**
1. Login at `/admin`
2. Dashboard → View platform analytics
3. Approve Pending Items → Instructors, courses, organizations
4. Manage Users → View, activate, deactivate accounts
5. Monitor Platform → Enrollment trends, course performance
6. System Settings → Configure platform settings

---

## Project Structure

```
naujawan-skills-portal/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Dashboard group routes
│   │   ├── student/
│   │   ├── instructor/
│   │   └── admin/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── courses/
│   │   ├── assignments/
│   │   └── ...
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   └── shared/                   # Shared components
├── db/                           # Database
│   ├── schema.ts                 # Drizzle schema
│   ├── index.ts                  # Database connection
│   └── migrations/               # Migration files
├── lib/                          # Utilities
│   ├── auth.ts                   # Auth utilities
│   ├── utils.ts                  # General utilities
│   └── validations.ts            # Zod schemas
├── public/                       # Static assets
├── types/                        # TypeScript types
├── .env.local                    # Environment variables
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user (instructor/admin) |
| GET | `/api/admin/courses` | List all courses |
| GET | `/api/admin/assignments` | List all assignments |
| GET | `/api/admin/certificates` | List all certificates |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List published courses |
| GET | `/api/courses/[id]` | Get course details |
| POST | `/api/courses` | Create course (instructor) |
| PUT | `/api/courses/[id]` | Update course |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Create assignment |
| POST | `/api/assignments/[id]/submit` | Submit assignment |

---

## Team Responsibilities

### Frontend Developer (Iraj)
- Student Portal UI (all pages, components)
- Super Admin Panel UI (all pages, components)
- Shared UI components (reusable across both)
- Responsive design (mobile-first)
- API integration (connect to backend)
- Mock data → Real data transition

### Backend Developer (Iraj)
- Database schema & migrations
- All API endpoints (Auth, Student, Instructor, Admin)
- Authentication & Authorization (JWT, roles)
- File upload handling (S3/R2)
- Certificate generation (PDF)
- Email notifications (if needed)
- Security & performance

### Tech Lead (Gul)
- Database migrations (only Gul does this)
- Code review (all PRs)
- Merge to develop/staging/main
- Secrets management (API keys, env variables)
- Deployment coordination
- Architecture decisions

---

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Feature Dependencies (Development Order)

| Phase | Feature | Depends On | Then Enables |
|-------|---------|------------|--------------|
| 1 | Auth (register/login) | Database | All user flows |
| 1 | User Profile | Auth | Profile pages |
| 2 | Course Catalog | Database + Auth | Browse courses |
| 2 | Course Detail | Course Catalog | View course info |
| 2 | Enrollment | Course Detail + Auth | Student enrollment |
| 2 | My Courses | Enrollment | Student dashboard |
| 3 | Video Player | My Courses | Watch lessons |
| 3 | Progress Tracking | Video Player | Track completion |
| 3 | Assignments | Course Content | Submit work |
| 3 | Submissions | Assignments | Grade work |
| 4 | Grading | Submissions | Student sees marks |
| 4 | Certificates | Grading + Progress | Generate certificates |
| 5 | Instructor Dashboard | Auth + Role | Instructor panel |
| 5 | Course Creation | Instructor Dashboard | Create courses |
| 5 | Content Upload | Course Creation | Add videos/lessons |
| 5 | Student Management | Course Published | Manage students |
| 6 | Admin Dashboard | Auth + Role | Admin panel |
| 6 | Approval System | Admin Dashboard | Approve courses |
| 6 | User Management | Admin Dashboard | Manage users |
| 6 | Reports | All above | Analytics |

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend APIs delayed | Frontend blocked | Use mock data, build UI first |
| Video upload issues | Course content blocked | Use YouTube/Vimeo links first |
| Auth system complex | Login delayed | Start with email/password, add Google later |
| Mobile responsive issues | Bad user experience | Mobile-first design from day 1 |
| Certificate PDF generation | Feature blocked | Use simple HTML certificate first |
| Team conflicts on Git | Code loss | Strict branch rules, daily pulls |

---

## Success Criteria

- [x] Student can register, login, browse, enroll, learn, submit, get certificate
- [x] Instructor can create course, upload content, manage students, grade, generate certificates
- [x] Admin can approve courses, manage users, view analytics
- [x] All pages are mobile responsive
- [x] Platform loads in under 3 seconds
- [x] No critical security vulnerabilities
- [x] Successfully deployed and live

---

## License

This project is proprietary software developed for Pakistan Naujawan Party (PNP).

---

## Support

For support, email: support@naujawanskills.pk

Or contact the Tech Lead: Gul

---

**Built with passion for Pakistan's youth development.**
