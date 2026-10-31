// Chỉ giữ nhóm người đứng đầu trong bộ nhớ khi bảng công đức đã rất lớn.
// Hai người bằng điểm vẫn xếp theo thứ tự xuất hiện như Array.sort ổn định.
function topDevotees(devotees, limit = 24) {
  if (limit <= 0) return [];
  const heap = [];
  let index = 0;
  const worse = (a, b) => a.devotee.merit < b.devotee.merit ||
    (a.devotee.merit === b.devotee.merit && a.index > b.index);

  for (const key in devotees) {
    if (!Object.hasOwn(devotees, key)) continue;
    const entry = { devotee: devotees[key], index: index++ };
    if (heap.length < limit) {
      let pos = heap.push(entry) - 1;
      while (pos > 0) {
        const parent = (pos - 1) >> 1;
        if (!worse(heap[pos], heap[parent])) break;
        [heap[pos], heap[parent]] = [heap[parent], heap[pos]];
        pos = parent;
      }
    } else if (entry.devotee.merit > heap[0].devotee.merit) {
      heap[0] = entry;
      let pos = 0;
      while (true) {
        const left = pos * 2 + 1;
        const right = left + 1;
        let worst = pos;
        if (left < heap.length && worse(heap[left], heap[worst])) worst = left;
        if (right < heap.length && worse(heap[right], heap[worst])) worst = right;
        if (worst === pos) break;
        [heap[pos], heap[worst]] = [heap[worst], heap[pos]];
        pos = worst;
      }
    }
  }

  heap.sort((a, b) => b.devotee.merit - a.devotee.merit || a.index - b.index);
  return heap.map(item => item.devotee);
}

module.exports = { topDevotees };
