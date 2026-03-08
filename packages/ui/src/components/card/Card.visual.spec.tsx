import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Card } from "./index";

describe("Card", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(
      <Card.Root style={{ width: 350 }}>
        <Card.Header>
          <Card.Title>Card Title</Card.Title>
          <Card.Description>Card description goes here.</Card.Description>
        </Card.Header>
        <Card.Content>
          <p>Card content body.</p>
        </Card.Content>
        <Card.Footer>
          <span className="text-muted-foreground text-sm">Footer</span>
        </Card.Footer>
      </Card.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});
