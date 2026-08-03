import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clipboard } from "lucide-react";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import { Card } from "./ui/Card";
import Badge from "./ui/Badge";
import { SLOT_LABELS, WOW_CLASSIC_LABEL } from "../utils/warriorSim";

export default function SimEmbed({ className, payloadKey, getSimUrl }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [copyMessage, setCopyMessage] = useState("");
  const simUrl = useMemo(() => getSimUrl(), [getSimUrl]);
  const isLocalBridgeMode = useMemo(() => simUrl.startsWith("/wowsims/"), [simUrl]);

  const payload = useMemo(() => {
    const statePayload = location.state?.simJsonText;
    if (typeof statePayload === "string" && statePayload.trim()) {
      return statePayload;
    }

    const stored = sessionStorage.getItem(payloadKey) || localStorage.getItem(payloadKey);
    if (stored && stored.trim()) {
      return stored;
    }

    return "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, payloadKey]);

  const missingSlots = useMemo(() => {
    const slots = location.state?.missingSlots;
    return Array.isArray(slots) ? slots.filter((slot) => Number.isFinite(Number(slot))) : [];
  }, [location.state]);

  useEffect(() => {
    if (location.state?.simJsonText) {
      sessionStorage.setItem(payloadKey, location.state.simJsonText);
      localStorage.setItem(payloadKey, location.state.simJsonText);
    }
  }, [location.state, payloadKey]);

  const onCopyPayload = async () => {
    if (!payload) {
      setCopyMessage(`No ${className} payload found. Return to Characters and launch again.`);
      return;
    }

    if (!navigator?.clipboard?.writeText) {
      setCopyMessage("Clipboard access is unavailable in this browser context.");
      return;
    }

    try {
      await navigator.clipboard.writeText(payload);
      setCopyMessage(`Copied ${className} JSON. In the sim: Import > JSON Import > paste > Import.`);
    } catch {
      setCopyMessage("Failed to copy payload. Please try again.");
    }
  };

  return (
    <div>
      <PageHeader
        title={`Integrated ${WOW_CLASSIC_LABEL} ${className} Sim`}
        subtitle={`No file export needed. Launches ${WOW_CLASSIC_LABEL} WoWSims in-app with your current gear payload ready.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/characters")}>
              <ArrowLeft className="h-4 w-4" /> Back to Characters
            </Button>
            <Button variant="secondary" onClick={onCopyPayload}>
              <Clipboard className="h-4 w-4" /> Copy Payload
            </Button>
          </>
        }
      />

      {missingSlots.length ? (
        <Badge tone="warn" className="mb-4">
          Missing worn items for: {missingSlots.map((slot) => SLOT_LABELS[slot] || `Slot ${slot}`).join(", ")}.
          Template fallback IDs were used.
        </Badge>
      ) : null}

      {copyMessage ? <p className="mb-4 text-sm text-ink-soft">{copyMessage}</p> : null}

      <Card className="mb-4 p-4">
        <h3 className="mb-2 text-sm font-semibold text-ink">Quick Import</h3>
        {isLocalBridgeMode ? (
          <p className="text-sm text-ink-soft">
            Local bridge mode is active — your current {className} payload is auto-loaded into WoWSims on page load.
          </p>
        ) : (
          <ol className="list-decimal space-y-0.5 pl-4 text-sm text-ink-soft">
            <li>Click Copy Payload.</li>
            <li>In WoWSims, use Import then JSON Import.</li>
            <li>Paste and import.</li>
          </ol>
        )}
      </Card>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <iframe
          title={`${WOW_CLASSIC_LABEL} WoWSims ${className}`}
          src={simUrl}
          className="h-[80vh] w-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
