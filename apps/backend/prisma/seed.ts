import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding UYCHI MAJLIS database...");

  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: "SUPER_ADMIN" }, create: { name: "SUPER_ADMIN", description: "Tizim administratori", isSystem: true }, update: {} }),
    prisma.role.upsert({ where: { name: "DEPARTMENT_HEAD" }, create: { name: "DEPARTMENT_HEAD", description: "Bo'lim boshlig'i", isSystem: true }, update: {} }),
    prisma.role.upsert({ where: { name: "EMPLOYEE" }, create: { name: "EMPLOYEE", description: "Xodim", isSystem: true }, update: {} }),
  ]);

  const SUPER_ADMIN_ROLE = roles[0];
  const DEPT_HEAD_ROLE = roles[1];
  const EMPLOYEE_ROLE = roles[2];

  const permissionDefs = [
    { roleId: SUPER_ADMIN_ROLE.id, resource: "attendance", action: "read" },
    { roleId: SUPER_ADMIN_ROLE.id, resource: "attendance", action: "write" },
    { roleId: SUPER_ADMIN_ROLE.id, resource: "meeting", action: "create" },
    { roleId: SUPER_ADMIN_ROLE.id, resource: "user", action: "manage" },
    { roleId: SUPER_ADMIN_ROLE.id, resource: "report", action: "generate" },
    { roleId: SUPER_ADMIN_ROLE.id, resource: "admin", action: "access" },
  ];
  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { roleId_resource_action: { roleId: p.roleId, resource: p.resource, action: p.action } },
        create: { roleId: p.roleId, resource: p.resource, action: p.action },
        update: {},
      })
    )
  );

  const org = await prisma.organization.upsert({
    where: { id: "seed-org-001" },
    create: {
      id: "seed-org-001",
      name: "Toshkent shahar hokimligi",
      shortName: "Toshkent sh. hokimligi",
      address: "Toshkent sh., Amir Temur shoh ko'chasi, 13-uy",
      phone: "+998712321212",
      email: "info@toshkent.uz",
      latitude: 41.311081,
      longitude: 69.279737,
      geofenceRadius: 150,
      wifiSSID: "HOKIMLIK_WIFI",
    },
    update: {},
  });

  const adminDept = await prisma.department.upsert({
    where: { id: "seed-dept-admin" },
    create: {
      id: "seed-dept-admin",
      name: "Administratsiya",
      code: "ADMIN-001",
      organizationId: org.id,
    },
    update: {},
  });

  const hrDept = await prisma.department.upsert({
    where: { id: "seed-dept-hr" },
    create: {
      id: "seed-dept-hr",
      name: "Kadrlar bo'limi",
      code: "HR-001",
      organizationId: org.id,
    },
    update: {},
  });

  const financeDept = await prisma.department.upsert({
    where: { id: "seed-dept-fin" },
    create: {
      id: "seed-dept-fin",
      name: "Moliya bo'limi",
      code: "FIN-001",
      organizationId: org.id,
    },
    update: {},
  });

  const legalDept = await prisma.department.upsert({
    where: { id: "seed-dept-legal" },
    create: {
      id: "seed-dept-legal",
      name: "Yuridik bo'lim",
      code: "LEG-001",
      organizationId: org.id,
    },
    update: {},
  });

  const departments = [adminDept, hrDept, financeDept, legalDept];

  const employees = [
    { phone: "+998901234567", fullName: "Anvar Karimov", roleId: SUPER_ADMIN_ROLE.id, deptIdx: 0, position: "Bosh mutaxassis", email: "anvar@toshkent.uz" },
    { phone: "+998901234568", fullName: "Gulnora Ahmedova", roleId: DEPT_HEAD_ROLE.id, deptIdx: 1, position: "Bo'lim boshlig'i", email: "gulnora@toshkent.uz" },
    { phone: "+998901234569", fullName: "Bobur Islomov", roleId: EMPLOYEE_ROLE.id, deptIdx: 2, position: "Mutaxassis", email: "bobur@toshkent.uz" },
    { phone: "+998901234570", fullName: "Dilnoza Rahimova", roleId: EMPLOYEE_ROLE.id, deptIdx: 1, position: "Kadrlar mutaxassisi", email: "dilnoza@toshkent.uz" },
    { phone: "+998901234571", fullName: "Eldor Tursunov", roleId: EMPLOYEE_ROLE.id, deptIdx: 3, position: "Yuriskonsult", email: "eldor@toshkent.uz" },
    { phone: "+998901234572", fullName: "Feruza Sattorova", roleId: EMPLOYEE_ROLE.id, deptIdx: 2, position: "Buxgalter", email: "feruza@toshkent.uz" },
    { phone: "+998901234573", fullName: "G'ani Nazarov", roleId: EMPLOYEE_ROLE.id, deptIdx: 1, position: "Inspektor", email: "gani@toshkent.uz" },
    { phone: "+998901234574", fullName: "Hilola Mirzayeva", roleId: EMPLOYEE_ROLE.id, deptIdx: 0, position: "Kotib", email: "hilola@toshkent.uz" },
    { phone: "+998901234575", fullName: "Ibrohim Yodgorov", roleId: DEPT_HEAD_ROLE.id, deptIdx: 2, position: "Bo'lim boshlig'i", email: "ibrohim@toshkent.uz" },
    { phone: "+998901234576", fullName: "Kamola Askarova", roleId: DEPT_HEAD_ROLE.id, deptIdx: 3, position: "Bo'lim boshlig'i", email: "kamola@toshkent.uz" },
  ];

  for (const emp of employees) {
    const dept = departments[emp.deptIdx];
    const user = await prisma.user.upsert({
      where: { phone: emp.phone },
      create: {
        phone: emp.phone,
        fullName: emp.fullName,
        status: "ACTIVE",
        roleId: emp.roleId,
        organizationId: org.id,
        departmentId: dept.id,
      },
      update: {},
    });

    await prisma.employee.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        employeeCode: `EMP-${user.phone.slice(-4)}`,
        position: emp.position,
        email: emp.email,
        organizationId: org.id,
        departmentId: dept.id,
      },
      update: {},
    });
  }

  const meeting = await prisma.meeting.upsert({
    where: { id: "seed-meeting-001" },
    create: {
      id: "seed-meeting-001",
      title: "Haftalik yig'ilish",
      agenda: "1. O'tgan hafta yakunlari\n2. Rejalashtirilgan tadbirlar\n3. Turli masalalar",
      date: new Date(),
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      location: "Katta majlislar zali, 2-qavat",
      organizationId: org.id,
      createdById: (await prisma.employee.findFirst({ where: { user: { phone: "+998901234567" } } }))!.id,
      departmentId: adminDept.id,
      status: "SCHEDULED",
    },
    update: {},
  });

  const allEmployees = await prisma.employee.findMany();
  for (const emp of allEmployees) {
    await prisma.meetingParticipant.upsert({
      where: { meetingId_employeeId: { meetingId: meeting.id, employeeId: emp.id } },
      create: { meetingId: meeting.id, employeeId: emp.id, status: "PENDING" },
      update: {},
    });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(9, 0, 0, 0);

  for (let day = 0; day < 20; day++) {
    const checkInTime = new Date(startDate);
    checkInTime.setDate(checkInTime.getDate() + day);
    if (checkInTime.getDay() === 0 || checkInTime.getDay() === 6) continue;

    for (const emp of allEmployees.slice(0, 5)) {
      const checkIn = new Date(checkInTime);
      checkIn.setHours(8, 30 + Math.floor(Math.random() * 60), 0, 0);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          type: "CHECK_IN",
          date: checkIn,
          latitude: org.latitude! + (Math.random() - 0.5) * 0.001,
          longitude: org.longitude! + (Math.random() - 0.5) * 0.001,
          confidence: "HIGH",
          organizationId: org.id,
          timestamp: checkIn,
        },
      });

      const checkOut = new Date(checkIn);
      checkOut.setHours(17, 0 + Math.floor(Math.random() * 30), 0, 0);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          type: "CHECK_OUT",
          date: checkOut,
          latitude: org.latitude! + (Math.random() - 0.5) * 0.001,
          longitude: org.longitude! + (Math.random() - 0.5) * 0.001,
          confidence: "HIGH",
          organizationId: org.id,
          timestamp: checkOut,
        },
      });
    }
  }

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      checkInWindowStart: "08:00",
      checkInWindowEnd: "10:00",
      checkOutWindowStart: "17:00",
      checkOutWindowEnd: "19:00",
    },
    update: {},
  });

  const version = await prisma.appVersion.upsert({
    where: { id: "seed-app-version-001" },
    create: {
      id: "seed-app-version-001",
      platform: "ANDROID",
      version: "1.0.0",
      buildNumber: 1,
      minVersion: "1.0.0",
      minBuildNumber: 1,
      releaseNotes: "Birinchi versiya",
      isActive: true,
      publishedAt: new Date(),
    },
    update: {},
  });

  console.log("Seed completed successfully!");
  console.log("  Organizations: 1");
  console.log(`  Departments: ${departments.length}`);
  console.log(`  Employees: ${employees.length}`);
  console.log("  Meeting: 1");
  console.log("  Attendance records: ~100");
  console.log("");
  console.log("Demo accounts:");
  console.log("  +998901234567 (Super Admin) - Anvar Karimov");
  console.log("  +998901234568 (Department Head) - Gulnora Ahmedova");
  console.log("  +998901234569 (Employee) - Bobur Islomov");
  console.log("");
  console.log("OTP: 123456 (development only)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
