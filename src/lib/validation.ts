export function textValue(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? '').trim();
  if (!value) throw new Error(`${label} wajib diisi`);
  return value;
}

export function positiveNumber(formData: FormData, key: string, label: string, allowZero = false) {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new Error(`${label} tidak valid`);
  }
  return value;
}

export function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  return value || null;
}

export function dateValue(formData: FormData, key: string, label: string) {
  const value = new Date(String(formData.get(key) ?? ''));
  if (Number.isNaN(value.getTime())) throw new Error(`${label} tidak valid`);
  return value;
}
