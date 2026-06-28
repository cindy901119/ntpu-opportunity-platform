export function formatDeadline(deadline: string) {
  if (!deadline) {
    return "日期待確認";
  }

  const today = new Date();
  const target = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(target.getTime())) {
    return deadline;
  }

  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  const month = target.getMonth() + 1;
  const date = target.getDate();

  if (days < 0) {
    return `已截止｜${month}/${date}`;
  }

  return `剩 ${days} 天｜${month}/${date}`;
}

export function isDeadlineSoon(deadline: string) {
  const days = getDaysUntilDeadline(deadline);
  return days !== null && days <= 5;
}

export function getDaysUntilDeadline(deadline: string) {
  const today = new Date();
  const target = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function getDeadlineTone(deadline: string) {
  const days = getDaysUntilDeadline(deadline);

  if (days === null) {
    return "info";
  }

  if (days <= 5) {
    return "attention";
  }

  if (days <= 21) {
    return "medium";
  }

  return "info";
}

export function getPrizeTone(prizeText: string) {
  const amount = getPrizeAmount(prizeText);

  if (amount === null) {
    return "info";
  }

  if (amount >= 80000) {
    return "highlight";
  }

  if (amount >= 30000) {
    return "medium";
  }

  return "neutral";
}

export function getPrizeAmount(prizeText: string) {
  const matches = prizeText.match(/[\d,]+/g);
  if (!matches?.length) {
    return null;
  }

  const amounts = matches
    .map((value) => Number(value.replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));

  return amounts.length ? Math.max(...amounts) : null;
}

export function shortList(items: string[], fallback = "待確認", limit = 2) {
  if (!items.length) {
    return fallback;
  }

  const visible = items.slice(0, limit).join("、");
  return items.length > limit ? `${visible}等` : visible;
}
