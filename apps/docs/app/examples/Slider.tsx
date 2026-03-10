"use client";

import { Slider } from "chunks-ui";
import { Container } from "@/components";

export function SliderBasicExample() {
  return (
    <Container centered={false}>
      <div className="w-full max-w-sm">
        <Slider.Root defaultValue={40}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb aria-label="Value" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>
    </Container>
  );
}

export function SliderWithValueExample() {
  return (
    <Container>
      <div className="w-full max-w-sm">
        <Slider.Root defaultValue={60}>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Volume</span>
            <Slider.Value />
          </div>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb aria-label="Volume" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>
    </Container>
  );
}

export function SliderRangeExample() {
  return (
    <Container>
      <div className="w-full max-w-sm">
        <Slider.Root defaultValue={[20, 80]}>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Price range</span>
            <Slider.Value />
          </div>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} aria-label="Minimum" />
              <Slider.Thumb index={1} aria-label="Maximum" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>
    </Container>
  );
}

export function SliderVerticalExample() {
  return (
    <Container>
      <div className="flex h-40 items-center gap-8">
        <Slider.Root defaultValue={30} orientation="vertical">
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb aria-label="Value" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <Slider.Root defaultValue={70} orientation="vertical">
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb aria-label="Value" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>
    </Container>
  );
}

export function SliderDisabledExample() {
  return (
    <Container>
      <div className="w-full max-w-sm">
        <Slider.Root defaultValue={50} disabled>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb aria-label="Value" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>
    </Container>
  );
}
