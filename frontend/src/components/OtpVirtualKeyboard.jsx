export default function OtpVirtualKeyboard({
  value = "",
  onChange,
  length = 6,
  title = "Enter verification code",
  hint = "Use the virtual keypad to enter the code sent to your email.",
  submitLabel = "Continue",
  onSubmit,
  disabled = false,
}) {
  const digits = String(value).slice(0, length).padEnd(length, " ").split("");

  const pushDigit = (digit) => {
    if (disabled) {
      return;
    }

    const current = String(value).replace(/\s+/g, "").slice(0, length);
    if (current.length >= length) {
      return;
    }

    onChange?.(`${current}${digit}`);
  };

  const removeDigit = () => {
    if (disabled) {
      return;
    }

    onChange?.(String(value).replace(/\s+/g, "").slice(0, -1));
  };

  const clearCode = () => {
    if (disabled) {
      return;
    }

    onChange?.("");
  };

  const submitCode = () => {
    if (disabled) {
      return;
    }

    onSubmit?.();
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Virtual Keypad
        </span>
      </div>

      <div className="mt-5 flex gap-2">
        {digits.map((digit, index) => (
          <div
            key={`${index}-${digit}`}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-bold text-slate-900"
          >
            {digit.trim() || "•"}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => pushDigit(String(digit))}
            disabled={disabled}
            className="rounded-2xl border border-slate-200 bg-white py-4 text-lg font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={clearCode}
          disabled={disabled}
          className="rounded-2xl border border-slate-200 bg-slate-50 py-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => pushDigit("0")}
          disabled={disabled}
          className="rounded-2xl border border-slate-200 bg-white py-4 text-lg font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={removeDigit}
          disabled={disabled}
          className="rounded-2xl border border-slate-200 bg-slate-50 py-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Backspace
        </button>
      </div>

      <button
        type="button"
        onClick={submitCode}
        disabled={disabled || String(value).replace(/\s+/g, "").length !== length}
        className="mt-6 w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitLabel}
      </button>
    </div>
  );
}