import { Slider } from "chunks-ui";
import { mount } from "./_shared";

const Track = ({ label, n = 1 }: { label: string; n?: number }) => (
  <Slider.Control>
    <Slider.Track>
      <Slider.Indicator />
      {Array.from({ length: n }, (_, i) => (
        <Slider.Thumb
          key={i}
          aria-label={n > 1 ? `${label} ${i ? "maximum" : "minimum"}` : label}
        />
      ))}
    </Slider.Track>
  </Slider.Control>
);
mount(
  <div className="grid w-full max-w-2xl grid-cols-2 gap-x-12 gap-y-8 py-4">
    <Slider.Root defaultValue={40}>
      <Track label="Value" />
    </Slider.Root>
    <Slider.Root defaultValue={60}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Volume</span>
        <Slider.Value />
      </div>
      <Track label="Volume" />
    </Slider.Root>
    <Slider.Root defaultValue={[20, 80]}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Price range</span>
        <Slider.Value />
      </div>
      <Track label="Price" n={2} />
    </Slider.Root>
    <Slider.Root defaultValue={30} disabled>
      <Track label="Disabled" />
    </Slider.Root>
  </div>,
);
