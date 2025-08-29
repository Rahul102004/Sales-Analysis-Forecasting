// Very small NL parser for inventory chat

const PRODUCT_IDS = ["M01AB","M01AE","N02BA","N02BE","N05B","N05C","R03","R06"];

exports.parseIntent = (txt) => {
  const q = (txt || "").toLowerCase();

  // direct totals
  if (/(total\s+stock|total\s+stocks|overall\s+stock|sum\s+stock)/.test(q)) {
    return { type: "TOTAL_STOCKS" };
  }

  // oldest/latest dates
  if (/(oldest|earliest).*(date|stock)|latest.*(date|stock)/.test(q)) {
    return { type: "OLDEST_LATEST" };
  }

  // list low
  if (/\blow\b.*(stock|items|products)|\blow\s+stock\b/.test(q)) {
    return { type: "LIST_LOW" };
  }

  // list everything
  if (/list|show|all\s+products/.test(q) && !/low/.test(q)) {
    return { type: "LIST_ALL" };
  }

  // product-specific
  const byId = PRODUCT_IDS.find((id) => q.includes(id.toLowerCase()));
  if (byId) return { type: "PRODUCT_QUERY", pid: byId };

  // name guess (one token like R06, or an alnum blob)
  const token = (q.match(/[a-z0-9]{3,6}/gi) || []).find(t => PRODUCT_IDS.includes(t.toUpperCase()));
  if (token) return { type: "PRODUCT_QUERY", pid: token.toUpperCase() };

  // weak guess for fallback
  return { type: "UNKNOWN", pidGuess: token?.toUpperCase() || null };
};
