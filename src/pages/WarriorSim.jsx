import SimEmbed from "../components/SimEmbed";
import { WARRIOR_SIM_PAYLOAD_KEY, getWarriorSimUrl } from "../utils/warriorSim";

export default function WarriorSimPage() {
  return <SimEmbed className="Warrior" payloadKey={WARRIOR_SIM_PAYLOAD_KEY} getSimUrl={getWarriorSimUrl} />;
}
