interface Props {
  sheetId: string;
  asOf: string | null;
}

export default function Footer({ sheetId, asOf }: Props) {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/edit`;
  return (
    <footer className="mt-10 space-y-3 border-t border-slate-200 pt-6 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
      <p>
        Source:{" "}
        <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
          Google Sheet ↗
        </a>
        {asOf && <> · data as of {asOf}</>}
      </p>
      <p className="rounded-xl bg-slate-100 p-3 leading-relaxed dark:bg-slate-900">
        <strong className="text-slate-800 dark:text-slate-200">Disclaimer:</strong> Holiday Deal Finder is an independent tool. It does not sell
        products and is not affiliated with, endorsed by, or sponsored by any retailer listed. All deal data (prices, discounts,
        dates, notes and links) comes from the Google Sheet above, which its owner maintains. This app does not check it.
        Prices, stock and offer terms change often and may be wrong or expired. Deal Scores are calculated from the sheet&apos;s
        data only and are not a recommendation. Links may open a general retailer page rather than the exact item. Confirm
        price, availability and terms on the retailer&apos;s site before you buy.
      </p>
    </footer>
  );
}
