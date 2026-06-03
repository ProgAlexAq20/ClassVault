import type { PaymentStatus } from "@/modules/auth/types/auth.types";

type PixWebhookBody = {
  uid?: string;
  email?: string;
  eventType?: "payment.approved" | "payment.rejected" | "payment.pending";
};

type PixWebhookRequest = {
  body?: PixWebhookBody;
};

type PixWebhookResponse = {
  status: (code: number) => {
    json: (body: { ok: boolean; paymentStatus?: PaymentStatus; target?: string; error?: string }) => void;
  };
};

function paymentStatusForEvent(eventType: PixWebhookBody["eventType"]): PaymentStatus {
  if (eventType === "payment.approved") return "active";
  if (eventType === "payment.pending") return "pending";
  return "beta";
}

export async function handlePixWebhook(req: PixWebhookRequest, res: PixWebhookResponse) {
  const event = req.body;
  const target = event?.uid ?? event?.email?.toLowerCase();

  if (!event?.eventType || !target) {
    res.status(400).json({ ok: false, error: "Payload invalido." });
    return;
  }

  res.status(202).json({
    ok: true,
    paymentStatus: paymentStatusForEvent(event.eventType),
    target
  });
}

export default handlePixWebhook;
