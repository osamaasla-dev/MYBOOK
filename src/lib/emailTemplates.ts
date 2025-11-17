import type { Order, OrderItem, User } from "@prisma/client";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function buildInvoiceHtml(params: {
  order: Order;
  items: (OrderItem & { name?: string })[];
  user: Pick<User, "name" | "email">;
  paymentMethodLabel: string;
  status: "Success" | "Failed";
}) {
  const { order, items, user, paymentMethodLabel, status } = params;
  const rows = items
    .map((i) => {
      const name = i.name ?? "Item";
      const price = i.price ?? 0;
      const line = price * i.quantity;
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee; text-align:center">${
          i.quantity
        }</td>
        <td style="padding:8px;border-bottom:1px solid #eee; text-align:right">${usd.format(
          price
        )}</td>
        <td style="padding:8px;border-bottom:1px solid #eee; text-align:right">${usd.format(
          line
        )}</td>
      </tr>`;
    })
    .join("");

  const total = usd.format(order.total);

  return `
  <div style="font-family:Tahoma, Arial, sans-serif; direction:rtl; text-align:right">
    <h2>فاتورة الطلب</h2>
    <p>مرحبًا ${user.name || "عميلنا الكريم"}،</p>
    <p>تم معالجة طلبك بالحالة: <strong>${status}</strong></p>

    <h3>بيانات الطلب</h3>
    <ul style="list-style:none; padding:0">
      <li><strong>رقم الطلب:</strong> ${order.id}</li>
      <li><strong>إجمالي السعر:</strong> ${total}</li>
      <li><strong>طريقة الدفع:</strong> ${paymentMethodLabel}</li>
      <li><strong>حالة الطلب:</strong> ${status}</li>
    </ul>

    <h3>تفاصيل المنتجات</h3>
    <table style="width:100%; border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:right; padding:8px; border-bottom:2px solid #ccc">المنتج</th>
          <th style="text-align:center; padding:8px; border-bottom:2px solid #ccc">الكمية</th>
          <th style="text-align:right; padding:8px; border-bottom:2px solid #ccc">السعر</th>
          <th style="text-align:right; padding:8px; border-bottom:2px solid #ccc">الإجمالي</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="margin-top:16px">شكرًا لتسوقك معنا.</p>
  </div>`;
}

export function buildFailureHtml(params: {
  order: Order;
  items: (OrderItem & { name?: string })[];
  user: Pick<User, "name" | "email">;
  retryUrl: string;
  paymentMethodLabel: string;
}) {
  const { order, items, user, retryUrl, paymentMethodLabel } = params;
  const invoice = buildInvoiceHtml({
    order,
    items,
    user,
    paymentMethodLabel,
    status: "Failed",
  });
  return (
    invoice +
    `
    <div style="font-family:Tahoma, Arial, sans-serif; direction:rtl; text-align:right">
      <p>للأسف، عملية الدفع لم تكتمل. يمكنك المحاولة مرة أخرى من خلال الرابط التالي:</p>
      <p><a href="${retryUrl}" target="_blank">إعادة المحاولة</a></p>
    </div>`
  );
}
