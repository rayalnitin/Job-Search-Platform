const formatShortHash = (value) => {
  if (!value) {
    return "-";
  }

  const text = String(value);
  return text.length > 18 ? `${text.slice(0, 10)}...${text.slice(-6)}` : text;
};

const formatTimestamp = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

export default function BlockchainPanel({
  blockchain,
  blockchainLoading = false,
  blockchainVerification,
  verifying = false,
  mining = false,
  repairing = false,
  onVerify,
  onMine,
  onRepair,
  onRefresh,
}) {
  const blocks = blockchain?.blocks || [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Blockchain Audit Seal
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Proof-of-work sealing for audit logs</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Seal unsealed audit entries into blocks, verify chain integrity, and inspect the latest tamper-evident blocks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onVerify}
              disabled={verifying}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify Blockchain"}
            </button>
            <button
              type="button"
              onClick={onMine}
              disabled={mining}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {mining ? "Mining Block..." : "Mine New Block"}
            </button>
            <button
              type="button"
              onClick={onRepair}
              disabled={repairing}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {repairing ? "Repairing Ledger..." : "Repair Ledger"}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={blockchainLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {blockchainLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {blockchainVerification && (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              blockchainVerification.valid
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            <p className="font-semibold">
              {blockchainVerification.valid ? "Blockchain verified" : "Blockchain issue detected"}
            </p>
            <p className="mt-1">{blockchainVerification.message}</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Total Blocks</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">{blockchain?.totalBlocks ?? 0}</h3>
          <p className="mt-2 text-sm text-slate-500">Mined blocks currently in the chain.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Unsealed Entries</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">{blockchain?.unsealedEntryCount ?? 0}</h3>
          <p className="mt-2 text-sm text-slate-500">Audit entries waiting to be sealed.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Difficulty</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">0000</h3>
          <p className="mt-2 text-sm text-slate-500">Proof-of-work prefix required for a valid block.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Chain Snapshot</h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest mined blocks with hashes, nonce, and sealed entry counts.
            </p>
          </div>
        </div>

        {blockchainLoading ? (
          <p className="mt-6 text-sm text-slate-500">Loading blockchain...</p>
        ) : !blocks.length ? (
          <p className="mt-6 text-sm text-slate-500">No blocks have been mined yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {blocks.map((block) => (
              <div
                key={block.index}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Block #{block.index}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">
                      {block.entryCount} sealed audit entries
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Difficulty {block.difficulty}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Nonce {block.nonce}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hash</p>
                    <p className="mt-1 break-all font-mono text-slate-700">{block.blockHash}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Previous</p>
                    <p className="mt-1 break-all font-mono text-slate-700">{block.previousHash}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Merkle Root</p>
                    <p className="mt-1 break-all font-mono text-slate-700">{block.merkleRoot}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timestamp</p>
                    <p className="mt-1 text-slate-700">{formatTimestamp(block.timestamp)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Audit Entry IDs</p>
                  <p className="mt-1 break-all">{(block.auditEntryIds || []).join(", ") || "No entries"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
