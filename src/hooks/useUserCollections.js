import { useEffect, useState } from "react";
import { COLLECTIONS, subscribeUserCollection } from "../services/dataService";

const DEFAULT = {
  accounts: [],
  characters: [],
  raidStatuses: [],
  lootItems: [],
  shoppingProfiles: [],
  buffProfiles: []
};

export function useUserCollections(uid) {
  const [data, setData] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setData(DEFAULT);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribers = [];
    const update = (key, docs) => {
      setData((prev) => ({ ...prev, [key]: docs }));
    };

    unsubscribers.push(
      subscribeUserCollection(COLLECTIONS.accounts, uid, (docs) => update("accounts", docs))
    );
    unsubscribers.push(
      subscribeUserCollection(COLLECTIONS.characters, uid, (docs) => update("characters", docs))
    );
    unsubscribers.push(
      subscribeUserCollection(COLLECTIONS.raidStatuses, uid, (docs) => update("raidStatuses", docs))
    );
    unsubscribers.push(
      subscribeUserCollection(COLLECTIONS.lootItems, uid, (docs) => {
        update("lootItems", docs);
        setLoading(false);
      })
    );
    unsubscribers.push(
      subscribeUserCollection(COLLECTIONS.shoppingProfiles, uid, (docs) => update("shoppingProfiles", docs))
    );
    unsubscribers.push(
      subscribeUserCollection(COLLECTIONS.buffProfiles, uid, (docs) => update("buffProfiles", docs))
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [uid]);

  return { data, loading };
}
