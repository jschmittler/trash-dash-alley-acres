const DEFAULT_OPTIONS = Object.freeze({
  baseline: 610,
  cellSize: 8,
  joinRadius: 1,
  minimumArea: 220,
});

const cellIndex = (x, y, columns) => y * columns + x;

function labelOccupiedCells(data, info, options) {
  const columns = Math.ceil(info.width / options.cellSize);
  const rows = Math.ceil(info.height / options.cellSize);
  const occupied = new Uint8Array(columns * rows);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha > 0) {
        occupied[
          cellIndex(
            Math.floor(x / options.cellSize),
            Math.floor(y / options.cellSize),
            columns,
          )
        ] = 1;
      }
    }
  }

  const joined = new Uint8Array(occupied.length);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!occupied[cellIndex(x, y, columns)]) continue;
      for (let dy = -options.joinRadius; dy <= options.joinRadius; dy += 1) {
        for (let dx = -options.joinRadius; dx <= options.joinRadius; dx += 1) {
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextX >= columns || nextY < 0 || nextY >= rows) {
            continue;
          }
          joined[cellIndex(nextX, nextY, columns)] = 1;
        }
      }
    }
  }

  const labels = new Int32Array(joined.length);
  labels.fill(-1);
  let label = 0;
  const queue = [];

  for (let start = 0; start < joined.length; start += 1) {
    if (!joined[start] || labels[start] !== -1) continue;
    labels[start] = label;
    queue.push(start);

    while (queue.length) {
      const current = queue.pop();
      const x = current % columns;
      const y = Math.floor(current / columns);
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nextX, nextY] of neighbors) {
        if (nextX < 0 || nextX >= columns || nextY < 0 || nextY >= rows) {
          continue;
        }
        const next = cellIndex(nextX, nextY, columns);
        if (!joined[next] || labels[next] !== -1) continue;
        labels[next] = label;
        queue.push(next);
      }
    }
    label += 1;
  }

  return { columns, labels };
}

export function groundedComponentBaselines(data, info, customOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  const { columns, labels } = labelOccupiedCells(data, info, options);
  const components = new Map();

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha === 0) continue;
      const label = labels[
        cellIndex(
          Math.floor(x / options.cellSize),
          Math.floor(y / options.cellSize),
          columns,
        )
      ];
      const component = components.get(label) ?? {
        label,
        area: 0,
        minX: x,
        maxX: x,
        minY: y,
        maxY: y,
      };
      component.area += 1;
      component.minX = Math.min(component.minX, x);
      component.maxX = Math.max(component.maxX, x);
      component.minY = Math.min(component.minY, y);
      component.maxY = Math.max(component.maxY, y);
      components.set(label, component);
    }
  }

  return {
    columns,
    labels,
    options,
    components: [...components.values()].sort((a, b) => b.area - a.area),
  };
}

export function normalizeGroundedComponents(data, info, customOptions = {}) {
  const audit = groundedComponentBaselines(data, info, customOptions);
  const shifts = new Map(
    audit.components.map((component) => [
      component.label,
      component.area >= audit.options.minimumArea
        ? audit.options.baseline - component.maxY
        : 0,
    ]),
  );
  const output = Buffer.alloc(data.length);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const source = (y * info.width + x) * info.channels;
      if (data[source + 3] === 0) continue;
      const label = audit.labels[
        cellIndex(
          Math.floor(x / audit.options.cellSize),
          Math.floor(y / audit.options.cellSize),
          audit.columns,
        )
      ];
      const destinationY = y + (shifts.get(label) ?? 0);
      if (destinationY < 0 || destinationY >= info.height) continue;
      const destination = (destinationY * info.width + x) * info.channels;
      if (output[destination + 3] > data[source + 3]) continue;
      for (let channel = 0; channel < info.channels; channel += 1) {
        output[destination + channel] = data[source + channel];
      }
    }
  }

  return { data: output, info, audit };
}
