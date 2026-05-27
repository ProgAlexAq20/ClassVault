export type CalendarEvent = {
  id: string;
  classroomId?: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  type: "lesson" | "deadline" | "event" | "exam";
};
