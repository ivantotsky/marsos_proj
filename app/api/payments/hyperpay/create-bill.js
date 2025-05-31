// pages/api/payments/hyperpay/create-bill.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { amount, supplierId } = req.body;
  const { HYPERPAY_ACCESS_TOKEN, HYPERPAY_ENTITY_ID } = process.env;

  const params = new URLSearchParams({
    entityId: HYPERPAY_ENTITY_ID,
    amount: amount.toFixed(2),
    currency: "SAR",
    paymentType: "DB", // “DB”=debit/card
    merchantTransactionId: supplierId + "_" + Date.now(),
    // callback URLs:
    "customParameters[successUrl]": `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/${supplierId}/success`,
    "customParameters[failureUrl]": `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/${supplierId}/cancel`,
  });

  try {
    const apiRes = await fetch(
      `https://test.oppwa.com/v1/checkouts?${params.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HYPERPAY_ACCESS_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("HyperPay error:", text);
      return res.status(502).json({ error: text });
    }

    const data = await apiRes.json();
    // data.id is the checkout id; redirect user to the widget URL:
    const redirectUrl = data.redirect?.url;
    return res.status(200).json({ redirectUrl });
  } catch (err) {
    console.error("HyperPay catch:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
