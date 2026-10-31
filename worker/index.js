

function json(data, status = 200) {

  return new Response(JSON.stringify(data), {

    status,

    headers: {

      "Content-Type": "application/json; charset=utf-8",

      "Cache-Control": "no-store"

    }

  });

}

function escapeHtml(value) {

  return String(value ?? "").replace(/[&<>"']/g, char => ({

    "&": "&amp;",

    "<": "&lt;",

    ">": "&gt;",

    '"': "&quot;",

    "'": "&#39;"

  })[char]);

}

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    const path = url.pathname;

    try {

      // Получение каталога товаров

      if (request.method === "GET" && path === "/api/products") {

        if (!env.DB) return json({ error: "База данных не подключена" }, 503);

        const result = await env.DB.prepare(

          `SELECT id, name, category, price, description, image,

                  stock, active

           FROM products

           WHERE active = 1

           ORDER BY id DESC`

        ).all();

        return json({ products: result.results || [] });

      }

      // Создание заказа

      if (request.method === "POST" && path === "/api/orders") {

        if (!env.DB) return json({ error: "База данных не подключена" }, 503);

        const body = await request.json();

        const name = String(body.name || "").trim();

        const phone = String(body.phone || "").trim();

        const address = String(body.address || "").trim();

        const comment = String(body.comment || "").trim();

        const requestedItems = body.items;

        if (name.length < 2 || name.length > 100) {

          return json({ error: "Проверьте имя" }, 400);

        }

        if (phone.length < 6 || phone.length > 30) {

          return json({ error: "Проверьте номер телефона" }, 400);

        }

        if (!Array.isArray(requestedItems) ||

            requestedItems.length === 0 ||

            requestedItems.length > 30) {

          return json({ error: "Корзина пуста или слишком большая" }, 400);

        }

        // Цены берём из базы, а не из браузера покупателя

        const orderItems = [];

        let total = 0;

        for (const item of requestedItems) {

          const id = Number(item.id);

          const quantity = Number(item.quantity);

          if (!Number.isInteger(id) || id < 1 ||

              !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {

            return json({ error: "Некорректный товар или количество" }, 400);

          }

          const product = await env.DB.prepare(

            `SELECT id, name, price, stock

             FROM products

             WHERE id = ? AND active = 1`

          ).bind(id).first();

          if (!product || !product.stock) {

            return json({ error: "Один из товаров отсутствует в наличии" }, 400);

          }

          const price = Number(product.price);

          if (!Number.isFinite(price) || price < 0) {

            return json({ error: "Некорректная цена товара" }, 400);

          }

          orderItems.push({

            id: product.id,

            name: product.name,

            price,

            quantity

          });

          total += price * quantity;

        }

        const result = await env.DB.prepare(

          `INSERT INTO orders

           (name, phone, address, comment, items, total, status, created_at)

           VALUES (?, ?, ?, ?, ?, ?, 'new', datetime('now'))`

        ).bind(

          name,

          phone,

          address,

          comment,

          JSON.stringify(orderItems),

          total

        ).run();

        const orderId = result.meta?.last_row_id || "новый";

        // Уведомление в Telegram. Сам заказ уже сохранён в базе.

        let telegramSent = false;

        if (env.BOT_TOKEN && env.ADMIN_CHAT_ID) {

          const itemText = orderItems.map(item =>

            `• ${escapeHtml(item.name)} — ${item.quantity} × ${item.price} ₽`

          ).join("\n");

          const message =

            `🛍 <b>Новый заказ №${orderId}</b>\n\n` +

            `<b>Имя:</b> ${escapeHtml(name)}\n` +

            `<b>Телефон:</b> ${escapeHtml(phone)}\n` +

            `<b>Адрес:</b> ${escapeHtml(address || "Не указан")}\n\n` +

            `<b>Товары:</b>\n${itemText}\n\n` +

            `<b>Итого: ${total.toLocaleString("ru-RU")} ₽</b>\n` +

            `<b>Комментарий:</b> ${escapeHtml(comment || "Нет")}`;

          try {

            const telegramResponse = await fetch(

              `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,

              {

                method: "POST",

                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({

                  chat_id: env.ADMIN_CHAT_ID,

                  text: message,

                  parse_mode: "HTML"

                })

              }

            );

            telegramSent = telegramResponse.ok;

          } catch (error) {

            console.error("Telegram notification failed:", error);

          }

        }

        return json({

          success: true,

          orderId,

          telegramSent

        }, 201);

      }

      // Остальные страницы сайта отдаёт Cloudflare Pages/Workers Assets

      if (env.ASSETS) {

        return env.ASSETS.fetch(request);

      }

      return json({ error: "Страница не найдена" }, 404);

    } catch (error) {

      console.error("Worker error:", error);

      return json({ error: "Внутренняя ошибка сервера" }, 500);

    }

  }

};
