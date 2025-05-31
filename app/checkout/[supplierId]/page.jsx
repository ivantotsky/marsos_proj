// app/checkout/[supplierId]/page.jsx

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  addDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import Currency from "@/components/global/CurrencySymbol";
import { Button } from "@/components/ui/button";
import { setPaymentMethod } from "@/store/checkoutSlice";
import { toast } from "sonner";
import MapAddressPicker from "@/components/checkout/MapAddressPicker";

export default function CheckoutPage() {
  const { supplierId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  const userId = user?.uid;

  // ------------------------------
  // ADDRESS STATES & EFFECTS
  // ------------------------------
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [address, setAddress] = useState(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalSelectedAddressId, setModalSelectedAddressId] = useState(null);

  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddressData, setNewAddressData] = useState(null);
  const [newAlias, setNewAlias] = useState("");
  const [newName, setNewName] = useState(user?.displayName || "");
  const [newPhone, setNewPhone] = useState(user?.phoneNumber || "");

  useEffect(() => {
    if (!userId) return;
    const addressesRef = collection(db, "users", userId, "addresses");
    const unsub = onSnapshot(addressesRef, (snap) => {
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAddresses(fetched);
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      setAddress(null);
      return;
    }
    if (!selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
      setAddress(defaultAddr);
    } else {
      const found = addresses.find((a) => a.id === selectedAddressId);
      if (found) setAddress(found);
    }
  }, [addresses, selectedAddressId]);

  const handleSelectAddress = (addrId) => {
    setSelectedAddressId(addrId);
    const found = addresses.find((a) => a.id === addrId) || null;
    setAddress(found);
  };

  const openAddressModal = (addrId = null) => {
    if (addresses.length === 0) {
      setModalSelectedAddressId(null);
    } else {
      setModalSelectedAddressId(addrId || selectedAddressId || addresses[0].id);
    }
    setEditingAddressId(null);
    setIsAddingNew(false);
    setShowAddressModal(true);
  };

  const selectModalAddress = (addrId) => {
    setModalSelectedAddressId(addrId);
  };

  const confirmModalSelection = () => {
    if (modalSelectedAddressId) {
      setSelectedAddressId(modalSelectedAddressId);
      const found = addresses.find((a) => a.id === modalSelectedAddressId);
      if (found) setAddress(found);
    }
    setShowAddressModal(false);
  };

  const cancelAddressModal = () => {
    setEditingAddressId(null);
    setIsAddingNew(false);
    setNewAddressData(null);
    setShowAddressModal(false);
  };

  const startEditingAddress = (addr) => {
    setEditingAddressId(addr.id);
    setEditingName(addr.authPersonName || "");
    setEditingPhone(addr.authPersonMobile || "");
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setEditingName("");
    setEditingPhone("");
  };

  const saveEditAddress = async (addrId) => {
    if (!editingName.trim() || !editingPhone.trim()) {
      toast.error("Name and Phone cannot be empty");
      return;
    }
    try {
      const docRef = doc(db, "users", userId, "addresses", addrId);
      await updateDoc(docRef, {
        authPersonName: editingName.trim(),
        authPersonMobile: editingPhone.trim(),
      });
      toast.success("Address updated");
      setEditingAddressId(null);
      setEditingName("");
      setEditingPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update address");
    }
  };

  const startAddingNewAddress = () => {
    setIsAddingNew(true);
    setNewAddressData(null);
    setNewAlias("");
    setNewName(user?.displayName || "");
    setNewPhone(user?.phoneNumber || "");
  };

  const handleMapSelect = (data) => {
    setNewAddressData(data);
  };

  const saveNewAddress = async () => {
    if (!newAddressData) {
      toast.error("Please pick a location on the map");
      return;
    }
    if (!newAlias.trim()) {
      toast.error("Please enter an address label (alias)");
      return;
    }
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Name and Phone are required");
      return;
    }
    try {
      const addressesRef = collection(db, "users", userId, "addresses");
      await addDoc(addressesRef, {
        alias: newAlias.trim(),
        formatted: newAddressData.formatted,
        lat: newAddressData.lat,
        lng: newAddressData.lng,
        authPersonName: newName.trim(),
        authPersonMobile: newPhone.trim(),
        isDefault: false,
        createdAt: Date.now(),
      });
      toast.success("Address added");
      setIsAddingNew(false);
      setNewAddressData(null);
      setNewAlias("");
      setNewName("");
      setNewPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add address");
    }
  };

  // ------------------------------
  // CARD STATES & EFFECTS
  // ------------------------------
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [card, setCard] = useState(null);

  const [showCardModal, setShowCardModal] = useState(false);
  const [modalSelectedCardId, setModalSelectedCardId] = useState(null);

  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardName, setEditingCardName] = useState("");
  const [editingCardExpiry, setEditingCardExpiry] = useState("");

  const [isAddingNewCard, setIsAddingNewCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");

  useEffect(() => {
    if (!userId) return;
    const cardsRef = collection(db, "users", userId, "cards");
    const unsubCards = onSnapshot(cardsRef, (snap) => {
      const fetchedCards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSavedCards(fetchedCards);
    });
    return () => unsubCards();
  }, [userId]);

  useEffect(() => {
    if (savedCards.length === 0) {
      setSelectedCardId(null);
      setCard(null);
      return;
    }
    if (!selectedCardId) {
      const firstCard = savedCards[0];
      setSelectedCardId(firstCard.id);
      setCard(firstCard);
    } else {
      const found = savedCards.find((c) => c.id === selectedCardId);
      if (found) setCard(found);
    }
  }, [savedCards, selectedCardId]);

  const handleSelectCard = (cardId) => {
    setSelectedCardId(cardId);
    const found = savedCards.find((c) => c.id === cardId) || null;
    setCard(found);
  };

  const openCardModal = (cardId = null) => {
    if (savedCards.length === 0) {
      setModalSelectedCardId(null);
    } else {
      setModalSelectedCardId(cardId || selectedCardId || savedCards[0].id);
    }
    setEditingCardId(null);
    setIsAddingNewCard(false);
    setShowCardModal(true);
  };

  const selectModalCard = (cardId) => {
    setModalSelectedCardId(cardId);
  };

  const confirmCardSelection = () => {
    if (modalSelectedCardId) {
      setSelectedCardId(modalSelectedCardId);
      const found = savedCards.find((c) => c.id === modalSelectedCardId);
      if (found) {
        setCard(found);
        // Mark “card” as the selected payment method in Redux
        dispatch(setPaymentMethod("card"));
      }
    }
    setShowCardModal(false);
  };

  const cancelCardModal = () => {
    setEditingCardId(null);
    setIsAddingNewCard(false);
    setShowCardModal(false);
  };

  const startEditingCard = (c) => {
    setEditingCardId(c.id);
    setEditingCardName(c.brand || "");
    setEditingCardExpiry(c.expiry || "");
  };

  const cancelEditCard = () => {
    setEditingCardId(null);
    setEditingCardName("");
    setEditingCardExpiry("");
  };

  const saveEditCard = async (cardId) => {
    if (!editingCardName.trim() || !editingCardExpiry.trim()) {
      toast.error("Brand and Expiry cannot be empty");
      return;
    }
    try {
      const docRef = doc(db, "users", userId, "cards", cardId);
      await updateDoc(docRef, {
        brand: editingCardName.trim(),
        expiry: editingCardExpiry.trim(),
      });
      toast.success("Card updated");
      setEditingCardId(null);
      setEditingCardName("");
      setEditingCardExpiry("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update card");
    }
  };

  const startAddingNewCard = () => {
    setIsAddingNewCard(true);
    setNewCardNumber("");
    setNewCardName("");
    setNewCardExpiry("");
  };

  const saveNewCard = async () => {
    if (!newCardNumber.trim() || !newCardName.trim() || !newCardExpiry.trim()) {
      toast.error("All card fields are required");
      return;
    }
    // Derive last4 from number; brand is free‐text
    const last4 = newCardNumber.slice(-4);
    const brand = newCardName.trim();
    try {
      const cardsRef = collection(db, "users", userId, "cards");
      await addDoc(cardsRef, {
        brand,
        last4,
        expiry: newCardExpiry.trim(),
        createdAt: Date.now(),
      });
      toast.success("Card added");
      setIsAddingNewCard(false);
      setNewCardNumber("");
      setNewCardName("");
      setNewCardExpiry("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add card");
    }
  };

  // ------------------------------
  // CART ITEMS & SUMMARY
  // ------------------------------
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    shipping: 0,
    vat: 0,
    total: 0,
  });

  useEffect(() => {
    if (!userId) return;
    const itemsQuery = query(
      collection(db, "carts", userId, "items"),
      where("supplierId", "==", supplierId)
    );
    const unsubItems = onSnapshot(itemsQuery, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubItems();
  }, [userId, supplierId]);

  useEffect(() => {
    const subtotal = items.reduce(
      (sum, i) => sum + (i.subtotal || i.price * i.quantity),
      0
    );
    const shipping = items.reduce((sum, i) => sum + (i.shippingCost || 0), 0);
    const vat = Number(((subtotal + shipping) * 0.15).toFixed(2));
    const total = Number((subtotal + shipping + vat).toFixed(2));
    setSummary({ subtotal, shipping, vat, total });
  }, [items]);

  // ------------------------------
  // PAYMENT STATES & TOGGLES
  // ------------------------------
  const paymentMethod = useSelector((s) => s.checkout.paymentMethod);
  const selectPayment = (id) => dispatch(setPaymentMethod(id));

  // Toggles for collapse/expand
  const [showCardSection, setShowCardSection] = useState(false);
  const [showSadad, setShowSadad] = useState(false);
  const [showDigitalSection, setShowDigitalSection] = useState(false);
  const [showBNPLSection, setShowBNPLSection] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTE: We now disable “Pay Now” unless:
  //   • address !== null
  //   • address.authPersonMobile is non‐empty
  //   • paymentMethod is non‐empty
  // ─────────────────────────────────────────────────────────────────────────────
  const isPlaceOrderDisabled =
    !address || !address.authPersonMobile || !paymentMethod;

  const placeOrder = () => {
    if (isPlaceOrderDisabled) {
      if (!address) toast.error("Please select a shipping address");
      else if (!address.authPersonMobile)
        toast.error("Shipping address must include a phone number");
      else if (!paymentMethod) toast.error("Please select a payment method");
      return;
    }
    router.push(`/`);
  };

  if (!userId) return null;

  return (
    <div className='max-w-4xl mx-auto px-3 sm:px-4 py-2'>
      {/* Title */}
      <h1 className='text-lg sm:text-xl font-semibold mb-2'>Checkout</h1>

      {/* Main grid: single column on small screens, two-column (3:2) on md+ */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-2'>
        {/* LEFT: Shipping Address & Your Order */}
        <div className='md:col-span-3 space-y-3'>
          {/* Shipping Address */}
          <div className='border rounded-md p-3 bg-white'>
            <h2 className='font-semibold text-sm mb-1'>Shipping Address</h2>
            {address ? (
              <div className='flex flex-col sm:flex-row items-start gap-2 p-2 border rounded text-xs'>
                <div className='flex-1'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium text-sm'>{address.alias}</p>
                      {address.isDefault && (
                        <span className='bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full'>
                          Default
                        </span>
                      )}
                    </div>
                    <button
                      type='button'
                      className='text-blue-600 text-xs hover:underline'
                      onClick={() => {
                        openAddressModal(address.id);
                        setIsAddingNew(false);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <p className='text-gray-600 text-xs mt-1'>
                    {address.formatted}
                  </p>
                  <p className='text-gray-500 text-[10px] mt-1'>
                    Name: {address.authPersonName}
                  </p>
                  <p className='text-gray-500 text-[10px]'>
                    Phone: {address.authPersonMobile}
                  </p>
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-between px-2 py-2 text-xs'>
                <p className='text-gray-500'>No saved address selected.</p>
                <button
                  type='button'
                  className='text-blue-600 hover:underline'
                  onClick={() => {
                    openAddressModal();
                    startAddingNewAddress();
                  }}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Your Order Section */}
          <div className='border rounded-md p-3 bg-white space-y-2'>
            <h2 className='font-semibold text-sm mb-1'>Your Order</h2>
            {items.map((item) => (
              <div
                key={item.id}
                className='flex flex-col sm:flex-row gap-2 items-start border-b pb-2'
              >
                <img
                  src={item.productImage || "https://via.placeholder.com/100"}
                  alt={item.productName}
                  className='w-12 h-12 object-cover rounded border flex-shrink-0'
                />
                <div className='flex-1 text-xs'>
                  <h3 className='font-semibold text-sm'>{item.productName}</h3>
                  <div className='flex gap-2 items-center text-xs text-gray-600 mt-1'>
                    <span>Qty:</span>
                    <span>{item.quantity}</span>
                    <span>×</span>
                    <Currency amount={item.price} />
                  </div>
                  <p className='text-gray-500 text-xs mt-1'>
                    Size: {item.size || "—"} | Color: {item.color || "—"} |
                    Location: {item.deliveryLocation || "—"}
                  </p>
                  <p className='text-xs font-medium text-[#2c6449] mt-1'>
                    Subtotal: <Currency amount={item.subtotal} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Order Summary + Payment + Button */}
        <div className='md:col-span-2 space-y-3'>
          {/* Order Summary */}
          <div className='border rounded-md p-3 bg-white space-y-1 text-xs'>
            <h2 className='font-semibold text-sm mb-1'>Order Summary</h2>
            <div className='grid grid-cols-2 gap-y-1'>
              <span className='text-xs'>Subtotal</span>
              <span className='text-right'>
                <Currency amount={summary.subtotal} />
              </span>

              <span className='text-xs'>Shipping Fee</span>
              <span className='text-right'>
                <Currency amount={summary.shipping} />
              </span>

              <span className='text-xs'>VAT (15%)</span>
              <span className='text-right'>
                <Currency amount={summary.vat} />
              </span>

              <span className='text-xs font-semibold'>Total</span>
              <span className='text-right font-semibold text-sm text-[#2c6449]'>
                <Currency amount={summary.total} />
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className='border rounded-md p-3 bg-white space-y-2 text-xs'>
            <h2 className='font-semibold text-sm mb-1'>Payment</h2>

            {/* Debit/Credit Card Section */}
            <div>
              <div
                className='flex items-center justify-between p-2 cursor-pointer'
                onClick={() => setShowCardSection((prev) => !prev)}
              >
                <span className='font-medium text-xs'>Debit/Credit Card</span>
                <div className='flex items-center gap-1'>
                  <img
                    src='/images/payments/visa.png'
                    alt='Card'
                    className='w-7 h-7 object-contain'
                  />
                  <img
                    src='/images/payments/master.png'
                    alt='Card'
                    className='w-6 h-6 object-contain'
                  />
                  <img
                    src='/images/payments/mada.png'
                    alt='Card'
                    className='w-7 h-7 object-contain'
                  />
                  <span className='text-xs'>{showCardSection ? "–" : "+"}</span>
                </div>
              </div>

              {showCardSection && (
                <div className='space-y-2'>
                  {card ? (
                    <div className='border rounded-md p-2 flex items-center justify-between text-xs'>
                      <div className='flex items-center gap-2 flex-1'>
                        <div className='flex-1'>
                          <p className='font-medium'>
                            {(card.brand || "CARD").toUpperCase()} ****{" "}
                            {card.last4}
                          </p>
                          <p className='text-gray-500 text-[10px]'>
                            Exp: {card.expiry}
                          </p>
                        </div>
                      </div>
                      <button
                        type='button'
                        className='text-blue-600 text-xs hover:underline'
                        onClick={() => openCardModal(card.id)}
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button
                      type='button'
                      className='flex justify-between items-center w-full text-left p-2 border rounded hover:bg-gray-50 text-xs'
                      onClick={() => {
                        openCardModal();
                        startAddingNewCard();
                      }}
                    >
                      <span>+ Add Card</span>
                      <div className='flex space-x-1'>
                        <img
                          src='/images/payments/visa.png'
                          alt='Visa'
                          className='w-7 h-7 object-contain'
                        />
                        <img
                          src='/images/payments/master.png'
                          alt='Mastercard'
                          className='w-6 h-6 object-contain'
                        />
                        <img
                          src='/images/payments/mada.png'
                          alt='Amex'
                          className='w-7 h-7 object-contain'
                        />
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SADAD Section */}
            <div>
              <div
                className='flex items-center justify-between p-2 cursor-pointer'
                onClick={() => setShowSadad((prev) => !prev)}
              >
                <span className='font-medium text-xs'>SADAD</span>
                <div className='flex items-center gap-1'>
                  <img
                    src='/images/payments/sadad.png'
                    alt='SADAD'
                    className='w-8 h-8 object-contain'
                  />
                  <span className='text-xs'>{showSadad ? "–" : "+"}</span>
                </div>
              </div>

              {showSadad && (
                <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='radio'
                      name='payment'
                      className='mr-2 w-4 h-4'
                      value='sadad'
                      checked={paymentMethod === "sadad"}
                      onChange={() => selectPayment("sadad")}
                    />
                    <span className='flex-1'>SADAD</span>
                  </div>
                  <img
                    src='/images/payments/sadad.png'
                    alt='SADAD'
                    className='w-8 h-8 object-contain'
                  />
                </label>
              )}
            </div>

            {/* Digital Wallet Section */}
            <div>
              <div
                className='flex items-center justify-between mt-2 p-2 cursor-pointer'
                onClick={() => setShowDigitalSection((prev) => !prev)}
              >
                <span className='font-medium text-xs'>Digital Wallet</span>
                <div className='flex items-center gap-1'>
                  <img
                    src='/images/payments/applepay.png'
                    alt='Digital Wallet'
                    className='w-8 h-8 object-contain'
                  />
                  <img
                    src='/images/payments/googlepay.jpeg'
                    alt='Digital Wallet'
                    className='w-5 h-5 object-contain'
                  />
                  <span className='text-xs'>
                    {showDigitalSection ? "–" : "+"}
                  </span>
                </div>
              </div>

              {showDigitalSection && (
                <div className='space-y-1'>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='applePay'
                        checked={paymentMethod === "applePay"}
                        onChange={() => selectPayment("applePay")}
                      />
                      <span className='flex-1'>Apple Pay</span>
                    </div>
                    <img
                      src='/images/payments/applepay.png'
                      alt='Apple Pay'
                      className='w-8 h-8 object-contain'
                    />
                  </label>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='googlePay'
                        checked={paymentMethod === "googlePay"}
                        onChange={() => selectPayment("googlePay")}
                      />
                      <span className='flex-1'>Google Pay</span>
                    </div>
                    <img
                      src='/images/payments/googlepay.jpeg'
                      alt='Google Pay'
                      className='w-5 h-5 object-contain'
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Buy Now, Pay Later Section */}
            <div>
              <div
                className='flex items-center justify-between mt-2 p-2 cursor-pointer'
                onClick={() => setShowBNPLSection((prev) => !prev)}
              >
                <span className='font-medium text-xs'>Buy Now, Pay Later</span>
                <div className='flex items-center gap-1'>
                  <img
                    src='/images/payments/tabby.png'
                    alt='Buy Now, Pay Later'
                    className='w-8 h-8 object-contain'
                  />
                  <img
                    src='/images/payments/tamara.png'
                    alt='Buy Now, Pay Later'
                    className='w-9 h-9 object-contain'
                  />
                  <span className='text-xs'>{showBNPLSection ? "–" : "+"}</span>
                </div>
              </div>

              {showBNPLSection && (
                <div className='space-y-1'>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='tabby'
                        checked={paymentMethod === "tabby"}
                        onChange={() => selectPayment("tabby")}
                      />
                      <span className='flex-1'>Tabby</span>
                    </div>
                    <img
                      src='/images/payments/tabby.png'
                      alt='Tabby'
                      className='w-8 h-8 object-contain'
                    />
                  </label>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='tamara'
                        checked={paymentMethod === "tamara"}
                        onChange={() => selectPayment("tamara")}
                      />
                      <span className='flex-1'>Tamara</span>
                    </div>
                    <img
                      src='/images/payments/tamara.png'
                      alt='Tamara'
                      className='w-9 h-9 object-contain'
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Pay Now Button */}
          <Button
            disabled={isPlaceOrderDisabled}
            className='w-full bg-[#2c6449] text-white py-2 text-xs'
            onClick={isPlaceOrderDisabled ? undefined : placeOrder}
          >
            Pay Now
          </Button>
        </div>
      </div>

      {/* ==================== ADDRESS MODAL ==================== */}
      {showAddressModal && (
        <div className='fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black bg-opacity-40'>
          <div className='relative mt-16 w-full sm:w-[90%] sm:max-w-lg bg-white rounded-lg shadow-lg'>
            <div className='flex items-center justify-between border-b px-4 py-2'>
              <h2 className='text-lg font-semibold'>Select Delivery Address</h2>
              <button
                onClick={cancelAddressModal}
                className='text-gray-600 hover:text-gray-800'
              >
                ✕
              </button>
            </div>

            {isAddingNew ? (
              <div className='p-4 space-y-3 max-h-[80vh] overflow-y-auto'>
                <MapAddressPicker onPick={handleMapSelect} />
                {newAddressData && (
                  <div className='space-y-2'>
                    <div>
                      <label className='block text-xs font-medium'>
                        Alias (e.g. “Home”):
                      </label>
                      <input
                        type='text'
                        value={newAlias}
                        onChange={(e) => setNewAlias(e.target.value)}
                        className='mt-1 w-full border px-2 py-1 rounded text-xs'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium'>Name:</label>
                      <input
                        type='text'
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className='mt-1 w-full border px-2 py-1 rounded text-xs'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium'>
                        Phone:
                      </label>
                      <input
                        type='text'
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className='mt-1 w-full border px-2 py-1 rounded text-xs'
                      />
                    </div>
                    <p className='text-gray-600 text-xs'>
                      Formatted: {newAddressData.formatted}
                    </p>
                    <div className='flex justify-end gap-2 pt-2'>
                      <Button
                        variant='outline'
                        className='text-xs px-3 py-1'
                        onClick={() => {
                          setIsAddingNew(false);
                          setNewAddressData(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className='text-xs px-3 py-1 bg-blue-600 text-white'
                        onClick={saveNewAddress}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className='max-h-[80vh] overflow-y-auto p-4 space-y-3'>
                  {addresses.map((addr) => {
                    const isSelected = modalSelectedAddressId === addr.id;
                    const isEditing = editingAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        className={`border rounded-md p-3 cursor-pointer ${
                          isSelected ? "bg-blue-50 border-blue-300" : "bg-white"
                        }`}
                        onClick={() =>
                          !isEditing && selectModalAddress(addr.id)
                        }
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium text-sm'>{addr.alias}</p>
                            {addr.isDefault && (
                              <span className='bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full'>
                                Default
                              </span>
                            )}
                          </div>
                          <div className='flex items-center gap-2'>
                            {isEditing ? (
                              <>
                                <button
                                  className='text-green-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveEditAddress(addr.id);
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className='text-red-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelEditAddress();
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className='text-blue-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingAddress(addr);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className='text-red-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Delete logic could go here
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className='mt-2 space-y-2 text-xs'>
                            <div>
                              <label className='block font-medium'>Name:</label>
                              <input
                                type='text'
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className='mt-1 w-full border px-2 py-1 rounded text-xs'
                              />
                            </div>
                            <div>
                              <label className='block font-medium'>
                                Phone:
                              </label>
                              <input
                                type='text'
                                value={editingPhone}
                                onChange={(e) =>
                                  setEditingPhone(e.target.value)
                                }
                                className='mt-1 w-full border px-2 py-1 rounded text-xs'
                              />
                            </div>
                          </div>
                        ) : (
                          <div className='mt-2 text-xs'>
                            <p>
                              <span className='font-medium'>Name: </span>
                              {addr.authPersonName}
                            </p>
                            <p className='mt-1'>
                              <span className='font-medium'>Address: </span>
                              {addr.formatted}
                            </p>
                            <p className='mt-1'>
                              <span className='font-medium'>Phone: </span>
                              {addr.authPersonMobile}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className='border-t px-4 py-2 flex items-center justify-between text-xs'>
                  <button
                    className='text-blue-600 hover:underline'
                    onClick={startAddingNewAddress}
                  >
                    Add New Address
                  </button>
                  <div className='space-x-2'>
                    <Button
                      variant='outline'
                      className='text-xs px-3 py-1'
                      onClick={cancelAddressModal}
                    >
                      CANCEL
                    </Button>
                    <Button
                      className='text-xs px-3 py-1 bg-blue-600 text-white'
                      onClick={confirmModalSelection}
                    >
                      CONFIRM
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== CARD MODAL ==================== */}
      {showCardModal && (
        <div className='fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black bg-opacity-40'>
          <div className='relative mt-16 w-full sm:w-[90%] sm:max-w-lg bg-white rounded-lg shadow-lg'>
            <div className='flex items-center justify-between border-b px-4 py-2'>
              <h2 className='text-lg font-semibold'>Select Payment Card</h2>
              <button
                onClick={cancelCardModal}
                className='text-gray-600 hover:text-gray-800'
              >
                ✕
              </button>
            </div>

            {isAddingNewCard ? (
              <div className='p-4 space-y-3 max-h-[80vh] overflow-y-auto'>
                {/* Input fields for new card */}
                <div>
                  <label className='block text-xs font-medium'>
                    Card Number
                  </label>
                  <input
                    type='text'
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(e.target.value)}
                    className='mt-1 w-full border px-2 py-1 rounded text-xs'
                    placeholder='1234 5678 9012 3456'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium'>Brand</label>
                  <input
                    type='text'
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    className='mt-1 w-full border px-2 py-1 rounded text-xs'
                    placeholder='Visa'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium'>
                    Expiry (MM/YY)
                  </label>
                  <input
                    type='text'
                    value={newCardExpiry}
                    onChange={(e) => setNewCardExpiry(e.target.value)}
                    className='mt-1 w-full border px-2 py-1 rounded text-xs'
                    placeholder='04/25'
                  />
                </div>
                <div className='flex justify-end gap-2 pt-2'>
                  <Button
                    variant='outline'
                    className='text-xs px-3 py-1'
                    onClick={() => setIsAddingNewCard(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className='text-xs px-3 py-1 bg-blue-600 text-white'
                    onClick={saveNewCard}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className='max-h-[80vh] overflow-y-auto p-4 space-y-3'>
                  {savedCards.map((c) => {
                    const isSelected = modalSelectedCardId === c.id;
                    const isEditing = editingCardId === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`border rounded-md p-3 cursor-pointer ${
                          isSelected ? "bg-blue-50 border-blue-300" : "bg-white"
                        }`}
                        onClick={() => !isEditing && selectModalCard(c.id)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='flex-1 font-medium text-sm'>
                              {(c.brand || "CARD").toUpperCase()} **** {c.last4}
                            </span>
                            <img
                              src='/images/payments/card.png'
                              alt='Card'
                              className='w-5 h-5 object-contain'
                            />
                          </div>
                          <div className='flex items-center gap-2'>
                            {isEditing ? (
                              <>
                                <button
                                  className='text-green-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveEditCard(c.id);
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className='text-red-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelEditCard();
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className='text-blue-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingCard(c);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className='text-red-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: delete card logic
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className='mt-2 space-y-2 text-xs'>
                            <div>
                              <label className='block font-medium'>
                                Brand:
                              </label>
                              <input
                                type='text'
                                value={editingCardName}
                                onChange={(e) =>
                                  setEditingCardName(e.target.value)
                                }
                                className='mt-1 w-full border px-2 py-1 rounded text-xs'
                              />
                            </div>
                            <div>
                              <label className='block font-medium'>
                                Expiry:
                              </label>
                              <input
                                type='text'
                                value={editingCardExpiry}
                                onChange={(e) =>
                                  setEditingCardExpiry(e.target.value)
                                }
                                className='mt-1 w-full border px-2 py-1 rounded text-xs'
                              />
                            </div>
                          </div>
                        ) : (
                          <div className='mt-2 text-xs'>
                            <p className='text-gray-500 text-[10px]'>
                              Exp: {c.expiry}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className='border-t px-4 py-2 flex items-center justify-between text-xs'>
                  <button
                    className='text-blue-600 hover:underline'
                    onClick={startAddingNewCard}
                  >
                    Add New Card
                  </button>
                  <div className='space-x-2'>
                    <Button
                      variant='outline'
                      className='text-xs px-3 py-1'
                      onClick={cancelCardModal}
                    >
                      CANCEL
                    </Button>
                    <Button
                      className='text-xs px-3 py-1 bg-blue-600 text-white'
                      onClick={confirmCardSelection}
                    >
                      CONFIRM
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
