import { prisma } from "./prisma";

interface VersionCheckResult {
  updateAvailable: boolean;
  isForceUpdate: boolean;
  latestVersion: string;
  latestBuildNumber: number;
  updateUrl: string | null;
  releaseNotes: string | null;
}

export async function checkAppVersion(
  platform: string,
  currentVersion: string,
  currentBuildNumber: number
): Promise<VersionCheckResult> {
  const latest = await prisma.appVersion.findFirst({
    where: {
      platform: platform.toUpperCase(),
      isActive: true,
    },
    orderBy: { buildNumber: "desc" },
  });

  if (!latest) {
    return {
      updateAvailable: false,
      isForceUpdate: false,
      latestVersion: currentVersion,
      latestBuildNumber: currentBuildNumber,
      updateUrl: null,
      releaseNotes: null,
    };
  }

  const updateAvailable = latest.buildNumber > currentBuildNumber;
  const isForceUpdate = latest.buildNumber > currentBuildNumber && latest.minBuildNumber > currentBuildNumber;

  return {
    updateAvailable,
    isForceUpdate,
    latestVersion: latest.version,
    latestBuildNumber: latest.buildNumber,
    updateUrl: latest.updateUrl,
    releaseNotes: latest.releaseNotes,
  };
}

export async function createAppVersion(data: {
  platform: string;
  version: string;
  buildNumber: number;
  minVersion: string;
  minBuildNumber: number;
  updateUrl?: string;
  releaseNotes?: string;
  isForceUpdate?: boolean;
}) {
  return prisma.appVersion.create({
    data: {
      platform: data.platform.toUpperCase(),
      version: data.version,
      buildNumber: data.buildNumber,
      minVersion: data.minVersion,
      minBuildNumber: data.minBuildNumber,
      updateUrl: data.updateUrl,
      releaseNotes: data.releaseNotes,
      isForceUpdate: data.isForceUpdate || false,
      publishedAt: new Date(),
    },
  });
}
