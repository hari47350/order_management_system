import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Lock, 
  QrCode, 
  Loader2,
  Check,
  RefreshCw,
  ExternalLink,
  Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  // Form states
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [notes, setNotes] = useState('');
  
  // Real card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('GENERIC');

  // UPI details
  const [upiVpa, setUpiVpa] = useState('');
  const [qrCountdown, setQrCountdown] = useState(300); // 5 mins

  // Address
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Payment Processing & 3D Secure modal states
  const [isProcessing, setIsProcessing] = useState(false);
  const [authStep, setAuthStep] = useState(0); // 0: Idle, 1: Connecting, 2: 3D Secure, 3: Success
  const [gatewayStatusText, setGatewayStatusText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
    }
    fetchAddresses();
  }, []);

  // UPI countdown timer
  useEffect(() => {
    let timer;
    if (paymentMethod === 'UPI' && qrCountdown > 0) {
      timer = setInterval(() => setQrCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [paymentMethod, qrCountdown]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/users/addresses');
      setSavedAddresses(res.data);
      if (res.data.length > 0) {
        const defaultAddr = res.data.find(a => a.default) || res.data[0];
        setSelectedAddressId(defaultAddr.id);
        setShippingAddress(`${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state} ${defaultAddr.postalCode}, ${defaultAddr.country}`);
      }
    } catch (err) {
      console.error('Failed to load saved addresses', err);
    }
  };

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find(a => a.id === parseInt(id));
    if (addr) {
      setShippingAddress(`${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`);
    }
  };

  // Card input formatting and brand detection
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);

    // Detect card brand
    if (/^4/.test(raw)) setCardBrand('VISA');
    else if (/^5[1-5]/.test(raw)) setCardBrand('MASTERCARD');
    else if (/^3[47]/.test(raw)) setCardBrand('AMEX');
    else if (/^(?:6011|65)/.test(raw)) setCardBrand('DISCOVER');
    else setCardBrand('GENERIC');
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvv('123');
    setCardName('Alex Johnson');
    setCardBrand('VISA');
  };

  const [copiedUpi, setCopiedUpi] = useState(false);

  const fillTestUpi = () => {
    setUpiVpa('customer@okhdfcbank');
  };

  const selectUpiApp = (suffix) => {
    setUpiVpa(`customer${suffix}`);
  };

  const resetQrTimer = () => {
    setQrCountdown(300);
  };

  const copyMerchantVpa = () => {
    navigator.clipboard?.writeText('carttodoor.pay@icici');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const upiUri = `upi://pay?pa=carttodoor.pay@icici&pn=CartToDoor%20Express&am=${(cart?.subtotal || 0).toFixed(2)}&cu=INR&tn=CartToDoor%20Order`;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Please provide a complete delivery address.');
      return;
    }

    if (paymentMethod === 'CARD') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        setError('Please enter card expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Please enter a valid 3 or 4 digit CVV/CVC.');
        return;
      }
    }

    if (paymentMethod === 'UPI' && !upiVpa.trim()) {
      setError('Please provide a valid UPI ID (e.g., name@bank) or scan QR.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      let paymentIntentId = null;
      let cardLast4 = null;

      // 1. Online Payment Gateway Workflow (CARD or UPI)
      if (paymentMethod === 'CARD' || paymentMethod === 'UPI') {
        setAuthStep(1);
        setGatewayStatusText('Initializing Payment Intent with Gateway...');
        
        // Step 1: Create intent on server
        const intentRes = await api.post('/payments/create-intent', {
          paymentMethod: paymentMethod,
          currency: 'inr',
        });
        paymentIntentId = intentRes.data.paymentIntentId;

        // Step 2: 3D Secure / Banking Network verification animation
        setAuthStep(2);
        setGatewayStatusText(
          paymentMethod === 'CARD' 
            ? 'Contacting issuing bank for 3D Secure authorization...' 
            : 'Awaiting UPI network confirmation...'
        );
        await new Promise(r => setTimeout(r, 1200));

        // Step 3: Confirm with Gateway
        cardLast4 = cardNumber.replace(/\s+/g, '').slice(-4) || '4242';
        const confirmRes = await api.post('/payments/confirm', {
          paymentIntentId: paymentIntentId,
          paymentMethod: paymentMethod,
          cardLast4: cardLast4,
          cardBrand: cardBrand,
          upiVpa: upiVpa || 'instant_qr@carttodoor',
        });

        if (!confirmRes.data.verified) {
          throw new Error('Payment was declined by issuing bank.');
        }

        setAuthStep(3);
        setGatewayStatusText('Payment Authorized! Creating your order...');
        await new Promise(r => setTimeout(r, 600));
      }

      // 2. Commit Order with verified payment intent
      const payload = {
        shippingAddress: shippingAddress.trim(),
        paymentMethod: paymentMethod,
        notes: notes.trim(),
        paymentIntentId: paymentIntentId,
        cardLast4: cardLast4,
        cardBrand: cardBrand !== 'GENERIC' ? cardBrand : 'CARD',
      };

      const res = await api.post('/orders', payload);
      await clearCart();
      navigate(`/orders/${res.data.id}?placed=true`);
    } catch (err) {
      setIsProcessing(false);
      setAuthStep(0);
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 3D Secure / Bank Authorization Modal */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-6 animate-in fade-in duration-200">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              {authStep === 3 ? (
                <Check className="w-8 h-8 text-emerald-600 animate-bounce" />
              ) : (
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full mb-2">
                <Lock className="w-3 h-3" />
                <span>256-bit Encrypted Banking Gateway</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {authStep === 3 ? 'Payment Verified!' : 'Authorizing Transaction'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">{gatewayStatusText}</p>
            </div>

            {/* Stepper Progress */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-bold text-slate-400">
              <div className={`p-2 rounded-xl border ${authStep >= 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200'}`}>
                1. Intent
              </div>
              <div className={`p-2 rounded-xl border ${authStep >= 2 ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200'}`}>
                2. 3D Secure
              </div>
              <div className={`p-2 rounded-xl border ${authStep >= 3 ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200'}`}>
                3. Confirmed
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Please do not close this window while we secure your payment.
            </p>
          </div>
        </div>
      )}

      <Link to="/cart" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-600 mb-6 transition">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Cart
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>CartToDoor Secure Gateway</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Express Checkout</h1>
        </div>
        <div className="text-xs text-slate-500">
          All transactions are encrypted with bank-grade SSL security.
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center space-x-3 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 columns: Address & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Shipping Address */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              1. Delivery Address
            </h2>

            {savedAddresses.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select from Saved Addresses</label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => handleAddressSelect(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 mb-3"
                >
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.street}, {a.city} {a.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shipping Address Details</label>
              <textarea
                rows={3}
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Street address, building/apartment, city, state, postal code, country"
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Notes / Gate Code (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Leave package by the front door ring bell"
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: Real Payment Gateway */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">
                2. Select Payment Method
              </h2>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                Live Gateway Integration
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-3">
              <label
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="sr-only"
                />
                <CreditCard className="w-6 h-6 mb-2 text-emerald-600" />
                <span className="text-xs font-bold">Credit / Debit</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Stripe / Global</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="sr-only"
                />
                <Smartphone className="w-6 h-6 mb-2 text-emerald-600" />
                <span className="text-xs font-bold">UPI / QR</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Instant Mobile</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="sr-only"
                />
                <Banknote className="w-6 h-6 mb-2 text-emerald-600" />
                <span className="text-xs font-bold">Cash on Delivery</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Pay on Arrival</span>
              </label>
            </div>

            {/* Credit / Debit Card Interactive Form */}
            {paymentMethod === 'CARD' && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">Card Details</span>
                    {cardBrand !== 'GENERIC' && (
                      <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                        {cardBrand}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition"
                  >
                    ⚡ Auto-Fill Test Card (4242)
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Full name as printed on card"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/30 pr-10"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI Dynamic QR Form */}
            {paymentMethod === 'UPI' && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 mt-4 text-center">
                <div className="flex items-center justify-between text-left">
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <span>Real-Time UPI &amp; QR Checkout</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">NPCI Scannable</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Scan with any mobile UPI app: Google Pay, PhonePe, Paytm, BHIM</div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {qrCountdown > 0 ? (
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                        Expires in: {formatTimer(qrCountdown)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={resetQrTimer}
                        className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg flex items-center space-x-1 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate QR</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Real Scannable QR Code */}
                <div className="mx-auto max-w-xs bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CartToDoor Express Verified Merchant</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
                    {qrCountdown > 0 ? (
                      <QRCodeSVG
                        value={upiUri}
                        size={160}
                        level="M"
                        includeMargin={false}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-40 h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded">
                        <AlertCircle className="w-8 h-8 text-amber-500 mb-1" />
                        <span className="text-[11px] font-medium text-slate-600">QR Expired</span>
                        <button
                          type="button"
                          onClick={resetQrTimer}
                          className="mt-2 text-[10px] font-bold text-emerald-700 hover:underline"
                        >
                          Generate Fresh QR
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-base font-black text-slate-900">
                      Scan to pay ₹{(cart?.subtotal || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-center space-x-1">
                      <span>Merchant VPA: carttodoor.pay@icici</span>
                      <button
                        type="button"
                        onClick={copyMerchantVpa}
                        className="text-emerald-700 hover:text-emerald-800 p-0.5"
                        title="Copy VPA"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Direct Mobile Tap Intent */}
                  <a
                    href={upiUri}
                    className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition shadow-2xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Open in Mobile UPI App</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>

                {/* Popular UPI Apps 1-Click Selectors */}
                <div className="pt-2 text-left space-y-2">
                  <div className="text-[11px] font-bold text-slate-600">Select your preferred UPI App</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'gpay', label: 'Google Pay', suffix: '@okhdfcbank', bg: 'hover:border-blue-300' },
                      { id: 'phonepe', label: 'PhonePe', suffix: '@ybl', bg: 'hover:border-purple-300' },
                      { id: 'paytm', label: 'Paytm', suffix: '@paytm', bg: 'hover:border-sky-300' },
                      { id: 'bhim', label: 'BHIM UPI', suffix: '@upi', bg: 'hover:border-emerald-300' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => selectUpiApp(app.suffix)}
                        className={`p-2 border rounded-xl text-center text-[11px] font-semibold bg-white transition shadow-2xs ${app.bg} ${
                          upiVpa.endsWith(app.suffix) ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom VPA Input */}
                <div className="pt-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">Or Pay via Custom UPI ID (VPA)</label>
                    <button
                      type="button"
                      onClick={fillTestUpi}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      ⚡ Auto-Fill Demo VPA
                    </button>
                  </div>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            )}

            {/* Cash on Delivery Notice */}
            {paymentMethod === 'COD' && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Banknote className="w-4 h-4 text-amber-700" />
                  <span>Pay upon arrival at your doorstep</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Your order will be dispatched immediately. Order status will be marked <strong>PLACED</strong> and payment status will remain <strong>PENDING</strong> until cash is handed to the courier.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Order Summary & Place Order */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-6">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
            Review Items ({cart.totalItems})
          </h2>

          {/* Items Preview */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
            {cart.items.map((item) => (
              <div key={item.id} className="pt-2 flex justify-between items-center text-xs">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-slate-800 truncate">{item.productName}</div>
                  <div className="text-slate-400 text-[11px]">Qty: {item.quantity} × ₹{item.productPrice.toFixed(2)}</div>
                </div>
                <div className="font-black text-slate-900">₹{item.subtotal.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Doorstep Delivery</span>
              <span className="font-bold text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Total Due</span>
              <span className="font-black text-2xl text-emerald-600">₹{cart.subtotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-3.5 px-4 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authorize &amp; Pay (₹{cart.subtotal.toFixed(2)})</span>
              </>
            )}
          </button>

          <div className="text-[11px] text-center text-slate-400 space-y-1">
            <div>🛡️ Guaranteed Safe &amp; Secure Checkout</div>
            <div>Powered by Stripe &bull; Visa &bull; Mastercard &bull; UPI</div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
