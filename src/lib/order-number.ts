export function formatOrderNumber(orderId: number, createdAt: Date) {
  return `ORD${orderId}-${createdAt.getMonth() + 1}-${createdAt.getDate()}-${createdAt.getFullYear()}`;
}

export function temporaryOrderNumber() {
  return `TMP-ORD-${crypto.randomUUID()}`;
}
