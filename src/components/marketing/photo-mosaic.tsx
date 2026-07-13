import { Photo } from "@/components/shared/photo";
import { cn } from "@/lib/utils";

// Life-here gallery mosaic: first tile spans both rows, four more fill the grid.
const tiles = [
  { slot: "life-g1", label: "Life at Wesley", span: true },
  { slot: "life-g2", label: "Activity", span: false },
  { slot: "life-g3", label: "Garden", span: false },
  { slot: "life-g4", label: "Dining", span: false },
  { slot: "life-g5", label: "Celebration", span: false },
];

export function PhotoMosaic() {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr] grid-rows-[200px_200px] gap-[14px] max-md:grid-cols-1 max-md:grid-rows-none">
      {tiles.map((tile) => (
        <div
          key={tile.slot}
          className={cn(
            "relative overflow-hidden rounded-[18px] max-md:h-[200px]",
            tile.span && "row-span-2",
          )}
        >
          <Photo slot={tile.slot} alt={tile.label} placeholder={tile.label} />
        </div>
      ))}
    </div>
  );
}
