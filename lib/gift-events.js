// Chỉ tính phần tăng thêm của quà tặng liên tục, không tính lại bản tin kết thúc.
class GiftEventCounter {
  constructor(now = () => Date.now()) {
    this.now = now;
    this.groups = new Map();
    this.completed = new Map();
  }

  count(data, userId, giftId) {
    const now = this.now();
    const group = data.groupId == null ? '' : String(data.groupId);
    const rawCount = Number(data.repeatCount ?? data.comboCount ?? data.gift?.repeat_count ?? 1);
    const count = Number.isFinite(rawCount) ? Math.max(1, Math.min(9999, Math.floor(rawCount))) : 1;
    const ended = Boolean(data.repeatEnd ?? data.gift?.repeat_end);
    const key = `${userId || 'khach'}:${giftId}:${group || 'khong-co-nhom'}`;

    for (const [id, stamp] of this.completed) {
      if (now - stamp > 10000) this.completed.delete(id);
    }
    for (const [id, entry] of this.groups) {
      if (now - entry.time > 60000) this.groups.delete(id);
    }

    // Một số bản TikTok không cấp mã nhóm cho quà tặng theo chuỗi.
    // Trong trường hợp đó chỉ ghi nhận bản tin cuối cùng của quà theo chuỗi.
    // Quà đơn lẻ không có mã nhóm được tính theo từng sự kiện thật.
    if (!group) {
      const giftType = data?.giftDetails?.giftType ?? data?.gift?.gift_type ??
        data?.giftType ?? data?.gift_type ?? data?.extendedGiftInfo?.type;
      if ((giftType === 1 || giftType === '1') && !ended) return 0;
      if (data.repeatEnd === false && count > 1) return 0;
      const messageId = data?.common?.msgId ?? data?.msgId ?? data?.messageId;
      if (ended && messageId != null) {
        const eventKey = `${key}:${String(messageId)}`;
        if (this.completed.has(eventKey)) return 0;
        this.completed.set(eventKey, now);
      }
      return count;
    }
    // Chỉ dùng dấu nhóm do TikTok cấp để chặn bản tin kết thúc trùng.
    // Nếu không có dấu nhóm, khóa người + quà không đủ để phân biệt hai lần gửi thật.
    if (group && this.completed.has(key)) return 0;

    const previous = this.groups.get(key)?.count || 0;
    const delta = Math.max(0, count - previous);
    if (ended) {
      this.groups.delete(key);
      if (group) this.completed.set(key, now);
    } else {
      this.groups.set(key, { count, time: now });
    }
    return delta;
  }
}

module.exports = { GiftEventCounter };
