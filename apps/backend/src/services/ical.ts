import { prisma } from "./prisma";

interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendees?: { name?: string; email: string }[];
}

function formatICALDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICALText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function generateEvent(event: CalendarEvent): string {
  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${event.uid}`);
  lines.push(`DTSTAMP:${formatICALDate(new Date())}`);
  lines.push(`DTSTART:${formatICALDate(event.startTime)}`);
  lines.push(`DTEND:${formatICALDate(event.endTime)}`);
  lines.push(`SUMMARY:${escapeICALText(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICALText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICALText(event.location)}`);
  }
  if (event.organizerName) {
    lines.push(`ORGANIZER;CN=${escapeICALText(event.organizerName)}`);
  }
  for (const attendee of event.attendees || []) {
    const cn = attendee.name ? `;CN=${escapeICALText(attendee.name)}` : "";
    lines.push(`ATTENDEE${cn}:mailto:${attendee.email}`);
  }

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

export function generateCalendar(events: CalendarEvent[]): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//UYCHI MAJLIS//UZ//UZBEK");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("X-WR-CALNAME:UYCHI MAJLIS Uchrashuvlar");

  for (const event of events) {
    lines.push(generateEvent(event));
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function generateMeetingEvent(
  meeting: {
    id: string;
    title: string;
    agenda?: string | null;
    location?: string | null;
    startTime: Date;
    endTime?: Date | null;
    createdBy?: { user?: { fullName?: string | null } } | null;
    participants?: { employee?: { user?: { fullName?: string | null; phone?: string } } }[];
  }
): CalendarEvent {
  const endTime = meeting.endTime || new Date(meeting.startTime.getTime() + 60 * 60 * 1000);

  return {
    uid: `meeting-${meeting.id}@uychi-majlis.uz`,
    title: meeting.title,
    description: meeting.agenda || undefined,
    location: meeting.location || undefined,
    startTime: meeting.startTime,
    endTime,
    organizerName: meeting.createdBy?.user?.fullName || undefined,
    attendees: meeting.participants?.map((p) => ({
      name: p.employee?.user?.fullName || undefined,
      email: `${p.employee?.user?.phone}@uychi-majlis.uz` || "",
    })),
  };
}

export async function exportMeetingsCalendar(organizationId?: string): Promise<string> {
  const meetings = await prisma.meeting.findMany({
    where: organizationId ? { organizationId } : {},
    include: {
      participants: {
        include: { employee: { include: { user: { select: { fullName: true, phone: true } } } } },
      },
      createdBy: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  const events = meetings.map((m) => generateMeetingEvent(m));
  return generateCalendar(events);
}
