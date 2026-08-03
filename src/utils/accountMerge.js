// Groups `accounts` docs that share a battleNetId label (see the race
// condition fixed in dataService.addAccount) so the leftover duplicates
// from before that fix can be collapsed into one doc per real account.

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function findDuplicateAccountGroups(accounts, characters) {
  const byLabel = new Map();

  accounts.forEach((account) => {
    const label = normalize(account.battleNetId);
    if (!label) {
      return;
    }
    if (!byLabel.has(label)) {
      byLabel.set(label, []);
    }
    byLabel.get(label).push(account);
  });

  const characterCountByAccountId = new Map();
  characters.forEach((character) => {
    if (!character.accountId) {
      return;
    }
    characterCountByAccountId.set(character.accountId, (characterCountByAccountId.get(character.accountId) || 0) + 1);
  });

  return [...byLabel.entries()]
    .filter(([, accs]) => accs.length > 1)
    .map(([label, accs]) => {
      // Primary = whichever doc has more characters pointing at it already
      // (keeps the most data attached), tie-broken by earliest createdAt.
      const sorted = [...accs].sort((a, b) => {
        const countDiff = (characterCountByAccountId.get(b.id) || 0) - (characterCountByAccountId.get(a.id) || 0);
        if (countDiff !== 0) {
          return countDiff;
        }
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });

      return {
        label,
        accounts: sorted,
        characterCounts: sorted.map((account) => characterCountByAccountId.get(account.id) || 0)
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
