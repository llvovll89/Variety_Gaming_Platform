export interface GridEntry<T> {
  id: number;
  x: number;
  y: number;
  data: T;
}

/** Generic uniform spatial hash grid for fast radius/rect queries over point entities. */
export class SpatialHashGrid<T> {
  private cellSize: number;
  private cells = new Map<string, GridEntry<T>[]>();
  private entryCell = new Map<number, string>();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private key(cx: number, cy: number): string {
    return cx + "," + cy;
  }

  private cellOf(x: number, y: number): [number, number] {
    return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)];
  }

  clear(): void {
    this.cells.clear();
    this.entryCell.clear();
  }

  insert(id: number, x: number, y: number, data: T): void {
    const [cx, cy] = this.cellOf(x, y);
    const key = this.key(cx, cy);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push({ id, x, y, data });
    this.entryCell.set(id, key);
  }

  remove(id: number): void {
    const key = this.entryCell.get(id);
    if (key === undefined) return;
    const bucket = this.cells.get(key);
    if (bucket) {
      const idx = bucket.findIndex((e) => e.id === id);
      if (idx !== -1) bucket.splice(idx, 1);
      if (bucket.length === 0) this.cells.delete(key);
    }
    this.entryCell.delete(id);
  }

  /** Collects every entry whose cell overlaps a square of the given half-extent around (x, y). */
  queryRadius(x: number, y: number, radius: number): GridEntry<T>[] {
    const results: GridEntry<T>[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) results.push(...bucket);
      }
    }
    return results;
  }

  /** Collects every entry whose cell overlaps the given world-space rectangle. */
  queryRect(minX: number, minY: number, maxX: number, maxY: number): GridEntry<T>[] {
    const results: GridEntry<T>[] = [];
    const minCx = Math.floor(minX / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) results.push(...bucket);
      }
    }
    return results;
  }
}
