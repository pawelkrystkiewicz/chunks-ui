"use client";

import { Avatar, Button, Card } from "chunks-ui";
import { Container } from "@/components";

export function CardBasicExample() {
  return (
    <Container>
      <Card.Root>
        <Card.Header>
          <Card.Title>Project Alpha</Card.Title>
          <Card.Description>A brief description of the project.</Card.Description>
        </Card.Header>
        <Card.Content>
          <p>Main content goes here.</p>
        </Card.Content>
        <Card.Footer>
          <Button variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button>Save</Button>
        </Card.Footer>
      </Card.Root>
    </Container>
  );
}

export function CardMinimalExample() {
  return (
    <Container>
      <Card.Root>
        <Card.Content>
          <p>Simple card with content only.</p>
        </Card.Content>
      </Card.Root>
    </Container>
  );
}

export function CardCustomContentExample() {
  return (
    <Container>
      <Card.Root className="max-w-sm">
        <Card.Header>
          <Card.Title>Team Members</Card.Title>
          <Card.Description>Manage your team members and roles.</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar alt="Alice Johnson" size={32} />
              <div>
                <p className="font-medium text-sm">Alice Johnson</p>
                <p className="text-muted-foreground text-xs">Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Avatar alt="Bob Smith" size={32} />
              <div>
                <p className="font-medium text-sm">Bob Smith</p>
                <p className="text-muted-foreground text-xs">Member</p>
              </div>
            </div>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button>Invite Member</Button>
        </Card.Footer>
      </Card.Root>
    </Container>
  );
}
