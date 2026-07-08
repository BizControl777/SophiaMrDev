"use client"

import { useAuth } from "@/components/auth-provider"
import { StudentDashboard } from "@/components/dashboard/student-view"
import { TeacherDashboard } from "@/components/dashboard/teacher-view"
import { AdminDashboard } from "@/components/dashboard/admin-view"

export default function DashboardPage() {
  const { user, role } = useAuth()

  if (!user) return null

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard name={user.name} />
    case 'TEACHER':
      return <TeacherDashboard name={user.name} />
    default:
      return <StudentDashboard name={user.name} />
  }
}
