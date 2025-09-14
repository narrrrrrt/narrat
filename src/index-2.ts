export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // --- アセット優先 ---
    const assetResponse = await env.ASSETS.fetch(request.clone());
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // --- 部屋IDとアクション抽出 ---
    const [, roomId, action] = url.pathname.split("/");

    const allowed = ["1", "2", "3", "4"];
    if (!allowed.includes(roomId)) {
      return new Response("Room not allowed", { status: 403 });
    }

    try {
      // DO にフォワード
      const id = env.RoomDO.idFromName(roomId);
      const stub = env.RoomDO.get(id);

      return await stub.fetch(
        new Request(`http://do/${action}${url.search}`, request)
      );
    } catch (err: any) {
      // エラーを握りつぶさず、200でエラーメッセージ返す
      return new Response(
        `DO error intercepted at index.ts: ${(err && err.message) || String(err)}`,
        { status: 200 }
      );
    }
  },
};

export { RoomDO } from "./durable/RoomDO";