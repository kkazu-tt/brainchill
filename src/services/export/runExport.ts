import { Platform, Share } from "react-native";

import {
  buildExportPayload,
  exportFileName,
  exportPayloadToJSON,
  type ExportPayload,
} from "./exportPayload";

interface ExportInput {
  state: Parameters<typeof buildExportPayload>[0];
}

export interface ExportResult {
  ok: boolean;
  payload: ExportPayload;
  filename: string;
}

const triggerWebDownload = (json: string, filename: string) => {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export async function runExport({ state }: ExportInput): Promise<ExportResult> {
  const payload = buildExportPayload(state);
  const json = exportPayloadToJSON(payload);
  const filename = exportFileName();

  if (Platform.OS === "web") {
    triggerWebDownload(json, filename);
  } else {
    await Share.share({
      title: filename,
      message: json,
    });
  }

  return { ok: true, payload, filename };
}
