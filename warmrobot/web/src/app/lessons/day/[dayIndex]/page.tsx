import { LessonsDayPage } from '@/components/lessons/lessons-day-page';

export default async function DayRoute({
  params,
}: {
  params: Promise<{ dayIndex: string }>;
}) {
  const { dayIndex } = await params;
  const di = Math.max(0, Math.min(6, parseInt(dayIndex, 10) || 0));
  return <LessonsDayPage dayIndex={di} />;
}
