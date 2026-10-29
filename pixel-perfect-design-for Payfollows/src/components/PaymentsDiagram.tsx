import { useState } from "react";
import { links } from "../data/content";
import { Icons } from "./ui";

type Method = {
  id: string;
  name: string;
  type: string;
  mark: string;
  color: string;
  detail: string;
};

const leftMethods: Method[] = [
  { id: "binance", name: "Binance", type: "BNB Pay", mark: "B", color: "#f3ba2f", detail: "Choose Binance Pay in your account to add funds with a supported crypto balance." },
  { id: "heleket", name: "Heleket", type: "Card", mark: "H", color: "#eb3443", detail: "Add funds through a supported card gateway. Available payment options are shown in your account." },
  { id: "cryptomus", name: "Cryptomus", type: "Crypto", mark: "C", color: "#dedee4", detail: "Use a supported cryptocurrency at checkout. Follow the network and amount shown in your account." },
];

const rightMethods: Method[] = [
  { id: "visa", name: "Visa", type: "Card", mark: "V", color: "#5368c6", detail: "Use an eligible Visa card through a supported payment gateway in your account." },
  { id: "mastercard", name: "Mastercard", type: "Card", mark: "M", color: "#f26435", detail: "Use an eligible Mastercard through a supported payment gateway in your account." },
  { id: "crypto", name: "Crypto", type: "BTC + BTC", mark: "B", color: "#37a5e7", detail: "Pay with supported crypto options. Confirm the network and payment details before sending funds." },
];

const localMethods: Method[] = [
  { id: "bkash", name: "Bkash", type: "Mobile", mark: "b", color: "#e2136e", detail: "Add funds using bKash in Bangladesh when it is available in your account." },
  { id: "nagad", name: "Nagad", type: "Mobile", mark: "N", color: "#ee613b", detail: "Add funds using Nagad in Bangladesh when it is available in your account." },
  { id: "rocket", name: "Rocket", type: "Mobile", mark: "R", color: "#82358a", detail: "Add funds using Rocket in Bangladesh when it is available in your account." },
];

const methods = [...leftMethods, ...rightMethods, ...localMethods];

function MethodButton({ method, selected, onSelect, local = false }: {
  method: Method;
  selected: boolean;
  onSelect: (id: string) => void;
  local?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Learn about ${method.name} payments`}
      onClick={() => onSelect(method.id)}
      className={`payment-method group flex items-center gap-2.5 text-left ${local ? "payment-local" : ""} ${selected ? "payment-method-active" : ""}`}
    >
      <span
        className="payment-icon"
        style={{ "--method-color": method.color } as React.CSSProperties}
        aria-hidden="true"
      >
        {method.id === "mastercard" ? <span className="payment-mastercard" /> : method.mark}
      </span>
      <span className="min-w-0">
        <span className="payment-name">{method.name}</span>
        <span className="payment-type">{method.type}</span>
      </span>
    </button>
  );
}

export function PaymentsDiagram() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = methods.find((method) => method.id === selectedId);

  return (
    <div className="payment-section">
      <div className="payment-diagram" aria-label="Select a supported payment method">
        <div className="payment-facets" aria-hidden="true" />
        <div className="payment-glow" aria-hidden="true" />

        <svg className="payment-wires" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="payment-wire-left" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#5a075d" stopOpacity="0" />
              <stop offset=".48" stopColor="#8b108e" stopOpacity=".6" />
              <stop offset="1" stopColor="#dc27d8" stopOpacity=".9" />
            </linearGradient>
            <linearGradient id="payment-wire-right" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#dc27d8" stopOpacity=".9" />
              <stop offset=".52" stopColor="#8b108e" stopOpacity=".6" />
              <stop offset="1" stopColor="#5a075d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="payment-wire-group" data-active={leftMethods.some(m => m.id === selectedId)}>
            <path d="M 44 110 H 315 Q 370 110 429 173" stroke="url(#payment-wire-left)" />
            <path d="M 195 184 H 433" stroke="url(#payment-wire-left)" />
            <path d="M 44 258 H 315 Q 370 258 429 198" stroke="url(#payment-wire-left)" />
            <path className="payment-circuit" d="M 248 188 H 317 L 327 198 H 429 M 248 207 H 317 L 327 217 H 429 M 248 226 H 317 L 327 236 H 429" stroke="url(#payment-wire-left)" />
          </g>
          <g className="payment-wire-group" data-active={rightMethods.some(m => m.id === selectedId)}>
            <path d="M 571 173 Q 630 110 685 110 H 956" stroke="url(#payment-wire-right)" />
            <path d="M 567 184 H 805" stroke="url(#payment-wire-right)" />
            <path d="M 571 198 Q 630 258 685 258 H 956" stroke="url(#payment-wire-right)" />
            <path className="payment-circuit" d="M 571 198 H 673 L 683 188 H 752 M 571 217 H 673 L 683 207 H 752 M 571 236 H 673 L 683 226 H 752" stroke="url(#payment-wire-right)" />
          </g>
          <g className="payment-wire-group" data-active={localMethods.some(m => m.id === selectedId)}>
            <path d="M 500 236 V 350" stroke="#a31cb2" />
            <path d="M 500 335 H 315 V 350 M 500 335 H 685 V 350" stroke="#85208c" />
          </g>
          <g className="payment-vertical-wires">
            <path d="M 488 0 V 68 L 472 85 V 139 M 505 0 V 78 L 517 89 V 139 M 522 0 V 70 L 537 85 V 139" />
          </g>
        </svg>

        <div className="payment-left payment-side">
          {leftMethods.map((method) => <MethodButton key={method.id} method={method} selected={selectedId === method.id} onSelect={setSelectedId} />)}
        </div>

        <div className="payment-core-wrap">
          <button
            type="button"
            className="payment-core"
            aria-label="How GrowFollows payments work"
            onClick={() => setSelectedId(selectedId === "overview" ? null : "overview")}
          >
            <span className="payment-core-inner"><span className="payment-glyph">G</span></span>
          </button>
        </div>

        <div className="payment-right payment-side">
          {rightMethods.map((method) => <MethodButton key={method.id} method={method} selected={selectedId === method.id} onSelect={setSelectedId} />)}
        </div>

        <div className="payment-bottom">
          {localMethods.map((method) => <MethodButton key={method.id} method={method} selected={selectedId === method.id} onSelect={setSelectedId} local />)}
        </div>
      </div>

      {!selectedId && <p className="payment-hint">Select a payment method to learn more</p>}

      {selectedId && (
        <div className="payment-detail" role="status" aria-live="polite">
          <div>
            <h3>{selected ? `${selected.name} payments` : "How payments work"}</h3>
            <p>{selected?.detail ?? "Create an account, choose an available payment method in your dashboard, then add funds securely before placing an order."}</p>
          </div>
          <a href={links.signup} className="payment-detail-link">
            Create account <Icons.arrow className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}