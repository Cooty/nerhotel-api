export async function fetchCSV(url: string) {
  const req = await fetch(url);

  if (!req.ok) {
    throw new Error(`[error] Can't fetch CSV data from: ${url}`);
  }

  return await req.text();
}
