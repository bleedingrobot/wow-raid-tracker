import SimEmbed from "../components/SimEmbed";
import { MAGE_SIM_PAYLOAD_KEY, getMageSimUrl } from "../utils/mageSim";

export default function MageSimPage() {
  return <SimEmbed className="Mage" payloadKey={MAGE_SIM_PAYLOAD_KEY} getSimUrl={getMageSimUrl} />;
}
