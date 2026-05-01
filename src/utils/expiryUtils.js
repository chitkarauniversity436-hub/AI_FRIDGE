export const getDaysUntilExpiry = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / 86400000);
};

export const getFreshnessStatus = (expiryDate) => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 2) return 'critical';
  if (days <= 5) return 'expiring';
  return 'fresh';
};

export const getFreshnessBadge = (expiryDate) => {
  const status = getFreshnessStatus(expiryDate);
  const days = getDaysUntilExpiry(expiryDate);
  const map = {
    expired:  { label: 'Expired',        color: 'var(--red)',    bg: 'rgba(239,68,68,0.15)' },
    critical: { label: `${days}d left`,  color: 'var(--orange)', bg: 'rgba(249,115,22,0.15)' },
    expiring: { label: `${days}d left`,  color: 'var(--yellow)', bg: 'rgba(234,179,8,0.15)'  },
    fresh:    { label: 'Fresh',          color: 'var(--green)',  bg: 'rgba(34,197,94,0.15)'  },
  };
  return map[status];
};

export const getExpiryAlerts = (items) =>
  items
    .filter(i => getDaysUntilExpiry(i.expiryDate) <= 3)
    .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));

export const getLowStockAlerts = (items) =>
  items.filter(i => i.quantity <= i.threshold);

export const categorizeItems = (items) => {
  const fresh    = items.filter(i => getFreshnessStatus(i.expiryDate) === 'fresh');
  const expiring = items.filter(i => ['critical','expiring'].includes(getFreshnessStatus(i.expiryDate)));
  const expired  = items.filter(i => getFreshnessStatus(i.expiryDate) === 'expired');
  return { fresh, expiring, expired };
};
