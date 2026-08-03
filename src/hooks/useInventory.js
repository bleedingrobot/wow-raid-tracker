import { useCallback, useEffect, useState } from "react";
import { INVENTORY_UPDATED_EVENT, loadInventoryItems } from "../utils/inventoryLocalStore";
import { subscribeInventorySnapshot } from "../services/dataService";

export function useInventory(uid) {
  const [inventoryItems, setInventoryItems] = useState([]);

  const refresh = useCallback(() => {
    loadInventoryItems().then(setInventoryItems).catch(() => setInventoryItems([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!uid) {
      setInventoryItems([]);
      return () => {};
    }

    const unsubscribe = subscribeInventorySnapshot(uid, (items) => {
      setInventoryItems(Array.isArray(items) ? items : []);
    });

    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    window.addEventListener(INVENTORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(INVENTORY_UPDATED_EVENT, refresh);
  }, [refresh]);

  return inventoryItems;
}
