import { prisma } from "./prisma";

interface ImportRow {
  phone: string;
  fullName: string;
  departmentCode?: string;
  position?: string;
  email?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function importEmployees(
  data: ImportRow[],
  organizationId: string
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };
  const departments = await prisma.department.findMany({
    where: { organizationId },
  });
  const deptByCode = new Map(departments.map((d) => [d.code, d]));

  const defaultRole = await prisma.role.findFirst({
    where: { name: "EMPLOYEE" },
  });
  if (!defaultRole) {
    throw new Error("EMPLOYEE role not found. Run seed first.");
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    try {
      if (!row.phone || !/^\+998\d{9}$/.test(row.phone)) {
        result.failed++;
        result.errors.push({ row: rowNum, message: `Invalid phone: ${row.phone}` });
        continue;
      }

      if (!row.fullName || row.fullName.trim().length < 2) {
        result.failed++;
        result.errors.push({ row: rowNum, message: `Invalid name: ${row.fullName}` });
        continue;
      }

      const existingUser = await prisma.user.findUnique({ where: { phone: row.phone } });
      if (existingUser) {
        result.failed++;
        result.errors.push({ row: rowNum, message: `Phone already exists: ${row.phone}` });
        continue;
      }

      let departmentId: string | undefined;
      if (row.departmentCode) {
        const dept = deptByCode.get(row.departmentCode);
        if (!dept) {
          result.failed++;
          result.errors.push({ row: rowNum, message: `Department not found: ${row.departmentCode}` });
          continue;
        }
        departmentId = dept.id;
      }

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            phone: row.phone,
            fullName: row.fullName.trim(),
            status: "ACTIVE",
            roleId: defaultRole.id,
            organizationId,
            departmentId,
          },
        });

        const empCode = `EMP${row.phone.slice(-8)}${(1000 + i).toString().slice(-3)}`;
        await tx.employee.create({
          data: {
            userId: user.id,
            employeeCode: empCode,
            position: row.position || "Xodim",
            email: row.email ?? "",
            organizationId,
            departmentId: departmentId!,
          },
        });
      });

      result.success++;
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: rowNum, message: err.message || "Unknown error" });
    }
  }

  return result;
}

export function parseCSV(text: string): ImportRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const phoneIdx = headers.indexOf("phone") ?? headers.indexOf("telefon") ?? headers.indexOf("tel") ?? -1;
  const nameIdx = headers.indexOf("fullname") ?? headers.indexOf("name") ?? headers.indexOf("ism") ?? -1;
  const deptIdx = headers.indexOf("departmentcode") ?? headers.indexOf("department") ?? headers.indexOf("bolim") ?? -1;
  const posIdx = headers.indexOf("position") ?? headers.indexOf("lavozim") ?? -1;
  const emailIdx = headers.indexOf("email") ?? -1;

  if (phoneIdx === -1 || nameIdx === -1) return [];

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length <= Math.max(phoneIdx, nameIdx)) continue;

    rows.push({
      phone: cols[phoneIdx],
      fullName: cols[nameIdx],
      departmentCode: deptIdx !== -1 ? cols[deptIdx] : undefined,
      position: posIdx !== -1 ? cols[posIdx] : undefined,
      email: emailIdx !== -1 ? cols[emailIdx] : undefined,
    });
  }

  return rows;
}
