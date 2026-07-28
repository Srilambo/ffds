import React from 'react';

export default function ShoppingCheckoutModalWidget({
  isOpen,
  onClose,
  selectedShop,
  orderItemsList = [],
  paymentMethod,
  setPaymentMethod,
  cardForm,
  setCardForm,
  onSubmitOrder,
  placingOrder = false,
  savedUserCard,
  deliveryAddress = '',
}) {
  if (!isOpen) return null;

  const subtotal = orderItemsList.reduce(
    (sum, i) => sum + (i.estimatedPrice || 2.5) * (i.quantityNum || 1),
    0
  );
  const deliveryFee = subtotal > 20 ? 0.0 : selectedShop?.deliveryFee || 1.5;
  const ecoFee = 0.5;
  const grandTotal = subtotal + deliveryFee + ecoFee;

  const getCardBrand = (num = '') => {
    const digits = num.replace(/\D/g, '');
    if (digits.startsWith('5')) return 'MASTERCARD';
    if (digits.startsWith('3')) return 'AMEX';
    if (digits.startsWith('4')) return 'VISA';
    return 'DEBIT / CREDIT';
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-up">
      <div className="glass w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
              💳
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Complete Checkout</h2>
              <p className="text-xs text-slate-400">Review items & payment from {selectedShop?.shopName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Delivery Address Card */}
        <div className="glass p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <div>
              <div className="font-bold text-white">Delivery Destination</div>
              <div className="text-slate-300 line-clamp-1">{deliveryAddress || 'Marked Home Location'}</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
            GPS PIN MATCHED
          </span>
        </div>

        {/* Order Items Preview */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Order Items ({orderItemsList.length})
          </div>
          <div className="max-h-36 overflow-y-auto divide-y divide-white/5 pr-1 space-y-1">
            {orderItemsList.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-200 font-medium">
                  {item.emoji || '🛒'} {item.name} ({item.quantityNum || 1} {item.unit || 'pcs'})
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  ${((item.estimatedPrice || 2.5) * (item.quantityNum || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Calculation Summary */}
        <div className="glass p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Items Subtotal</span>
            <span className="font-mono font-bold text-white">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Delivery Fee ({selectedShop?.shopName})</span>
            <span className="font-mono font-bold text-white">
              {deliveryFee === 0 ? 'FREE (Orders > $20)' : `$${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Eco Packaging & Service Fee</span>
            <span className="font-mono font-bold text-white">${ecoFee.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10">
            <span>Total Payable Amount</span>
            <span className="font-mono text-emerald-400">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Payment Method</div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                paymentMethod === 'cod'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-glow'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xl">💵</span>
              <span>Cash on Delivery</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('card');
                if (savedUserCard?.cardNumberMasked && !cardForm.number) {
                  setCardForm({
                    number: savedUserCard.cardNumberMasked,
                    expiry: savedUserCard.expiryDate || '',
                    cvv: '***',
                    name: savedUserCard.cardHolderName || '',
                  });
                }
              }}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                paymentMethod === 'card'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-glow'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xl">💳</span>
              <span>Saved Credit / Debit Card</span>
            </button>
          </div>

          {/* Card Details Form */}
          {paymentMethod === 'card' && (
            <div className="glass p-4 rounded-2xl border border-white/10 space-y-3 bg-slate-950/60 animate-fade-up">
              {savedUserCard?.cardNumberMasked && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💳</span>
                    <div>
                      <div className="font-bold text-white">Saved Profile Card Detected</div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {savedUserCard.cardNumberMasked} ({getCardBrand(savedUserCard.cardNumberMasked)})
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCardForm({
                        number: savedUserCard.cardNumberMasked || '',
                        expiry: savedUserCard.expiryDate || '',
                        cvv: '123',
                        name: savedUserCard.cardHolderName || '',
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-bold"
                  >
                    Use Saved Card
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardForm.name || ''}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    placeholder="e.g. S. Lambotharan"
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardForm.number || ''}
                    onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                    placeholder="4532 •••• •••• 8892"
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardForm.expiry || ''}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    CVV Code
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardForm.cvv || ''}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                    placeholder="•••"
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onSubmitOrder}
            disabled={placingOrder}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {placingOrder ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full bg-slate-950 animate-ping" />
                Dispatching Order...
              </>
            ) : (
              <>
                <span>🚀</span> Place Order (${grandTotal.toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
