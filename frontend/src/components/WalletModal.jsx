import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Wallet,
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function WalletModal({ isOpen, onClose, onBalanceUpdated }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refillAmount, setRefillAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [cardHolder, setCardHolder] = useState('Dr. Elena Rostova');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('28');
  const [cvc, setCvc] = useState('888');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadWallet = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWallet();
      setBalance(data.balance);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWallet();
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const finalAmount = customAmount ? parseFloat(customAmount) : parseFloat(refillAmount);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      setErrorMsg('Please select or enter a valid refill amount.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.refillWallet({
        amount: finalAmount,
        card_holder: cardHolder,
        card_number: cardNumber.replace(/\D/g, '') || '4242424242424242',
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc
      });

      setSuccessMsg(res.message);
      setBalance(res.new_balance);
      setCustomAmount('');
      loadWallet();
      if (onBalanceUpdated) {
        onBalanceUpdated(res.new_balance);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Manufacturing Digital Wallet
              </h3>
              <p className="text-xs text-slate-400">
                Pre-funded balance for instant additive manufacturing orders and CNC services.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Balance Card & Virtual Credit Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-cyan-950/50 via-slate-950 to-slate-900 border border-cyan-500/30 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Available Wallet Balance
              </div>
              <div className="text-3xl font-extrabold font-mono text-white mt-2">
                ${balance.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero transaction fees • Instant order clearance
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Status: Active</span>
              <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Auto-deduct enabled
              </span>
            </div>
          </div>

          {/* Card on file preview */}
          <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 border border-indigo-500/30 rounded-xl p-5 text-white flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-widest text-slate-400">Corporate Credit Card</span>
              <span className="font-bold text-indigo-300">VISA / MASTERCARD</span>
            </div>

            <div className="my-3">
              <div className="font-mono text-base tracking-widest text-slate-100">
                •••• •••• •••• 4242
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-indigo-500/20">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase">Card Holder</span>
                <span>{cardHolder || 'Dr. Elena Rostova'}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase">Expires</span>
                <span className="font-mono">{expMonth}/{expYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Refill Form */}
        <form onSubmit={handleRefillSubmit} className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              Refill Wallet with Credit Card
            </h4>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              PCI-DSS Encrypted 256-bit
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Select Refill Amount</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[250, 500, 1000, 2500].map((amt) => {
                const isSelected = !customAmount && refillAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setRefillAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    +${amt.toLocaleString()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Or Enter Custom Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500">$</span>
              <input
                type="number"
                min="10"
                max="50000"
                placeholder="e.g. 1500"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Credit Card Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Card Number</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Exp Month</label>
              <input
                type="text"
                maxLength="2"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                placeholder="MM"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Exp Year</label>
              <input
                type="text"
                maxLength="2"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                placeholder="YY"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">CVC / CVV</label>
              <input
                type="password"
                maxLength="4"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="•••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authorizing Credit Card...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Refill ${customAmount || refillAmount} to Wallet
                </>
              )}
            </button>
          </div>
        </form>

        {/* Transaction History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Wallet Activity & Transaction Ledger
            </h4>
            <span className="text-[10px] text-slate-500">{transactions.length} entries recorded</span>
          </div>

          {transactions.length > 0 ? (
            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'CREDIT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{tx.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(tx.created_at).toLocaleString()} • ID: {tx.id}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold ${
                        tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Bal: ${tx.balance_after.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
