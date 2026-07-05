import { prisma } from "./prisma";
import { broadcast } from "./websocket";

interface SendMessageInput {
  senderEmployeeId: string;
  receiverEmployeeId: string;
  content: string;
  attachments?: string[];
}

export async function sendMessage(input: SendMessageInput) {
  const message = await prisma.message.create({
    data: {
      senderId: input.senderEmployeeId,
      receiverId: input.receiverEmployeeId,
      content: input.content,
      attachments: input.attachments || [],
    },
    include: {
      sender: { include: { user: { select: { id: true, fullName: true } } } },
      receiver: { include: { user: { select: { id: true, fullName: true } } } },
    },
  });

  broadcast(`employee:${input.receiverEmployeeId}`, "message:new", {
    id: message.id,
    senderName: message.sender.user.fullName,
    content: message.content,
    createdAt: message.createdAt,
  });

  return message;
}

export async function getConversations(employeeId: string) {
  const otherIds = await prisma.message.findMany({
    where: { OR: [{ senderId: employeeId }, { receiverId: employeeId }] },
    select: { senderId: true, receiverId: true },
  });

  const uniqueIds = new Set<string>();
  for (const m of otherIds) {
    if (m.senderId !== employeeId) uniqueIds.add(m.senderId);
    if (m.receiverId !== employeeId) uniqueIds.add(m.receiverId);
  }

  if (uniqueIds.size === 0) return [];

  const employees = await prisma.employee.findMany({
    where: { id: { in: Array.from(uniqueIds) } },
    include: { user: { select: { id: true, fullName: true } } },
  });

  const result = [];
  for (const emp of employees) {
    const lastMsg = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: employeeId, receiverId: emp.id },
          { senderId: emp.id, receiverId: employeeId },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { content: true, createdAt: true },
    });

    const unreadCount = await prisma.message.count({
      where: { senderId: emp.id, receiverId: employeeId, isRead: false },
    });

    result.push({
      employeeId: emp.id,
      fullName: emp.user.fullName,
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.createdAt || null,
      unreadCount,
    });
  }

  return result.sort((a, b) => {
    const aTime = a.lastMessageAt?.getTime() || 0;
    const bTime = b.lastMessageAt?.getTime() || 0;
    return bTime - aTime;
  });
}

export async function getMessages(
  employeeId: string,
  otherEmployeeId: string,
  limit: number = 50,
  offset: number = 0
) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: employeeId, receiverId: otherEmployeeId },
        { senderId: otherEmployeeId, receiverId: employeeId },
      ],
    },
    include: {
      sender: { include: { user: { select: { id: true, fullName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  await prisma.message.updateMany({
    where: {
      senderId: otherEmployeeId,
      receiverId: employeeId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return messages.reverse();
}

export async function getUnreadCount(employeeId: string): Promise<number> {
  return prisma.message.count({
    where: { receiverId: employeeId, isRead: false },
  });
}

export async function deleteMessage(messageId: string, employeeId: string): Promise<boolean> {
  const result = await prisma.message.deleteMany({
    where: { id: messageId, senderId: employeeId },
  });
  return result.count > 0;
}
