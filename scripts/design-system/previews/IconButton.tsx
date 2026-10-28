import { IconButton } from "chunks-ui";
import { CheckIcon, PlusIcon, SearchIcon, SettingsIcon, TrashIcon } from "lucide-react";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row>
      <IconButton variant="contained" aria-label="Add">
        <PlusIcon />
      </IconButton>
      <IconButton variant="outlined" aria-label="Add">
        <PlusIcon />
      </IconButton>
      <IconButton variant="text" aria-label="Add">
        <PlusIcon />
      </IconButton>
    </Row>
    <Row>
      <IconButton variant="contained" color="primary" aria-label="Search">
        <SearchIcon />
      </IconButton>
      <IconButton variant="contained" color="destructive" aria-label="Delete">
        <TrashIcon />
      </IconButton>
      <IconButton variant="contained" color="success" aria-label="Confirm">
        <CheckIcon />
      </IconButton>
      <IconButton variant="contained" color="warning" aria-label="Settings">
        <SettingsIcon />
      </IconButton>
      <IconButton variant="contained" color="secondary" aria-label="Add">
        <PlusIcon />
      </IconButton>
    </Row>
    <Row>
      <IconButton variant="outlined" color="destructive" aria-label="Delete">
        <TrashIcon />
      </IconButton>
      <IconButton variant="text" color="success" aria-label="Confirm">
        <CheckIcon />
      </IconButton>
    </Row>
  </>,
);
