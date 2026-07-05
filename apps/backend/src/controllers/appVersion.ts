import { Request, Response, NextFunction } from "express";
import { checkAppVersion } from "../services/appVersion";

export async function checkAppVersionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const platform = (req.query.platform as string) || "ANDROID";
    const currentVersion = (req.query.version as string) || "1.0.0";
    const currentBuildNumber = parseInt(req.query.buildNumber as string || "1", 10);

    const result = await checkAppVersion(platform, currentVersion, currentBuildNumber);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
