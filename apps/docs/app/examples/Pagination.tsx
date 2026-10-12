"use client";

import { Pagination } from "chunks-ui";
import type { MouseEvent } from "react";
import { Container } from "@/components";

// The demo has no pages to go to, so these links stay on the page when clicked
const stayOnPage = (event: MouseEvent) => event.preventDefault();

export function PaginationBasicExample() {
  return (
    <Container>
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous href="#" onClick={stayOnPage} />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage}>
              1
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage} active>
              2
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage}>
              3
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next href="#" onClick={stayOnPage} />
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>
    </Container>
  );
}

export function PaginationWithEllipsisExample() {
  return (
    <Container>
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous href="#" onClick={stayOnPage} />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage}>
              1
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage}>
              4
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage} active>
              5
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage}>
              6
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#" onClick={stayOnPage}>
              12
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next href="#" onClick={stayOnPage} />
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>
    </Container>
  );
}
