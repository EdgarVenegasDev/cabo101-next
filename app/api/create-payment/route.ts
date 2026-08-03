//app/api/create-payment/route.ts
import { MercadoPagoConfig, Preference } from "mercadopago";

export const dynamic = "force-dynamic";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { amount, email } = await req.json();

    if (!amount) {
      return Response.json({ error: "Amount required" }, { status: 400 });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: `service-${Date.now()}`,
            title: "Transfer Service",
            quantity: 1,
            unit_price: Number(amount),
          },
        ],

        payer: {
          email: email || undefined,
        },

        back_urls: {
          success: "https://cabo101.com.mx/succes",
          failure: "https://cabo101.com.mx/error",
        },

        notification_url: "https://cabo101.com.mx/api/webhook/mercadopago",
      },
    });

    return Response.json({
      url: result.init_point,
    });

  } catch (error) {
    console.error(error);
    return Response.json({ error: true }, { status: 500 });
  }
}