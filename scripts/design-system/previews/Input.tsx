import { Input } from "chunks-ui";
import { SearchIcon } from "lucide-react";
import { InputErrorExample } from "../../../apps/docs/app/examples/Input";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row className="max-w-sm flex-col items-stretch">
      <Input placeholder="Enter your name" aria-label="Name" />
      <Input
        startAdornment={<SearchIcon className="size-4" />}
        placeholder="Search..."
        aria-label="Search"
      />
      <Input
        endAdornment={<span className="text-xs text-muted-foreground">USD</span>}
        placeholder="0.00"
        aria-label="Amount"
      />
      <Input
        type="search"
        defaultValue="Hello"
        clearable
        placeholder="Search..."
        aria-label="Search"
      />
    </Row>
    <InputErrorExample />
  </>,
  { row: true },
);
