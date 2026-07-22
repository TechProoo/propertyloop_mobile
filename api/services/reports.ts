import api from "../client";

export type ReportTargetType = "AGENT" | "VENDOR" | "LISTING" | "USER" | "MESSAGE";

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}

const reportsService = {
  create(payload: CreateReportPayload): Promise<{ id: string }> {
    return api.post("/reports", payload).then((r) => r.data);
  },
};

export default reportsService;
