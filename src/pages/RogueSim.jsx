import SimEmbed from "../components/SimEmbed";
import { ROGUE_SIM_PAYLOAD_KEY, getRogueSimUrl } from "../utils/rogueSim";

export default function RogueSimPage() {
  return <SimEmbed className="Rogue" payloadKey={ROGUE_SIM_PAYLOAD_KEY} getSimUrl={getRogueSimUrl} />;
}
